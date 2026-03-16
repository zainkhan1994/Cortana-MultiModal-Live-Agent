interface SessionStoreState {
  sessionId: string;
  lastUserGoal: string;
}

const state: SessionStoreState = {
  sessionId: `session-${Date.now()}`,
  lastUserGoal: '',
};

export const sessionStore = {
  getState: () => state,
  setLastUserGoal: (goal: string) => {
    state.lastUserGoal = goal;
  },
};
