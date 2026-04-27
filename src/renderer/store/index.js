import { configureStore } from '@reduxjs/toolkit';
import downloadReducer from './slices/downloadSlice';
import settingsReducer from './slices/settingsSlice';
import bookmarkReducer from './slices/bookmarkSlice';
import historyReducer from './slices/historySlice';

const store = configureStore({
  reducer: {
    download: downloadReducer,
    settings: settingsReducer,
    bookmark: bookmarkReducer,
    history: historyReducer,
  },
});

export default store;
