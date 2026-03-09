/**
 * Auth Context - управление на автентикацията
 */

import React, { createContext, useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../types';
import { authAPI } from '../api/auth';
import { usersAPI } from '../api/users';
import {
  registerForPushNotifications,
  savePushTokenToServer,
  scheduleDailyReminder,
} from '../utils/notifications';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  useEffect(() => {
    if (token) {
      registerForPushNotifications().then(async (pushToken) => {
        if (pushToken) {
          await savePushTokenToServer(pushToken);
          await scheduleDailyReminder();
        }
      });

      notificationListener.current =
        Notifications.addNotificationReceivedListener(() => {});
      responseListener.current =
        Notifications.addNotificationResponseReceivedListener(() => {});
    }

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [token]);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('access_token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAuth = async (authResponse: AuthResponse) => {
    await AsyncStorage.setItem('access_token', authResponse.access_token);
    await AsyncStorage.setItem('user', JSON.stringify(authResponse.user));
    setToken(authResponse.access_token);
    setUser(authResponse.user);
  };

  const login = useCallback(async (data: LoginRequest) => {
    const response = await authAPI.login(data);
    await saveAuth(response);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const response = await authAPI.register(data);
    await saveAuth(response);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await usersAPI.getMe();
      setUser(freshUser);
      await AsyncStorage.setItem('user', JSON.stringify(freshUser));
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

