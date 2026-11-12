const CHANNEL = 'farmely_harvest_sync';

export function publishHarvestCompleted({ rentalId, seasonKey, taskId }) {
  const event = { type: 'HARVEST_COMPLETED', rentalId: Number(rentalId), seasonKey, taskId: Number(taskId) };
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage(event);
    channel.close();
  }
  localStorage.setItem(CHANNEL, JSON.stringify(event));
}

export function subscribeHarvestCompleted(callback) {
  const receive = (event) => {
    if (event?.type === 'HARVEST_COMPLETED' && Number(event.rentalId) > 0) callback(event);
  };
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;
  if (channel) channel.onmessage = (message) => receive(message.data);
  const onStorage = (event) => {
    if (event.key !== CHANNEL || !event.newValue) return;
    try { receive(JSON.parse(event.newValue)); } catch {}
  };
  window.addEventListener('storage', onStorage);
  return () => { channel?.close(); window.removeEventListener('storage', onStorage); };
}
