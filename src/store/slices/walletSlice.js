import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import * as walletApi from '@api/wallet';

const initialState = {
  balance: 0,
  transactions: [],
  loading: false,
  error: null,
};

export const getBalance = createAsyncThunk(
  'wallet/getBalance',
  async (_, {rejectWithValue}) => {
    try {
      const response = await walletApi.getBalance();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || {message: error.message});
    }
  },
);

export const getTransactions = createAsyncThunk(
  'wallet/getTransactions',
  async (_, {rejectWithValue}) => {
    try {
      const response = await walletApi.getTransactions();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || {message: error.message});
    }
  },
);

export const addMoney = createAsyncThunk(
  'wallet/addMoney',
  async ({amount, paymentMethod}, {rejectWithValue}) => {
    try {
      const response = await walletApi.addMoney(amount, paymentMethod);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || {message: error.message});
    }
  },
);

export const verifyPayment = createAsyncThunk(
  'wallet/verifyPayment',
  async ({paymentId, orderId, signature}, {rejectWithValue}) => {
    try {
      const response = await walletApi.verifyPayment(
        paymentId,
        orderId,
        signature,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || {message: error.message});
    }
  },
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    resetError: state => {
      state.error = null;
    },
    updateBalance: (state, action) => {
      state.balance = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      // Get Balance
      .addCase(getBalance.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBalance.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload.balance;
      })
      .addCase(getBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch balance';
      })

      // Get Transactions
      .addCase(getTransactions.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
      })
      .addCase(getTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch transactions';
      })

      // Add Money
      .addCase(addMoney.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMoney.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload.balance;
      })
      .addCase(addMoney.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to add money';
      })

      // Verify Payment
      .addCase(verifyPayment.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload.balance;
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to verify payment';
      });
  },
});

export const {resetError, updateBalance} = walletSlice.actions;
export default walletSlice.reducer;
