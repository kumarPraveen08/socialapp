import axios from 'axios';
import {MMKV} from 'react-native-mmkv';
import {Platform} from 'react-native';

import {API_URL, API_TIMEOUT} from '@utils/constants';

const storage = new MMKV();

console.log('Initializing API with URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent': `DatingApp/${Platform.OS}`,
  },
  timeout: API_TIMEOUT,
});

// Add token to requests
api.interceptors.request.use(
  config => {
    const token = storage.getString('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log full request details
    console.log('API Request Details:', {
      fullUrl: `${config.baseURL}${config.url}`,
      method: config.method,
      headers: config.headers,
      data: config.data,
      timeout: config.timeout,
    });

    return config;
  },
  error => {
    console.error('API Request Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return Promise.reject(error);
  },
);

// Add response interceptor for logging
api.interceptors.response.use(
  response => {
    console.log('API Response Success:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  error => {
    // Log detailed error information
    console.error('API Response Error Details:', {
      config: {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method,
        headers: error.config?.headers,
        timeout: error.config?.timeout,
      },
      error: {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack,
      },
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
        : undefined,
    });

    // Handle specific error cases
    if (error.response) {
      // Server responded with error status
      throw error.response.data;
    } else if (error.code === 'ECONNABORTED') {
      // Request timed out
      throw {
        message: 'Request timed out. Please try again.',
        originalError: error.message,
      };
    } else if (!error.response && error.request) {
      // Network error (no response received)
      const errorMessage = Platform.select({
        android: `Could not connect to server. Please check:\n1. Backend server is running (${API_URL})\n2. You have internet connection\n3. Android Manifest has internet permission\n4. Network security config allows cleartext traffic`,
        ios: `Could not connect to server. Please check:\n1. Backend server is running (${API_URL})\n2. You have internet connection`,
        default:
          'No response from server. Please check your internet connection.',
      });
      throw {
        message: errorMessage,
        originalError: error.message,
      };
    } else {
      // Something else happened
      throw {
        message: 'An unexpected error occurred. Please try again.',
        originalError: error.message,
      };
    }
  },
);

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const retryRequest = async (fn, retries = MAX_RETRIES) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && (!error.response || error.code === 'ECONNABORTED')) {
      console.log(
        `Retrying request... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`,
      );
      await sleep(RETRY_DELAY);
      return retryRequest(fn, retries - 1);
    }
    throw error;
  }
};

export const sendOtp = async phone => {
  return retryRequest(async () => {
    try {
      console.log('Sending OTP request for phone:', phone);
      const response = await api.post('/auth/send-otp', {
        phone,
        role: 'user',
      });
      return response;
    } catch (error) {
      console.error('Send OTP Error:', {
        message: error.message,
        originalError: error.originalError,
        stack: error.stack,
      });
      throw error;
    }
  });
};

export const verifyOtp = async (phone, otp) => {
  return retryRequest(async () => {
    try {
      const response = await api.post('/auth/verify-otp', {
        phone,
        otp,
        role: 'user',
      });
      if (response.data.token) {
        storage.set('token', response.data.token);
      }
      return response;
    } catch (error) {
      console.error('Verify OTP Error:', error);
      throw error;
    }
  });
};

export const logout = async () => {
  try {
    const response = await api.post('/auth/logout');
    storage.delete('token');
    return response;
  } catch (error) {
    console.error('Logout Error:', error);
    storage.delete('token'); // Still clear token on error
    throw error;
  }
};

export default {
  sendOtp,
  verifyOtp,
  logout,
};
