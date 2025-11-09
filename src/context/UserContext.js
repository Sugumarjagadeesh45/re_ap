// D:\cddd\NEW_reals2chat_frontend-main\src\context\UserContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserService from '../services/userService';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'No user');
        
        if (firebaseUser) {
          console.log('Firebase user detected:', firebaseUser.email);
          setUser(firebaseUser);
          
          // Get backend token
          const backendToken = await AsyncStorage.getItem('authToken');
          console.log('Backend token from storage:', backendToken ? 'Exists' : 'Not found');
          
          if (backendToken) {
            setToken(backendToken);
            // Fetch user profile data
            await fetchUserProfile();
          } else {
            console.log('No backend token found');
            setLoading(false);
          }
        } else {
          console.log('No Firebase user, checking for backend token...');
          // Check if we have a backend token even without Firebase user
          const backendToken = await AsyncStorage.getItem('authToken');
          if (backendToken) {
            console.log('Found backend token without Firebase user');
            // Validate the token first
            const isValid = await validateToken(backendToken);
            if (isValid) {
              setToken(backendToken);
              await fetchUserProfile();
            } else {
              console.log('Token is invalid, clearing storage');
              await clearAuthStorage();
              setUser(null);
              setUserData(null);
              setToken(null);
              setLoading(false);
            }
          } else {
            console.log('No authentication found');
            setUser(null);
            setUserData(null);
            setToken(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setUser(null);
        setUserData(null);
        setToken(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Validate token with backend
  const validateToken = async (tokenToValidate) => {
    try {
      const response = await UserService.getUserProfileWithToken(tokenToValidate);
      return response.success;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  };

  // Clear all auth storage
  const clearAuthStorage = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userInfo');
    } catch (error) {
      console.error('Error clearing auth storage:', error);
    }
  };

  // Function to fetch user profile
  const fetchUserProfile = async () => {
    try {
      console.log('Fetching user profile...');
      
      const response = await UserService.getUserProfile();
      
      if (response.success) {
        console.log('User profile fetched successfully');
        
        setUserData(response.userData);
        
        // Update user with backend data including photoURL
        if (response.user) {
          setUser(prevUser => ({
            ...prevUser,
            ...response.user
          }));
        }
      } else {
        console.log('Failed to fetch user profile:', response.message);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (authToken, userInfo) => {
    try {
      console.log('UserContext login called with token:', authToken ? 'Token exists' : 'No token');
      
      // Store token
      await AsyncStorage.setItem('authToken', authToken);
      setToken(authToken);
      
      // Store user info if provided
      if (userInfo && userInfo.user) {
        setUser(userInfo.user);
      }
      
      // Fetch complete user profile
      await fetchUserProfile();
      
      return { success: true };
    } catch (error) {
      console.error('Login error in UserContext:', error);
      return { success: false, message: error.message };
    }
  };

  const refreshUserData = async () => {
    console.log('Refreshing user data...');
    await fetchUserProfile();
  };

  const updateUserProfile = async (profileData) => {
    try {
      console.log('Updating user profile:', profileData);
      const response = await UserService.updateUserProfile(profileData);
      
      if (response.success) {
        console.log('Profile updated successfully:', response);
        // Update local state with new data
        setUser(prev => ({ ...prev, ...response.user }));
        setUserData(response.userData);
        
        return { success: true };
      } else {
        console.log('Profile update failed:', response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: 'Failed to update profile' };
    }
  };

  const uploadProfilePicture = async (profilePicture) => {
    try {
      console.log('Uploading profile picture:', profilePicture);
      const response = await UserService.uploadProfilePicture(profilePicture);
      
      if (response.success) {
        console.log('Profile picture uploaded successfully:', response);
        
        // Update local state with new profile picture
        setUser(prev => ({ 
          ...prev, 
          photoURL: response.user?.photoURL 
        }));
        setUserData(prev => ({ 
          ...prev, 
          profilePicture: response.userData?.profilePicture 
        }));

        return { success: true };
      } else {
        console.log('Profile picture upload failed:', response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Upload profile picture error:', error);
      return { success: false, message: 'Failed to upload profile picture' };
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      const auth = getAuth();
      
      // Try to sign out from Firebase if there's a user
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          await signOut(auth);
          console.log('Firebase signout successful');
        }
      } catch (firebaseError) {
        console.log('Firebase signout not needed or failed:', firebaseError.message);
        // Continue with logout even if Firebase signout fails
      }
      
      // Clear local storage and state
      await clearAuthStorage();
      setUser(null);
      setUserData(null);
      setToken(null);
      console.log('Logout completed');
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, clear local state
      await clearAuthStorage();
      setUser(null);
      setUserData(null);
      setToken(null);
      return { success: false, message: error.message };
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        userData,
        token,
        loading,
        login,
        updateUserProfile,
        uploadProfilePicture,
        refreshUserData,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};



// // D:\cddd\NEW_reals2chat_frontend-main\src\context\UserContext.js
// import React, { createContext, useState, useContext, useEffect } from 'react';
// import { getAuth, onAuthStateChanged, signOut } from '@react-native-firebase/auth';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import UserService from '../services/userService';

// const UserContext = createContext();

// export const UserProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [userData, setUserData] = useState(null);
//   const [token, setToken] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const auth = getAuth();
    
//     const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
//       try {
//         console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'No user');
        
//         if (firebaseUser) {
//           console.log('Firebase user detected:', firebaseUser.email);
//           setUser(firebaseUser);
          
//           // Get backend token
//           const backendToken = await AsyncStorage.getItem('authToken');
//           console.log('Backend token from storage:', backendToken ? 'Exists' : 'Not found');
          
//           if (backendToken) {
//             setToken(backendToken);
//             // Fetch user profile data
//             await fetchUserProfile();
//           } else {
//             console.log('No backend token found');
//             setLoading(false);
//           }
//         } else {
//           console.log('No Firebase user, checking for backend token...');
//           // Check if we have a backend token even without Firebase user
//           const backendToken = await AsyncStorage.getItem('authToken');
//           if (backendToken) {
//             console.log('Found backend token without Firebase user');
//             // Validate the token first
//             const isValid = await validateToken(backendToken);
//             if (isValid) {
//               setToken(backendToken);
//               await fetchUserProfile();
//             } else {
//               console.log('Token is invalid, clearing storage');
//               await clearAuthStorage();
//               setUser(null);
//               setUserData(null);
//               setToken(null);
//               setLoading(false);
//             }
//           } else {
//             console.log('No authentication found');
//             setUser(null);
//             setUserData(null);
//             setToken(null);
//             setLoading(false);
//           }
//         }
//       } catch (error) {
//         console.error('Auth state change error:', error);
//         setUser(null);
//         setUserData(null);
//         setToken(null);
//         setLoading(false);
//       }
//     });

//     return unsubscribe;
//   }, []);

//   // Validate token with backend
//   const validateToken = async (tokenToValidate) => {
//     try {
//       const response = await UserService.getUserProfileWithToken(tokenToValidate);
//       return response.success;
//     } catch (error) {
//       console.error('Token validation failed:', error);
//       return false;
//     }
//   };

//   // Clear all auth storage
//   const clearAuthStorage = async () => {
//     try {
//       await AsyncStorage.removeItem('authToken');
//       await AsyncStorage.removeItem('userInfo');
//     } catch (error) {
//       console.error('Error clearing auth storage:', error);
//     }
//   };

//   // Function to fetch user profile
//   const fetchUserProfile = async () => {
//     try {
//       console.log('Fetching user profile...');
      
//       const response = await UserService.getUserProfile();
      
//       if (response.success) {
//         console.log('User profile fetched successfully');
        
//         setUserData(response.userData);
        
//         // Update user with backend data including photoURL
//         if (response.user) {
//           setUser(prevUser => ({
//             ...prevUser,
//             ...response.user
//           }));
//         }
//       } else {
//         console.log('Failed to fetch user profile:', response.message);
//       }
//     } catch (error) {
//       console.error('Error fetching user profile:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Login function
//   const login = async (authToken, userInfo) => {
//     try {
//       console.log('UserContext login called with token:', authToken ? 'Token exists' : 'No token');
      
//       // Store token
//       await AsyncStorage.setItem('authToken', authToken);
//       setToken(authToken);
      
//       // Store user info if provided
//       if (userInfo && userInfo.user) {
//         setUser(userInfo.user);
//       }
      
//       // Fetch complete user profile
//       await fetchUserProfile();
      
//       return { success: true };
//     } catch (error) {
//       console.error('Login error in UserContext:', error);
//       return { success: false, message: error.message };
//     }
//   };

//   const refreshUserData = async () => {
//     console.log('Refreshing user data...');
//     await fetchUserProfile();
//   };

//   const updateUserProfile = async (profileData) => {
//     try {
//       console.log('Updating user profile:', profileData);
//       const response = await UserService.updateUserProfile(profileData);
      
//       if (response.success) {
//         console.log('Profile updated successfully:', response);
//         // Update local state with new data
//         setUser(prev => ({ ...prev, ...response.user }));
//         setUserData(response.userData);
        
//         return { success: true };
//       } else {
//         console.log('Profile update failed:', response.message);
//         return { success: false, message: response.message };
//       }
//     } catch (error) {
//       console.error('Update profile error:', error);
//       return { success: false, message: 'Failed to update profile' };
//     }
//   };

//   const uploadProfilePicture = async (profilePicture) => {
//     try {
//       console.log('Uploading profile picture:', profilePicture);
//       const response = await UserService.uploadProfilePicture(profilePicture);
      
//       if (response.success) {
//         console.log('Profile picture uploaded successfully:', response);
        
//         // Update local state with new profile picture
//         setUser(prev => ({ 
//           ...prev, 
//           photoURL: response.user?.photoURL 
//         }));
//         setUserData(prev => ({ 
//           ...prev, 
//           profilePicture: response.userData?.profilePicture 
//         }));

//         return { success: true };
//       } else {
//         console.log('Profile picture upload failed:', response.message);
//         return { success: false, message: response.message };
//       }
//     } catch (error) {
//       console.error('Upload profile picture error:', error);
//       return { success: false, message: 'Failed to upload profile picture' };
//     }
//   };

//   const logout = async () => {
//     try {
//       console.log('Logging out...');
//       const auth = getAuth();
      
//       // Try to sign out from Firebase if there's a user
//       try {
//         const currentUser = auth.currentUser;
//         if (currentUser) {
//           await signOut(auth);
//           console.log('Firebase signout successful');
//         }
//       } catch (firebaseError) {
//         console.log('Firebase signout not needed or failed:', firebaseError.message);
//         // Continue with logout even if Firebase signout fails
//       }
      
//       // Clear local storage and state
//       await clearAuthStorage();
//       setUser(null);
//       setUserData(null);
//       setToken(null);
//       console.log('Logout completed');
      
//       return { success: true };
//     } catch (error) {
//       console.error('Logout error:', error);
//       // Even if there's an error, clear local state
//       await clearAuthStorage();
//       setUser(null);
//       setUserData(null);
//       setToken(null);
//       return { success: false, message: error.message };
//     }
//   };

//   return (
//     <UserContext.Provider
//       value={{
//         user,
//         userData,
//         token,
//         loading,
//         login,
//         updateUserProfile,
//         uploadProfilePicture,
//         refreshUserData,
//         logout,
//       }}
//     >
//       {children}
//     </UserContext.Provider>
//   );
// };

// export const useUser = () => {
//   const context = useContext(UserContext);
//   if (!context) {
//     throw new Error('useUser must be used within a UserProvider');
//   }
//   return context;
// };