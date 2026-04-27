import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchSettings = createAsyncThunk('settings/fetchSettings', async () => {
  return await window.electronAPI.getSettings();
});

export const saveSettings = createAsyncThunk('settings/saveSettings', async (settings) => {
  return await window.electronAPI.saveSettings(settings);
});

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    defaultDownloadPath: './downloads',
    maxHistoryItems: 100,
    autoStart: false,
    closeToTray: true,
    enableNotification: true,
    enableScripts: true,
    homePage: 'about:blank',
    loading: false,
  },
  reducers: {
    updateSettingsLocal: (state, action) => {
      return { ...state, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        return { ...state, ...action.payload, loading: false };
      })
      .addCase(fetchSettings.rejected, (state) => {
        state.loading = false;
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        if (action.payload?.settings) {
          return { ...state, ...action.payload.settings };
        }
      });
  },
});

export const { updateSettingsLocal } = settingsSlice.actions;
export default settingsSlice.reducer;
