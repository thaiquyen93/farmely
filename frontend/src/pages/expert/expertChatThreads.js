export function getVisibleExpertThreads(threads, expertUserId, selectedThreadId) {
  return threads.filter((thread) => {
    if (Number(expertUserId) > 0 && Number(thread.participantUserId) === Number(expertUserId)) return false;
    if (selectedThreadId && thread.id === selectedThreadId) return true;
    if (!Array.isArray(thread.messages) || thread.messages.length === 0) return false;
    return thread.role === 'customer' || thread.role === 'worker' || thread.role === 'admin';
  });
}
