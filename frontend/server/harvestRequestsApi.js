const readBody = (req) => new Promise((resolve, reject) => {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    try { resolve(JSON.parse(body || '{}')); } catch (error) { reject(error); }
  });
  req.on('error', reject);
});

const json = (res, status, data) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
};

const requestRowsSql = `
  SELECT h.request_id AS "requestId", h.rental_id AS "rentalId",
    h.customer_id AS "customerId", h.staff_id AS "staffId",
    TO_CHAR(h.requested_date, 'YYYY-MM-DD') AS date,
    TO_CHAR(h.requested_date, 'YYYY-MM-DD') AS "requestedDate",
    h.method, h.delivery_address AS address, h.phone, h.notes, h.status,
    h.harvest_id AS "harvestId", h.completed_at AS "completedAt",
    h.created_at AS "createdAt", p.plot_id AS "plotId", p.plot_code AS "plotCode",
    'Thửa ' || p.plot_code AS "plotName", v.variety_name AS crop,
    customer.full_name AS "renterName", staff.full_name AS "workerName",
    hr.yield_amount AS "yieldAmount", hr.evidence_image_url AS "evidenceImageUrl"
  FROM harvest_requests h
  JOIN rentals r ON r.rental_id = h.rental_id
  JOIN plots p ON p.plot_id = r.plot_id
  JOIN varieties v ON v.variety_id = r.variety_id
  JOIN users customer ON customer.user_id = h.customer_id
  JOIN users staff ON staff.user_id = h.staff_id
  LEFT JOIN harvest_results hr ON hr.harvest_id = h.harvest_id
`;

