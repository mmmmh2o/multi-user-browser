import { createSlice } from '@reduxjs/toolkit';

const browserSlice = createSlice({
  name: 'browser',
  initialState: {
    tabs: [],
    activeTabKey: null,
    currentUser: null,
  },
  reducers: {
    // ========== 用户绑定 ==========
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
    },

    // ========== 标签页管理 ==========
    addTab: (state, action) => {
      const tab = {
        key: `tab-${Date.now()}`,
        title: '新标签页',
        url: 'about:blank',
        isLoading: false,
        canGoBack: false,
        canGoForward: false,
        favicon: null,
        ...action.payload,
      };
      state.tabs.push(tab);
      state.activeTabKey = tab.key;
    },

    closeTab: (state, action) => {
      const key = action.payload;
      const idx = state.tabs.findIndex((t) => t.key === key);
      if (idx === -1) return;

      state.tabs.splice(idx, 1);

      if (state.activeTabKey === key) {
        if (state.tabs.length === 0) {
          state.activeTabKey = null;
        } else {
          // 选相邻标签
          const newIdx = Math.min(idx, state.tabs.length - 1);
          state.activeTabKey = state.tabs[newIdx].key;
        }
      }
    },

    setActiveTab: (state, action) => {
      state.activeTabKey = action.payload;
    },

    updateTab: (state, action) => {
      const { key, ...updates } = action.payload;
      const tab = state.tabs.find((t) => t.key === key);
      if (tab) Object.assign(tab, updates);
    },

    // ========== 批量操作 ==========
    closeOtherTabs: (state, action) => {
      const key = action.payload;
      state.tabs = state.tabs.filter((t) => t.key === key);
      state.activeTabKey = key;
    },

    closeAllTabs: (state) => {
      state.tabs = [];
      state.activeTabKey = null;
    },
  },
});

export const {
  setCurrentUser,
  addTab,
  closeTab,
  setActiveTab,
  updateTab,
  closeOtherTabs,
  closeAllTabs,
} = browserSlice.actions;

export default browserSlice.reducer;
