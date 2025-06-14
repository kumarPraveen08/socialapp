# Dating App Backend

A full-featured backend for an Astrotalk-like dating app built with Express.js, Socket.IO, MongoDB, and various other modern technologies.

## Features

- OTP-based Authentication (Twilio)
- Real-time Chat (Socket.IO)
- Voice & Video Calls (Agora)
- Wallet System with Multiple Payment Methods
- Gift System
- Admin Panel
- Modal Management
- Live Streaming
- And much more...

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Redis (optional, for better OTP handling)
- Twilio Account
- Agora Account
- Cloudinary Account
- Firebase Project (for FCM)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/dating-app

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Agora Configuration
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379
```

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd dating-app-backend
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:

```bash
npm run dev
```

## API Documentation

### Authentication

- POST /api/auth/send-otp
- POST /api/auth/verify-otp
- POST /api/auth/logout

### Users

- GET /api/users/profile
- PUT /api/users/profile
- GET /api/users/wallet
- POST /api/users/wallet/recharge

### Modals

- GET /api/modals
- GET /api/modals/:id
- PUT /api/modals/profile
- POST /api/modals/withdraw

### Chat & Calls

- WebSocket events for chat
- Agora token generation for calls
- Call history and management

### Admin Panel

- Complete CRUD operations
- User management
- Modal verification
- Content moderation
- System settings

## WebSocket Events

### Chat Events

- user:connect
- chat:message
- chat:typing
- user:status

### Call Events

- call:request
- call:accept
- call:reject
- call:end

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
