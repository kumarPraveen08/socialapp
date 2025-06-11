import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';

import {TextInput} from 'react-native-paper';
import {useDispatch} from 'react-redux';

import {verifyOtp, sendOtp} from '@store/slices/authSlice';

const OTP_LENGTH = 6;

const OtpVerification = ({route, navigation}) => {
  const {phone} = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const dispatch = useDispatch();
  const inputRef = useRef();

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== OTP_LENGTH) {
      setError('Please enter a valid OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await dispatch(verifyOtp({phone, otp})).unwrap();
      // Navigation will be handled by the auth state listener
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    try {
      await dispatch(sendOtp(phone)).unwrap();
      setResendTimer(30);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    }
  };

  const formatPhone = phoneNumber => {
    return `+91 ${phoneNumber.slice(-10)}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <View style={styles.content}>
          <Text style={styles.title}>Enter Verification Code</Text>
          <Text style={styles.subtitle}>
            We have sent an OTP to {formatPhone(phone)}
          </Text>

          <TextInput
            ref={inputRef}
            mode="outlined"
            label="OTP"
            value={otp}
            onChangeText={text => {
              const cleaned = text.replace(/[^0-9]/g, '');
              if (cleaned.length <= OTP_LENGTH) {
                setOtp(cleaned);
              }
            }}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            style={styles.input}
            error={!!error}
            disabled={loading}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerifyOtp}
            disabled={loading}>
            <Text style={styles.buttonText}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendContainer}
            onPress={handleResendOtp}
            disabled={resendTimer > 0}>
            <Text
              style={[
                styles.resendText,
                resendTimer > 0 && styles.resendTextDisabled,
              ]}>
              {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.changeNumberContainer}
            onPress={() => navigation.goBack()}>
            <Text style={styles.changeNumberText}>Change Phone Number</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
  },
  error: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FF3B7F',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendText: {
    color: '#FF3B7F',
    fontSize: 16,
  },
  resendTextDisabled: {
    color: '#666',
  },
  changeNumberContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  changeNumberText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default OtpVerification;
