import { createSlice } from '@reduxjs/toolkit';

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    defaultDownloadPath: './downloads',
    maxHistoryItems: 100,
    autoStart: false,
    closeToTray: true,
    enableNotification: true,
  },
  reducers: {
    updateSettings: (state, action) => {
      return { ...state, ...action.payload };
    },
  },
});

export const { updateSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
