import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import * as userApi from '@api/user';

const initialState = {
  profile: null,
  favorites: [],
  loading: false,
  error: null,
};

export const getProfile = createAsyncThunk(
  'user/getProfile',
  async (_, {rejectWithValue}) => {
    try {
      const response = await userApi.getProfile();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || {message: error.message});
    }
  },
);

export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData, {rejectWithValue}) => {
    try {
      const response = await userApi.updateProfile(profileData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || {message: error.message});
    }
  },
);

export const getFavorites = createAsyncThunk(
  'user/getFavorites',
  async (_, {rejectWithValue}) => {
    try {
      const response = await userApi.getFavorites();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || {message: error.message});
    }
  },
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    resetError: state => {
      state.error = null;
    },
    updateDeviceToken: (state, action) => {
      if (state.profile) {
        state.profile.deviceToken = action.payload;
      }
    },
  },
  extraReducers: builder => {
    builder
      // Get Profile
      .addCase(getProfile.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch profile';
      })
      // Update Profile
      .addCase(updateProfile.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to update profile';
      })
      // Get Favorites
      .addCase(getFavorites.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = action.payload;
      })
      .addCase(getFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch favorites';
      });
  },
});

export const {resetError, updateDeviceToken} = userSlice.actions;
export default userSlice.reducer;
