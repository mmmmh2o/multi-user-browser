import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchHistory = createAsyncThunk('history/fetchHistory', async () => {
  return await window.electronAPI.getHistory();
});

export const clearHistory = createAsyncThunk('history/clearHistory', async () => {
  return await window.electronAPI.clearHistory();
});

const historySlice = createSlice({
  name: 'history',
  initialState: {
    items: [],
    loading: false,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(clearHistory.fulfilled, (state) => {
        state.items = [];
      });
  },
});

export default historySlice.reducer;
