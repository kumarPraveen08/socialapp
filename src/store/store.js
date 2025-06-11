import {configureStore} from '@reduxjs/toolkit';

import authReducer from '@store/slices/authSlice';
import userReducer from '@store/slices/userSlice';
import chatReducer from '@store/slices/chatSlice';
import walletReducer from '@store/slices/walletSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    chat: chatReducer,
    wallet: walletReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
