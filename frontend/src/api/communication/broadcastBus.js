/**
 * BroadcastBus - Inter-tab / cross-window messaging using standard browser BroadcastChannel API.
 * Provides fallback to window 'storage' events for older environments.
 */

const CHANNEL_NAME = 'farmely_communication_bus';

class BroadcastBus {
  constructor() {
    this.listeners = new Map();
    this.channel = null;

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          this.dispatch(event.data);
        };
      } catch (e) {
        console.warn('[BroadcastBus] BroadcastChannel not supported, falling back to localStorage events', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === CHANNEL_NAME && event.newValue) {
          try {
            const data = JSON.parse(event.newValue);
            this.dispatch(data);
          } catch (err) {
            console.error('[BroadcastBus] Error parsing storage event payload', err);
          }
        }
      });
    }
  }

  /**
   * Subscribe to specific or all events
   * @param {string|Function} event - event name, '*' for all, or callback directly
   * @param {Function} [callback]
   * @returns {Function} unsubscribe function
   */
  subscribe(event, callback) {
    let eventName = event;
    let cb = callback;

    if (typeof event === 'function') {
      eventName = '*';
      cb = event;
    }

    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(cb);

    return () => {
      const set = this.listeners.get(eventName);
      if (set) {
        set.delete(cb);
        if (set.size === 0) {
          this.listeners.delete(eventName);
        }
      }
    };
  }

  /**
   * Publish an event to other tabs
   * @param {string} event
   * @param {any} payload
   */
  publish(event, payload = {}) {
    const data = {
      event,
      payload,
      timestamp: Date.now(),
      senderTabId: this.getTabId()
    };

    if (this.channel) {
      this.channel.postMessage(data);
    } else if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(CHANNEL_NAME, JSON.stringify(data));
      } catch (err) {
        console.warn('[BroadcastBus] Error writing to localStorage', err);
      }
    }

    // Also trigger listeners within current tab
    this.dispatch(data);
  }

  /**
   * Convenience postMessage wrapper for full payload objects
   */
  postMessage(messageObj) {
    const eventName = messageObj?.type || 'MESSAGE';
    const data = {
      event: eventName,
      ...messageObj,
      timestamp: messageObj?.timestamp || Date.now(),
      senderTabId: this.getTabId()
    };

    if (this.channel) {
      this.channel.postMessage(data);
    } else if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(CHANNEL_NAME, JSON.stringify(data));
      } catch (err) {
        console.warn('[BroadcastBus] Error writing to localStorage', err);
      }
    }

    this.dispatch(data);
  }

  dispatch(data) {
    if (!data) return;

    const eventName = data.event || data.type;
    if (eventName && this.listeners.has(eventName)) {
      this.listeners.get(eventName).forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`[BroadcastBus] Error in listener for ${eventName}`, e);
        }
      });
    }

    if (this.listeners.has('*')) {
      this.listeners.get('*').forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error('[BroadcastBus] Error in wildcard listener', e);
        }
      });
    }
  }

  getTabId() {
    if (typeof window === 'undefined') return 'server';
    if (!window.__FARMELY_TAB_ID__) {
      window.__FARMELY_TAB_ID__ = 'tab_' + Math.random().toString(36).substring(2, 9);
    }
    return window.__FARMELY_TAB_ID__;
  }
}

export const broadcastBus = new BroadcastBus();
export const communicationBus = broadcastBus;
export default broadcastBus;
