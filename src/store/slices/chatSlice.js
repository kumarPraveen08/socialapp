import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import * as chatApi from '@api/chat';

const initialState = {
  sessions: {},
  activeSession: null,
  loading: false,
  error: null,
};

export const getMessages = createAsyncThunk(
  'chat/getMessages',
  async (modalId, {rejectWithValue}) => {
    try {
      const response = await chatApi.getMessages(modalId);
      return {modalId, messages: response.data};
    } catch (error) {
      return rejectWithValue(error.response?.data || {message: error.message});
    }
  },
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({modalId, message}, {rejectWithValue}) => {
    try {
      const response = await chatApi.sendMessage(modalId, message);
      return {modalId, message: response.data};
    } catch (error) {
      return rejectWithValue(error.response?.data || {message: error.message});
    }
  },
);

export const startChatSession = createAsyncThunk(
  'chat/startSession',
  async (modalId, {rejectWithValue}) => {
    try {
      const response = await chatApi.startChatSession(modalId);
      return {modalId, session: response.data};
    } catch (error) {
      return rejectWithValue(error.response?.data || {message: error.message});
    }
  },
);

export const endChatSession = createAsyncThunk(
  'chat/endSession',
  async (sessionId, {rejectWithValue}) => {
    try {
      await chatApi.endChatSession(sessionId);
      return sessionId;
    } catch (error) {
      return rejectWithValue(error.response?.data || {message: error.message});
    }
  },
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    resetError: state => {
      state.error = null;
    },
    setActiveSession: (state, action) => {
      state.activeSession = action.payload;
    },
    addMessage: (state, action) => {
      const {modalId, message} = action.payload;
      if (state.sessions[modalId]) {
        state.sessions[modalId].messages.push(message);
      }
    },
    clearSession: (state, action) => {
      const modalId = action.payload;
      delete state.sessions[modalId];
      if (state.activeSession === modalId) {
        state.activeSession = null;
      }
    },
  },
  extraReducers: builder => {
    builder
      // Get Messages
      .addCase(getMessages.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.loading = false;
        const {modalId, messages} = action.payload;
        state.sessions[modalId] = {
          ...state.sessions[modalId],
          messages,
        };
      })
      .addCase(getMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch messages';
      })
      // Send Message
      .addCase(sendMessage.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        const {modalId, message} = action.payload;
        if (state.sessions[modalId]) {
          state.sessions[modalId].messages.push(message);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to send message';
      })
      // Start Session
      .addCase(startChatSession.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startChatSession.fulfilled, (state, action) => {
        state.loading = false;
        const {modalId, session} = action.payload;
        state.sessions[modalId] = session;
        state.activeSession = modalId;
      })
      .addCase(startChatSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to start chat session';
      })
      // End Session
      .addCase(endChatSession.fulfilled, (state, action) => {
        const sessionId = action.payload;
        if (state.activeSession === sessionId) {
          state.activeSession = null;
        }
      });
  },
});

export const {resetError, setActiveSession, addMessage, clearSession} =
  chatSlice.actions;

export default chatSlice.reducer;