export async function handleHarvestRequests(req, res, pool) {
  const url = new URL(req.url || '/', 'http://localhost');
  if (!url.pathname.startsWith('/api/harvest-requests')) return false;
  try {
    if (req.method === 'GET' && url.pathname === '/api/harvest-requests') {
      const customerId = Number(url.searchParams.get('customerId'));
      const staffId = Number(url.searchParams.get('staffId'));
      const expertId = Number(url.searchParams.get('expertId'));
      let where = '';
      let params = [];
      if (customerId > 0) { where = 'WHERE h.customer_id = $1'; params = [customerId]; }
      else if (staffId > 0) { where = 'WHERE h.staff_id = $1'; params = [staffId]; }
      else if (expertId > 0) { where = 'WHERE r.expert_id = $1'; params = [expertId]; }
      else return json(res, 400, { success: false, message: 'Thiếu người dùng.' }), true;
      const { rows } = await pool.query(`${requestRowsSql} ${where} ORDER BY h.created_at DESC`, params);
      json(res, 200, { success: true, data: rows });
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/harvest-requests') {
      const payload = await readBody(req);
      const rentalId = Number(payload.rentalId);
      const customerId = Number(payload.customerId);
      const date = String(payload.date || payload.requestedDate || '');
      const method = String(payload.method || '');
      if (!Number.isInteger(rentalId) || !Number.isInteger(customerId) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !method) {
        json(res, 400, { success: false, message: 'Thông tin yêu cầu thu hoạch chưa hợp lệ.' });
        return true;
      }
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const rental = await client.query(`
          SELECT r.rental_id, COALESCE(r.staff_id, fn_resolve_staff_for_plot(r.plot_id)) AS staff_id
          FROM rentals r JOIN contracts c ON c.contract_id = r.contract_id
          WHERE r.rental_id = $1 AND c.renter_id = $2 AND r.status = 'ACTIVE' FOR UPDATE OF r
        `, [rentalId, customerId]);
        if (!rental.rows.length || !rental.rows[0].staff_id) throw Object.assign(new Error('Không tìm thấy thửa đang thuê hoặc nhân viên phụ trách.'), { status: 404 });
        const existing = await client.query('SELECT status FROM harvest_requests WHERE rental_id = $1 FOR UPDATE', [rentalId]);
        if (existing.rows[0]?.status === 'COMPLETED') throw Object.assign(new Error('Yêu cầu thu hoạch đã hoàn tất.'), { status: 409 });
        const saved = await client.query(`
          INSERT INTO harvest_requests (rental_id, customer_id, staff_id, requested_date, method, delivery_address, phone, notes, status)
          VALUES ($1, $2, $3, $4::date, $5, $6, $7, $8, 'PENDING')
          ON CONFLICT (rental_id) DO UPDATE SET requested_date = EXCLUDED.requested_date,
            method = EXCLUDED.method, delivery_address = EXCLUDED.delivery_address,
            phone = EXCLUDED.phone, notes = EXCLUDED.notes, status = 'PENDING',
            staff_id = EXCLUDED.staff_id, updated_at = NOW()
          RETURNING request_id
        `, [rentalId, customerId, rental.rows[0].staff_id, date, method, payload.address || null, payload.phone || null, payload.notes || null]);
        await client.query(`INSERT INTO notifications (user_id, title, content) VALUES ($1, $2, $3)`,
          [rental.rows[0].staff_id, 'Yêu cầu thu hoạch mới', `Khách hàng đã yêu cầu thu hoạch vào ngày ${date}.`]);
        await client.query('COMMIT');
        const { rows } = await pool.query(`${requestRowsSql} WHERE h.request_id = $1`, [saved.rows[0].request_id]);
        json(res, 201, { success: true, data: rows[0] });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally { client.release(); }
      return true;
    }

    const action = /^\/api\/harvest-requests\/(\d+)\/(complete|approve|postpone|cancel)$/.exec(url.pathname);
    if (req.method === 'POST' && action) {
      const requestId = Number(action[1]);
      const kind = action[2];
      const payload = await readBody(req);
      const actorId = Number(payload.actorId || payload.staffId || payload.expertId || payload.customerId);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const { rows } = await client.query(`
          SELECT h.*, r.expert_id, p.plot_code
          FROM harvest_requests h JOIN rentals r ON r.rental_id = h.rental_id
          JOIN plots p ON p.plot_id = r.plot_id
          WHERE h.request_id = $1 FOR UPDATE OF h
        `, [requestId]);
        const item = rows[0];
        if (!item) throw Object.assign(new Error('Không tìm thấy yêu cầu thu hoạch.'), { status: 404 });
        if (kind === 'complete') {
          const weight = Number(payload.yieldAmount);
          if (item.staff_id !== actorId || !['PENDING', 'APPROVED'].includes(item.status) || !(weight > 0) || !payload.evidenceImageUrl) {
            throw Object.assign(new Error('Yêu cầu, nhân viên, ảnh hoặc số cân không hợp lệ.'), { status: 400 });
          }
          const result = await client.query(`
            INSERT INTO harvest_results (rental_id, entered_by, harvest_date, yield_amount, evidence_image_url, delivery_type)
            VALUES ($1, $2, CURRENT_DATE, $3, $4, $5)
            RETURNING harvest_id
          `, [item.rental_id, actorId, weight, payload.evidenceImageUrl,
            ['DELIVERY', 'FARMELY_PICK_DELIVER'].includes(item.method) ? 'DELIVERY' : 'PICKUP']);
          await client.query(`UPDATE harvest_requests SET status = 'COMPLETED', harvest_id = $2, completed_at = NOW(), updated_at = NOW() WHERE request_id = $1`,
            [requestId, result.rows[0].harvest_id]);
          await client.query(`INSERT INTO notifications (user_id, title, content) VALUES ($1, $2, $3)`,
            [item.customer_id, 'Thu hoạch thành công', `Thửa ${item.plot_code} đã thu hoạch xong. Sản lượng thực tế: ${weight} kg. Bạn có thể xem kết quả và xác nhận bàn giao.`]);
        } else if (kind === 'cancel') {
          if (item.customer_id !== actorId || !['PENDING', 'APPROVED', 'POSTPONED'].includes(item.status)) {
            throw Object.assign(new Error('Không thể hủy yêu cầu này.'), { status: 400 });
          }
          await client.query(`UPDATE harvest_requests SET status = 'CANCELLED', updated_at = NOW() WHERE request_id = $1`, [requestId]);
        } else {
          if (item.expert_id !== actorId || !['PENDING', 'APPROVED', 'POSTPONED'].includes(item.status)) {
            throw Object.assign(new Error('Chuyên gia không được phân công hoặc yêu cầu đã đóng.'), { status: 400 });
          }
          await client.query(`UPDATE harvest_requests SET status = $2, notes = CASE WHEN $3 <> '' THEN CONCAT_WS(E'\\n', notes, $3) ELSE notes END, updated_at = NOW() WHERE request_id = $1`,
            [requestId, kind === 'approve' ? 'APPROVED' : 'POSTPONED', String(payload.reason || '')]);
        }
        await client.query('COMMIT');
        const updated = await pool.query(`${requestRowsSql} WHERE h.request_id = $1`, [requestId]);
        json(res, 200, { success: true, data: updated.rows[0] });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally { client.release(); }
      return true;
    }
    json(res, 404, { success: false, message: 'Không tìm thấy API.' });
    return true;
  } catch (error) {
    json(res, error.status || 500, { success: false, message: error.message });
    return true;
  }
}
