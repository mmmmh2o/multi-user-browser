import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchDownloads = createAsyncThunk('download/fetchDownloads', async () => {
  return await window.electronAPI.getDownloads();
});

const downloadSlice = createSlice({
  name: 'download',
  initialState: {
    tasks: [],
    loading: false,
    error: null,
  },
  reducers: {
    updateProgress: (state, action) => {
      const { taskId, downloadedSize, progress } = action.payload;
      const task = state.tasks.find((t) => t.id === taskId);
      if (task) {
        task.downloadedSize = downloadedSize;
        task.progress = progress;
      }
    },
    taskCompleted: (state, action) => {
      const task = state.tasks.find((t) => t.id === action.payload.taskId);
      if (task) {
        task.status = 'completed';
        task.completedAt = Date.now();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDownloads.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDownloads.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchDownloads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { updateProgress, taskCompleted } = downloadSlice.actions;
export default downloadSlice.reducer;
