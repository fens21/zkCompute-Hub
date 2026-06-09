type Listener = () => void;

interface UnreadState {
  byRoom: Record<string, number>;
  total: number;
}

let state: UnreadState = { byRoom: {}, total: 0 };
const listeners = new Set<Listener>();
const claimedRooms = new Set<string>();

function notify() {
  listeners.forEach((l) => l());
}

export const chatStore = {
  getState: () => state,

  getUnread: (roomId: string) => state.byRoom[roomId] || 0,

  getTotal: () => state.total,

  increment: (roomId: string) => {
    state = {
      byRoom: { ...state.byRoom, [roomId]: (state.byRoom[roomId] || 0) + 1 },
      total: state.total + 1,
    };
    notify();
  },

  reset: (roomId: string) => {
    const current = state.byRoom[roomId] || 0;
    if (current === 0) return;
    const next = { ...state.byRoom };
    delete next[roomId];
    state = { byRoom: next, total: Object.values(next).reduce((a, b) => a + b, 0) };
    notify();
  },

  markUnread: (roomId: string) => {
    state = {
      byRoom: { ...state.byRoom, [roomId]: 1 },
      total: state.total + 1 - (state.byRoom[roomId] || 0),
    };
    notify();
  },

  markClaimed: (roomId: string) => {
    claimedRooms.add(roomId);
  },

  isClaimed: (roomId: string) => claimedRooms.has(roomId),

  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};
