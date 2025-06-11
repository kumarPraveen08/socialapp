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

export const getMessages = async modalId => {
  return api.get(`/chat/sessions/${modalId}`);
};

export const sendMessage = async (modalId, message) => {
  const formData = new FormData();

  if (typeof message === 'string') {
    formData.append('message', message);
  } else {
    // If message is an object with image
    if (message.text) {
      formData.append('message', message.text);
    }
    if (message.image) {
      formData.append('image', {
        uri: message.image.uri,
        type: message.image.type || 'image/jpeg',
        name: message.image.fileName || 'image.jpg',
      });
    }
  }

  return api.post(`/chat/sessions/${modalId}/messages`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const startChatSession = async modalId => {
  return api.post(`/chat/sessions/${modalId}`);
};

export const endChatSession = async sessionId => {
  return api.patch(`/chat/sessions/${sessionId}/end`);
};

export default {
  getMessages,
  sendMessage,
  startChatSession,
  endChatSession,
};
