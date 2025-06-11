import React, {useEffect, useState} from 'react';
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

import {sendOtp} from '@store/slices/authSlice';
import axios from 'axios';

const PhoneLogin = ({navigation}) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();

  // const validatePhone = phoneNumber => {
  //   const cleaned = phoneNumber.replace(/\D/g, '');
  //   return cleaned.length === 10;
  // };

  // const handleSendOtp = async () => {
  //   const cleanedPhone = phone.replace(/\D/g, '');

  //   if (!validatePhone(cleanedPhone)) {
  //     setError('Please enter a valid 10-digit phone number');
  //     return;
  //   }

  //   setLoading(true);
  //   setError('');

  //   try {
  //     const result = await dispatch(sendOtp(cleanedPhone)).unwrap();
  //     console.log('OTP Send Response:', result);
  //     navigation.navigate('OtpVerification', {phone: cleanedPhone});
  //   } catch (err) {
  //     console.error('OTP Send Error:', err);
  //     setError(err.message || 'Failed to send OTP. Please try again.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handlePhoneChange = text => {
  //   // Only allow numbers and limit to 10 digits
  //   const cleaned = text.replace(/\D/g, '');
  //   if (cleaned.length <= 10) {
  //     setPhone(cleaned);
  //     setError(''); // Clear error when user starts typing
  //   }
  // };

  useEffect(() => {
    const checkStatus = async () => {
      console.log('Checking status');
      try {
        const response = await axios.get('http://10.0.2.2:5000/api/health');
        console.log(response?.data);
      } catch (err) {
        if (err.response) {
          // The server responded with a status code outside the 2xx range
          console.log('Error response:', err.response);
        } else if (err.request) {
          // The request was made but no response was received
          console.log('Error request:', err.request);
        } else {
          // Something happened in setting up the request that triggered an error
          console.log('Error message:', err.message);
        }
      }
    };
    checkStatus();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <View style={styles.content}>
          <Text style={styles.title}>Enter Your Phone Number</Text>
          <Text style={styles.subtitle}>
            We will send you a verification code
          </Text>

          <TextInput
            mode="outlined"
            label="Phone Number"
            value={phone}
            onChangeText={() => {}}
            keyboardType="phone-pad"
            style={styles.input}
            error={!!error}
            disabled={loading}
            maxLength={10}
            placeholder="Enter 10 digit number"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={() => {}}
            disabled={loading}>
            <Text style={styles.buttonText}>
              {loading ? 'Sending...' : 'Send OTP'}
            </Text>
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
});

export default PhoneLogin;
