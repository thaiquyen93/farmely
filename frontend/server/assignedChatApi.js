const send = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
};

const readBody = (req) => new Promise((resolve, reject) => {
  let raw = '';
  req.on('data', (chunk) => { raw += chunk; });
  req.on('end', () => {
    try { resolve(JSON.parse(raw || '{}')); } catch (error) { reject(error); }
  });
  req.on('error', reject);
});

export const actorFromToken = async (req) => {
  const authorization = req.headers.authorization || '';
  if (!/^Bearer\s+\S+$/i.test(authorization)) return null;
  const response = await fetch(`${process.env.IDENTITY_SERVICE_URL || 'http://localhost:8081'}/api/auth/me`, {
    headers: { Authorization: authorization }
  });
  if (!response.ok) return null;
  const body = await response.json();
  return body.data?.userId ? body.data : body.data?.user || null;
};

const allowedConversation = `
  SELECT c.conversation_id, c.participant_one, c.participant_two, c.type,
         r.rental_id, p.plot_id, p.plot_code, v.variety_name,
         u1.full_name AS partner_name, u2.full_name AS expert_name
  FROM conversations c
  LEFT JOIN rentals r ON r.rental_id = c.rental_id
  LEFT JOIN plots p ON p.plot_id = r.plot_id
  LEFT JOIN varieties v ON v.variety_id = r.variety_id
  LEFT JOIN users u1 ON u1.user_id = c.participant_one
  LEFT JOIN users u2 ON u2.user_id = c.participant_two
  JOIN contracts contract ON contract.contract_id = r.contract_id
  WHERE c.status = 'OPEN' AND r.status = 'ACTIVE'
    AND ((c.type = 'STAFF_EXP' AND c.participant_one = r.staff_id
          AND c.participant_two = r.expert_id)
      OR (c.type = 'CUST_EXP' AND c.participant_one = contract.renter_id
          AND c.participant_two = r.expert_id))
`;

