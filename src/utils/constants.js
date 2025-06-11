import {Platform} from 'react-native';

// API Configuration
const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:5000',
  ios: 'http://localhost:5000',
  default: 'http://localhost:5000',
});

export const API_URL = `${API_BASE_URL}/api`;
export const API_TIMEOUT = 30000; // 30 seconds

// Log configuration on app start
console.log('API Configuration:', {
  platform: Platform.OS,
  baseUrl: API_BASE_URL,
  apiUrl: API_URL,
  timeout: API_TIMEOUT,
});

// Socket Configuration
export const SOCKET_URL = __DEV__
  ? Platform.select({
      android: 'http://10.0.2.2:5000',
      ios: 'http://localhost:5000',
      default: 'http://10.0.2.2:5000',
    })
  : 'https://your-production-url.com';

// Debug Info
console.log('API Configuration:', {
  platform: Platform.OS,
  isDev: __DEV__,
  apiUrl: API_URL,
  socketUrl: SOCKET_URL,
});

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  USER_DATA: '@user_data',
};

export const CALL_TYPES = {
  AUDIO: 'audio',
  VIDEO: 'video',
};

export const USER_TYPES = {
  USER: 'user',
  MODAL: 'modal',
};
