import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchBookmarks = createAsyncThunk('bookmark/fetchBookmarks', async () => {
  return await window.electronAPI.getBookmarks();
});

export const deleteBookmark = createAsyncThunk('bookmark/deleteBookmark', async (id) => {
  return await window.electronAPI.deleteBookmark(id);
});

const bookmarkSlice = createSlice({
  name: 'bookmark',
  initialState: {
    items: [],
    loading: false,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookmarks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBookmarks.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchBookmarks.rejected, (state) => {
        state.loading = false;
      })
      .addCase(deleteBookmark.fulfilled, (state, action) => {
        state.items = action.payload;
      });
  },
});

export default bookmarkSlice.reducer;
