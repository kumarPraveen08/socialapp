import PropTypes from 'prop-types';

// Navigation route names and their parameters
export const ROUTES = {
  // Auth Stack
  PHONE_LOGIN: 'PhoneLogin',
  OTP_VERIFICATION: 'OtpVerification',

  // Main Stack
  HOME: 'Home',
  CHAT: 'Chat',
  CALL: 'Call',
  PROFILE: 'Profile',
  WALLET: 'Wallet',
  SETTINGS: 'Settings',
};

// PropTypes can be used for runtime type checking if needed
// import PropTypes from 'prop-types';

export const navigationPropTypes = {
  // Auth Stack
  PhoneLogin: {},
  OtpVerification: {
    phone: PropTypes.string.isRequired,
  },

  // Main Stack
  Home: {},
  Chat: {
    modalId: PropTypes.string.isRequired,
  },
  Call: {
    modalId: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['audio', 'video']).isRequired,
  },
  Profile: {},
  Wallet: {},
  Settings: {},
};
