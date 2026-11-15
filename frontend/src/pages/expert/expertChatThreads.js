export function getVisibleExpertThreads(threads, expertUserId, selectedThreadId) {
  return threads.filter((thread) => {
    if (Number(expertUserId) > 0 && Number(thread.participantUserId) === Number(expertUserId)) return false;
    if (selectedThreadId && thread.id === selectedThreadId) return true;
    if (!Array.isArray(thread.messages) || thread.messages.length === 0) return false;
    return thread.role === 'customer' || thread.role === 'worker' || thread.role === 'admin';
  });
}

/**
 * Resolve which thread should render in the active right-hand chat pane.
 * Empty threads stay hidden from the inbox list, unless explicitly opened from a plot card.
 */
export function resolveActiveExpertThread(threads, visibleThreads, selectedThreadId, directThreadId, expertUserId) {
  const fromVisible = visibleThreads.find((t) => t.id === selectedThreadId);
  if (fromVisible) return fromVisible;

  if (directThreadId && directThreadId === selectedThreadId) {
    const direct = threads.find(
      (t) =>
        t.id === directThreadId &&
        !(Number(expertUserId) > 0 && Number(t.participantUserId) === Number(expertUserId))
    );
    if (direct) return direct;
  }

  return visibleThreads[0] || null;
}
