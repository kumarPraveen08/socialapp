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

export const generateCallToken = async (modalId, callType) => {
  return api.post('/call/token', {modalId, callType});
};

export const endCall = async callId => {
  return api.post(`/call/${callId}/end`);
};

export const getCallHistory = async () => {
  return api.get('/call/history');
};

// Store call session data
export const storeCallSession = callData => {
  storage.set('activeCall', JSON.stringify(callData));
};

// Get active call session
export const getCallSession = () => {
  const callData = storage.getString('activeCall');
  return callData ? JSON.parse(callData) : null;
};

// Clear call session
export const clearCallSession = () => {
  storage.delete('activeCall');
};

export default {
  generateCallToken,
  endCall,
  getCallHistory,
  storeCallSession,
  getCallSession,
  clearCallSession,
};
