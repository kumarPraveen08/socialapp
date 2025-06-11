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

export const getAllGifts = async () => {
  return api.get('/gift');
};

export const getGiftById = async giftId => {
  return api.get(`/gift/${giftId}`);
};

export const sendGift = async (modalId, giftId, quantity = 1, message = '') => {
  return api.post('/gift/send', {
    modalId,
    giftId,
    quantity,
    message,
  });
};

export const getGiftHistory = async () => {
  return api.get('/gift/history');
};

export const getReceivedGifts = async () => {
  return api.get('/gift/received');
};

// Cache gift list for better performance
export const cacheGifts = gifts => {
  storage.set('cachedGifts', JSON.stringify(gifts));
};

export const getCachedGifts = () => {
  const gifts = storage.getString('cachedGifts');
  return gifts ? JSON.parse(gifts) : null;
};

export const clearGiftCache = () => {
  storage.delete('cachedGifts');
};

export default {
  getAllGifts,
  getGiftById,
  sendGift,
  getGiftHistory,
  getReceivedGifts,
  cacheGifts,
  getCachedGifts,
  clearGiftCache,
};
