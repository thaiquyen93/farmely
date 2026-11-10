export function getVisibleExpertThreads(threads, expertUserId) {
  return threads.filter((thread) => {
    if (!Array.isArray(thread.messages) || thread.messages.length === 0) return false;
    if (Number(expertUserId) > 0 && Number(thread.participantUserId) === Number(expertUserId)) return false;
    return thread.role === 'customer' || thread.role === 'worker' || thread.role === 'admin';
  });
}