export async function handleAssignedChat(req, res, pool) {
  const url = new URL(req.url || '/', 'http://localhost');
  const path = url.pathname.replace(/^\/api\/v1\//, '/api/');
  if (!path.startsWith('/api/conversations')) return false;

  try {
    const actor = await actorFromToken(req);
    if (!actor || actor.status !== 'ACTIVE') {
      send(res, 401, { success: false, message: 'Vui lòng đăng nhập lại.' });
      return true;
    }
    const actorId = Number(actor.userId);
    const requestedUserId = Number(url.searchParams.get('userId') || actorId);
    if (requestedUserId !== actorId) {
      send(res, 403, { success: false, message: 'Không thể xem hội thoại của người khác.' });
      return true;
    }

    if (req.method === 'GET' && path === '/api/conversations') {
      // Backfill channels for existing active rentals. Reassignment produces a new pair;
      // old channels remain in the database but fail the active assignment predicate.
      await pool.query(`
        INSERT INTO conversations (participant_one, participant_two, rental_id, plot_id, type, status)
        SELECT r.staff_id, r.expert_id, r.rental_id, r.plot_id, 'STAFF_EXP', 'OPEN'
        FROM rentals r WHERE r.status = 'ACTIVE' AND r.staff_id IS NOT NULL AND r.expert_id IS NOT NULL
          AND (r.staff_id = $1 OR r.expert_id = $1)
          AND NOT EXISTS (SELECT 1 FROM conversations c WHERE c.rental_id = r.rental_id
            AND c.participant_one = r.staff_id AND c.participant_two = r.expert_id
            AND c.type = 'STAFF_EXP' AND c.status = 'OPEN')
      `, [actorId]);
      await pool.query(`
        INSERT INTO conversations (participant_one, participant_two, rental_id, plot_id, type, status)
        SELECT contract.renter_id, r.expert_id, r.rental_id, r.plot_id, 'CUST_EXP', 'OPEN'
        FROM rentals r JOIN contracts contract ON contract.contract_id = r.contract_id
        WHERE r.status = 'ACTIVE' AND r.expert_id IS NOT NULL
          AND (contract.renter_id = $1 OR r.expert_id = $1)
          AND NOT EXISTS (SELECT 1 FROM conversations c WHERE c.rental_id = r.rental_id
            AND c.participant_one = contract.renter_id AND c.participant_two = r.expert_id
            AND c.type = 'CUST_EXP' AND c.status = 'OPEN')
      `, [actorId]);
      const { rows } = await pool.query(`
        ${allowedConversation} AND $1 IN (c.participant_one, c.participant_two)
        ORDER BY c.conversation_id DESC
      `, [actorId]);
      const threads = await Promise.all(rows.map(async (row) => {
        const messages = await pool.query(`
          SELECT m.message_id AS id, m.sender_id AS "senderId", u.full_name AS "senderName",
                 m.content AS text, m.attachment_url AS "photoUrl",
                 TO_CHAR(m.created_at, 'HH24:MI') AS time
          FROM messages m JOIN users u ON u.user_id = m.sender_id
          WHERE m.conversation_id = $1 ORDER BY m.created_at
        `, [row.conversation_id]);
        const role = row.type === 'STAFF_EXP' ? 'worker' : 'customer';
        return {
          conversationId: row.conversation_id, id: `CONS-${row.conversation_id}`,
          type: row.type, rentalId: row.rental_id, plotId: row.plot_id,
          plotCode: row.plot_code, plotName: `Thửa ${row.plot_code}`,
          crop: row.variety_name, participantOneId: row.participant_one,
          participantTwoId: row.participant_two, customerName: row.partner_name,
          expertName: row.expert_name, role, category: role,
          messages: messages.rows.map((message) => ({
            ...message, sender: message.senderId === row.participant_two ? 'expert' : role,
            seen: true
          }))
        };
      }));
      send(res, 200, { success: true, data: threads });
      return true;
    }

    const match = /^\/api\/conversations\/(\d+)\/messages$/.exec(path);
    if (match) {
      const conversationId = Number(match[1]);
      const allowed = await pool.query(`
        ${allowedConversation} AND c.conversation_id = $1
          AND $2 IN (c.participant_one, c.participant_two)
      `, [conversationId, actorId]);
      if (!allowed.rows.length) {
        send(res, 403, { success: false, message: 'Bạn không được phân công vào hội thoại này.' });
        return true;
      }
      if (req.method === 'POST') {
        const body = await readBody(req);
        if (body.senderId != null && Number(body.senderId) !== actorId) {
          send(res, 403, { success: false, message: 'Người gửi không hợp lệ.' });
          return true;
        }
        const content = String(body.content || body.text || '').trim();
        if (!content) {
          send(res, 400, { success: false, message: 'Tin nhắn trống.' });
          return true;
        }
        const result = await pool.query(`
          INSERT INTO messages (conversation_id, sender_id, content, attachment_url)
          VALUES ($1, $2, $3, $4) RETURNING message_id AS "messageId"
        `, [conversationId, actorId, content, body.attachmentUrl || null]);
        send(res, 201, { success: true, data: result.rows[0] });
        return true;
      }
      if (req.method === 'GET') {
        const result = await pool.query(`SELECT message_id AS "messageId", sender_id AS "senderId",
          content AS text, attachment_url AS "photoUrl", created_at AS "createdAt"
          FROM messages WHERE conversation_id = $1 ORDER BY created_at`, [conversationId]);
        send(res, 200, { success: true, data: result.rows });
        return true;
      }
    }
    send(res, 405, { success: false, message: 'Thao tác chat không được hỗ trợ.' });
    return true;
  } catch (error) {
    send(res, 500, { success: false, message: error.message });
    return true;
  }
}

export async function handleAssignedNotifications(req, res, pool) {
  const url = new URL(req.url || '/', 'http://localhost');
  if (!url.pathname.startsWith('/api/v1/notifications')) return false;
  try {
    const actor = await actorFromToken(req);
    if (!actor || actor.status !== 'ACTIVE') {
      send(res, 401, { success: false, message: 'Vui lòng đăng nhập lại.' });
      return true;
    }
    const actorId = Number(actor.userId);
    if (req.method === 'GET' && url.pathname === '/api/v1/notifications') {
      if (Number(url.searchParams.get('userId')) !== actorId) {
        send(res, 403, { success: false, message: 'Không thể xem thông báo của người khác.' });
        return true;
      }
      const { rows } = await pool.query(`
        SELECT notification_id AS "notificationId", title, content,
               is_read AS "isRead", created_at AS "createdAt"
        FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50
      `, [actorId]);
      send(res, 200, { success: true, data: rows });
      return true;
    }
    if (req.method === 'GET' && url.pathname === '/api/v1/notifications/unread-count') {
      const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE', [actorId]);
      send(res, 200, { success: true, data: rows[0].count });
      return true;
    }
    const read = /^\/api\/v1\/notifications\/(\d+)\/read$/.exec(url.pathname);
    if (req.method === 'PATCH' && read) {
      const result = await pool.query('UPDATE notifications SET is_read = TRUE WHERE notification_id = $1 AND user_id = $2', [Number(read[1]), actorId]);
      send(res, result.rowCount ? 200 : 404, { success: Boolean(result.rowCount) });
      return true;
    }
    send(res, 405, { success: false, message: 'Thao tác không được hỗ trợ.' });
    return true;
  } catch (error) {
    send(res, 500, { success: false, message: error.message });
    return true;
  }
}
