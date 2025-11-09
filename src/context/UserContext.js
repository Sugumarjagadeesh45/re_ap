import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserService from '../services/userService';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Load token from storage on app start
  useEffect(() => {
    loadToken();
  }, []);

  // Fetch user data when token changes
  useEffect(() => {
    if (token) {
      console.log('Token updated, fetching user data...');
      fetchUserData();
    } else {
      console.log('No token available');
      setLoading(false);
    }
  }, [token]);

  const loadToken = async () => {
    try {
      console.log('Loading token from storage...');
      
      // Check both possible token storage keys
      let storedToken = await AsyncStorage.getItem('userToken');
      if (!storedToken) {
        storedToken = await AsyncStorage.getItem('authToken');
        if (storedToken) {
          // Migrate to consistent key
          await AsyncStorage.setItem('userToken', storedToken);
        }
      }
      
      console.log('Stored token found:', !!storedToken);
      if (storedToken) {
        setToken(storedToken);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading token:', error);
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      console.log('Fetching user data with token:', token);
      
      const response = await UserService.getUserProfile(token);
      console.log('User profile API response:', response);
      
      if (response.success) {
        setUser(response.user);
        setUserData(response.userData);
        console.log('User data set successfully:', response.user);
      } else {
        console.log('Failed to fetch user data:', response.message);
        // If token is invalid, clear it
        if (response.message === 'No token provided' || response.message === 'Invalid or expired token') {
          await logout();
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (profileData) => {
    try {
      console.log('Updating profile with token:', token);
      const response = await UserService.updateUserProfile(profileData, token);
      
      if (response.success) {
        setUser(response.user);
        setUserData(response.userData);
        return { success: true, data: response };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, message: 'Failed to update profile' };
    }
  };

  const uploadProfilePicture = async (profilePicture) => {
    try {
      const response = await UserService.uploadProfilePicture(profilePicture, token);
      
      if (response.success) {
        setUser(response.user);
        setUserData(response.userData);
        return { success: true, data: response };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      return { success: false, message: 'Failed to upload profile picture' };
    }
  };

  const login = async (userToken, userInfo) => {
    try {
      console.log('Logging in with token:', userToken);
      console.log('User info:', userInfo);
      
      // Store token with consistent key
      await AsyncStorage.setItem('userToken', userToken);
      await AsyncStorage.setItem('authToken', userToken);
      
      setToken(userToken);
      setUser(userInfo.user);
      setUserData(userInfo.userData || null);
      
      // Also store user info for persistence
      await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo.user));
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      await AsyncStorage.multiRemove(['userToken', 'authToken', 'userInfo']);
      setToken(null);
      setUser(null);
      setUserData(null);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const refreshUserData = async () => {
    console.log('Refreshing user data...');
    await fetchUserData();
  };

  const value = {
    user,
    userData,
    loading,
    token,
    login,
    logout,
    updateUserProfile,
    uploadProfilePicture,
    refreshUserData,
    fetchUserData
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;