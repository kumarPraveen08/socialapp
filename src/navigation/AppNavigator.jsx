import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSelector} from 'react-redux';
import {IconButton} from 'react-native-paper';

import {ROUTES} from '@navigation/types';

// Screens
import PhoneLogin from '@screens/auth/PhoneLogin';
import OtpVerification from '@screens/auth/OtpVerification';
import Home from '@screens/Home';
import Chat from '@screens/chat/Chat';
import Call from '@screens/call/Call';
import Profile from '@screens/Profile';
import Wallet from '@screens/Wallet';
import Settings from '@screens/Settings';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#E91E63',
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerShown: false,
      }}>
      <Tab.Screen
        name={ROUTES.HOME}
        component={Home}
        options={{
          tabBarIcon: ({color, size}) => (
            <IconButton icon="home" size={size} iconColor={color} />
          ),
        }}
      />
      <Tab.Screen
        name={ROUTES.PROFILE}
        component={Profile}
        options={{
          tabBarIcon: ({color, size}) => (
            <IconButton icon="account" size={size} iconColor={color} />
          ),
        }}
      />
      <Tab.Screen
        name={ROUTES.WALLET}
        component={Wallet}
        options={{
          tabBarIcon: ({color, size}) => (
            <IconButton icon="wallet" size={size} iconColor={color} />
          ),
        }}
      />
      <Tab.Screen
        name={ROUTES.SETTINGS}
        component={Settings}
        options={{
          tabBarIcon: ({color, size}) => (
            <IconButton icon="cog" size={size} iconColor={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      {!isAuthenticated ? (
        // Auth Stack
        <>
          <Stack.Screen name={ROUTES.PHONE_LOGIN} component={PhoneLogin} />
          <Stack.Screen
            name={ROUTES.OTP_VERIFICATION}
            component={OtpVerification}
          />
        </>
      ) : (
        // Main Stack
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name={ROUTES.CHAT} component={Chat} />
          <Stack.Screen name={ROUTES.CALL} component={Call} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
