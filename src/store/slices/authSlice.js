import {MMKV} from 'react-native-mmkv';
import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';

import * as authApi from '@api/auth';

const storage = new MMKV();

const initialState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
};

export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async (phone, {rejectWithValue}) => {
    try {
      const response = await authApi.sendOtp(phone);
      console.log(response.data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || {message: error.message});
    }
  },
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({phone, otp}, {rejectWithValue}) => {
    try {
      const response = await authApi.verifyOtp(phone, otp);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || {message: error.message});
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authApi.logout();
  storage.delete('token');
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    resetError: state => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
  },
  extraReducers: builder => {
    builder
      // Send OTP
      .addCase(sendOtp.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendOtp.fulfilled, state => {
        state.loading = false;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to send OTP';
      })

      // Verify OTP
      .addCase(verifyOtp.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Invalid OTP';
      })

      // Logout
      .addCase(logout.fulfilled, state => {
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export const {resetError, setUser} = authSlice.actions;
export default authSlice.reducer;
