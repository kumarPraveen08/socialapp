import axios from 'axios';
import {MMKV} from 'react-native-mmkv';

import {API_URL} from '@utils/constants';

const storage = new MMKV();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  config => {
    const token = storage.getString('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

export const getProfile = async () => {
  return api.get('/users/profile');
};

export const updateProfile = async profileData => {
  const formData = new FormData();
  Object.keys(profileData).forEach(key => {
    if (profileData[key] !== undefined) {
      formData.append(key, profileData[key]);
    }
  });
  return api.patch('/users/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const updateDeviceToken = async deviceToken => {
  return api.patch('/users/device-token', {deviceToken});
};

export const getFavorites = async () => {
  return api.get('/users/favorites');
};

export const addToFavorites = async modalId => {
  return api.post(`/users/favorites/${modalId}`);
};

export const removeFromFavorites = async modalId => {
  return api.delete(`/users/favorites/${modalId}`);
};

export default {
  getProfile,
  updateProfile,
  updateDeviceToken,
  getFavorites,
  addToFavorites,
  removeFromFavorites,
};
