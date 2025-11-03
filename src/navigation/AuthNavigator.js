// Create a new file: src/navigation/AuthNavigator.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from '../screens/LoginScreen';
import MainTabNavigator from './MainTabNavigator';
import { View, ActivityIndicator } from 'react-native';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const subscriber = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in with Firebase
          console.log('Firebase user found:', firebaseUser.email);
          setUser(firebaseUser);
        } else {
          // Check if we have a backend token
          const token = await AsyncStorage.getItem('authToken');
          if (token) {
            // Validate the token with the backend
            const response = await fetch(`${API_URL}/api/auth/profile`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            });

            if (response.ok) {
              // Token is valid, consider the user authenticated
              setUser({ email: 'Backend User' });
            } else {
              // Token is invalid, clear it
              await AsyncStorage.removeItem('authToken');
              await AsyncStorage.removeItem('userInfo');
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return subscriber;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AuthNavigator;