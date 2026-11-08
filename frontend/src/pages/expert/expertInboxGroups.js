export function buildExpertInboxEntries(threads) {
  const groups = new Map();
  for (const thread of threads) {
    const groupedCustomer = thread.role === 'customer' && thread.rentalStatus !== 'NOT_RENTED';
    const customerKey = thread.participantOneId || thread.customerEmail?.toLowerCase();
    const key = groupedCustomer && customerKey ? `customer:${customerKey}` : `thread:${thread.id}`;
    if (!groups.has(key)) groups.set(key, { ...thread, id: key, threads: [], messages: [], plots: [] });
    const entry = groups.get(key);
    entry.threads.push(thread);
    if (groupedCustomer) entry.plots.push({ plotCode: thread.plotCode, plotName: thread.plotName, crop: thread.crop });
    for (const message of thread.messages || []) {
      entry.messages.push({ ...message, plotCode: groupedCustomer ? thread.plotCode : message.plotCode });
    }
    entry.unread = Boolean(entry.unread || thread.unread);
    if (thread.status === 'PENDING') entry.status = 'PENDING';
  }
  return [...groups.values()].map((entry) => {
    if (entry.threads.length > 1) {
      entry.plotCode = entry.plots.map((plot) => plot.plotCode).join(', ');
      entry.crop = '';
      entry.messages.sort((a, b) => Number(a.id) - Number(b.id));
      entry.lastTime = entry.messages.at(-1)?.time || 'Chưa có tin nhắn';
    }
    return entry;
  });
}
