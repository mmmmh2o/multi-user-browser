import { createSlice } from '@reduxjs/toolkit';

const browserSlice = createSlice({
  name: 'browser',
  initialState: {
    tabs: [{ key: '1', title: '新标签页', url: 'about:blank' }],
    activeTab: '1',
    bookmarks: [],
    history: [],
  },
  reducers: {
    addTab: (state, action) => {
      state.tabs.push(action.payload);
      state.activeTab = action.payload.key;
    },
    closeTab: (state, action) => {
      state.tabs = state.tabs.filter((t) => t.key !== action.payload);
      if (state.activeTab === action.payload && state.tabs.length > 0) {
        state.activeTab = state.tabs[state.tabs.length - 1].key;
      }
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    updateTab: (state, action) => {
      const { key, ...updates } = action.payload;
      const tab = state.tabs.find((t) => t.key === key);
      if (tab) Object.assign(tab, updates);
    },
  },
});

export const { addTab, closeTab, setActiveTab, updateTab } = browserSlice.actions;
export default browserSlice.reducer;
