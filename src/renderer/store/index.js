import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import browserReducer from './slices/browserSlice';
import downloadReducer from './slices/downloadSlice';
import settingsReducer from './slices/settingsSlice';

const store = configureStore({
  reducer: {
    user: userReducer,
    browser: browserReducer,
    download: downloadReducer,
    settings: settingsReducer,
  },
});

export default store;
