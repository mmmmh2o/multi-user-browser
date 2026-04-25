import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchUsers = createAsyncThunk('user/fetchUsers', async () => {
  return await window.electronAPI.getUsers();
});

const userSlice = createSlice({
  name: 'user',
  initialState: {
    users: [],
    currentUser: null,
    loading: false,
    error: null,
  },
  reducers: {
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
    },
    activateUser: (state, action) => {
      const userId = action.payload;
      state.users = state.users.map((u) => ({
        ...u,
        isActive: u.id === userId,
      }));
      state.currentUser = state.users.find((u) => u.id === userId) || null;
    },
    deactivateUser: (state, action) => {
      const userId = action.payload;
      state.users = state.users.map((u) =>
        u.id === userId ? { ...u, isActive: false } : u
      );
      if (state.currentUser?.id === userId) {
        state.currentUser = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
        state.currentUser =
          action.payload.find((u) => u.isActive) || action.payload[0] || null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setCurrentUser, activateUser, deactivateUser } = userSlice.actions;
export default userSlice.reducer;
