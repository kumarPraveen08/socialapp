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

export const getBalance = async () => {
  return api.get('/wallet/balance');
};

export const getTransactions = async () => {
  return api.get('/wallet/transactions');
};

export const addMoney = async (amount, paymentMethod) => {
  return api.post('/wallet/add-money', {amount, paymentMethod});
};

export const verifyPayment = async (paymentId, orderId, signature) => {
  return api.post('/wallet/verify-payment', {
    paymentId,
    orderId,
    signature,
  });
};

export const getCoinPlans = async () => {
  return api.get('/payment/plans');
};

export const createOrder = async (planId, paymentMethod) => {
  return api.post('/payment/orders', {planId, paymentMethod});
};

export const verifyOrder = async (orderId, paymentId, signature) => {
  return api.post('/payment/verify', {
    orderId,
    paymentId,
    signature,
  });
};

export const getPaymentHistory = async () => {
  return api.get('/payment/history');
};

export default {
  getBalance,
  getTransactions,
  addMoney,
  verifyPayment,
  getCoinPlans,
  createOrder,
  verifyOrder,
  getPaymentHistory,
};
