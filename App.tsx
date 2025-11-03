import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome5';

import HomeScreen from './src/homescreen';
import FriendsScreen from './src/FriendsScreen';
import CreateScreen from './src/CreateScreen';
import ChatScreen from './src/ChatScreen';
import ProfileScreen from './src/ProfileScreen';
import LoginScreen from './src/login';
import RegisterScreen from './src/register';
import CameraScreen from './src/Create/Camera';
import UploadScreen from './src/Create/Upload';
import AIGenerateScreen from './src/Create/AIGenerate';
import TemplatesScreen from './src/Create/Templates';
import { theme } from './styles/theme';

// Import your API URL configuration
import API_URL from './src/utiliti/config';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const CreateStack = createStackNavigator();

const CreateStackScreen = () => (
  <CreateStack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: '#0f2027' },
      cardStyleInterpolator: ({ current }) => ({
        cardStyle: {
          opacity: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
            extrapolate: 'clamp',
          }),
        },
        transitionSpec: {
          open: { animation: 'timing', config: { duration: 300 } },
          close: { animation: 'timing', config: { duration: 300 } },
        },
      }),
    }}
  >
    <CreateStack.Screen name="CreateMain" component={CreateScreen} />
    <CreateStack.Screen name="Camera" component={CameraScreen} />
    <CreateStack.Screen name="Upload" component={UploadScreen} />
    <CreateStack.Screen name="AIGenerate" component={AIGenerateScreen} />
    <CreateStack.Screen name="Templates" component={TemplatesScreen} />
  </CreateStack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === 'Home') iconName = 'home';
        else if (route.name === 'Friends') iconName = 'user-friends';
        else if (route.name === 'Create') iconName = 'plus-square';
        else if (route.name === 'Chat') iconName = 'comment';
        else if (route.name === 'Profile') iconName = 'user';

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: theme.accentColor,
      tabBarInactiveTintColor: theme.textSecondary,
      tabBarStyle: {
        backgroundColor: theme.headerBg,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        paddingVertical: 12,
      },
      tabBarLabelStyle: { fontSize: 12, fontFamily: 'Segoe UI' },
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Friends" component={FriendsScreen} />
    <Tab.Screen name="Create" component={CreateStackScreen} />
    <Tab.Screen name="Chat" component={ChatScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const App: React.FC = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Check Firebase authentication state
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        // Check for backend token
        const token = await AsyncStorage.getItem('authToken');
        const userInfo = await AsyncStorage.getItem('userInfo');
        
        if (currentUser) {
          // User is authenticated with Firebase
          console.log('Firebase user found:', currentUser.email);
          setUser(currentUser);
          
          // If we don't have a backend token but have a Firebase user,
          // try to get a backend token (for Google sign-in users)
          if (!token && currentUser.email) {
            try {
              const idToken = await currentUser.getIdToken();
              const response = await fetch(`${API_URL}/api/auth/google-signin`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: currentUser.email,
                  name: currentUser.displayName,
                  idToken: idToken,
                }),
              });

              if (response.ok) {
                const data = await response.json();
                await AsyncStorage.setItem('authToken', data.token);
                await AsyncStorage.setItem('userInfo', JSON.stringify({
                  email: data.user.email,
                  name: data.user.name,
                  phone: data.user.phone,
                  registrationComplete: data.user.registrationComplete
                }));
              }
            } catch (error) {
              console.error('Error getting backend token from Firebase user:', error);
            }
          }
          
          setIsAuthenticated(true);
        } 
        // If no Firebase user but we have a backend token, validate it
        else if (token) {
          try {
            const response = await fetch(`${API_URL}/api/auth/profile`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            });

            if (response.ok) {
              // Token is valid
              setIsAuthenticated(true);
              if (userInfo) {
                try {
                  setUser(JSON.parse(userInfo));
                } catch (e) {
                  console.error('Error parsing userInfo:', e);
                  setUser({ email: 'Backend User' });
                }
              } else {
                setUser({ email: 'Backend User' });
              }
            } else {
              // Token is invalid, clear it
              await AsyncStorage.removeItem('authToken');
              await AsyncStorage.removeItem('userInfo');
              setIsAuthenticated(false);
              setUser(null);
            }
          } catch (error) {
            console.error('Error validating backend token:', error);
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('userInfo');
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          // No Firebase user and no backend token
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking authentication state:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setInitializing(false);
      }
    };

    // Set up Firebase auth state listener
    const auth = getAuth();
    const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // When Firebase auth state changes, re-check authentication
      checkAuthentication();
    });

    // Initial check
    checkAuthentication();

    return () => authUnsubscribe();
  }, []);

  if (initializing) {
    return null; // Or a loading spinner
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'Main' : 'Login'}
        screenOptions={{
          cardStyle: { backgroundColor: '#0f2027' },
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
                extrapolate: 'clamp',
              }),
            },
            transitionSpec: {
              open: { animation: 'timing', config: { duration: 300 } },
              close: { animation: 'timing', config: { duration: 300 } },
            },
          }),
        }}
      >
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        {!isAuthenticated && (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;




// import React, { useEffect, useState } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createStackNavigator } from '@react-navigation/stack';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
// import Icon from 'react-native-vector-icons/FontAwesome5';

// import HomeScreen from './src/homescreen';
// import FriendsScreen from './src/FriendsScreen';
// import CreateScreen from './src/CreateScreen';
// import ChatScreen from './src/ChatScreen';
// import ProfileScreen from './src/ProfileScreen';
// import LoginScreen from './src/login';
// import RegisterScreen from './src/register';
// import CameraScreen from './src/Create/Camera';
// import UploadScreen from './src/Create/Upload';
// import AIGenerateScreen from './src/Create/AIGenerate';
// import TemplatesScreen from './src/Create/Templates';
// import { theme } from './styles/theme';

// const Stack = createStackNavigator();
// const Tab = createBottomTabNavigator();
// const CreateStack = createStackNavigator();

// const CreateStackScreen = () => (
//   <CreateStack.Navigator
//     screenOptions={{
//       headerShown: false,
//       cardStyle: { backgroundColor: '#0f2027' },
//       cardStyleInterpolator: ({ current }) => ({
//         cardStyle: {
//           opacity: current.progress.interpolate({
//             inputRange: [0, 1],
//             outputRange: [0, 1],
//             extrapolate: 'clamp',
//           }),
//         },
//         transitionSpec: {
//           open: { animation: 'timing', config: { duration: 300 } },
//           close: { animation: 'timing', config: { duration: 300 } },
//         },
//       }),
//     }}
//   >
//     <CreateStack.Screen name="CreateMain" component={CreateScreen} />
//     <CreateStack.Screen name="Camera" component={CameraScreen} />
//     <CreateStack.Screen name="Upload" component={UploadScreen} />
//     <CreateStack.Screen name="AIGenerate" component={AIGenerateScreen} />
//     <CreateStack.Screen name="Templates" component={TemplatesScreen} />
//   </CreateStack.Navigator>
// );

// const MainTabs = () => (
//   <Tab.Navigator
//     screenOptions={({ route }) => ({
//       tabBarIcon: ({ color, size }) => {
//         let iconName;
//         if (route.name === 'Home') iconName = 'home';
//         else if (route.name === 'Friends') iconName = 'user-friends';
//         else if (route.name === 'Create') iconName = 'plus-square';
//         else if (route.name === 'Chat') iconName = 'comment';
//         else if (route.name === 'Profile') iconName = 'user';

//         return <Icon name={iconName} size={size} color={color} />;
//       },
//       tabBarActiveTintColor: theme.accentColor,
//       tabBarInactiveTintColor: theme.textSecondary,
//       tabBarStyle: {
//         backgroundColor: theme.headerBg,
//         borderTopWidth: 1,
//         borderTopColor: 'rgba(255, 255, 255, 0.1)',
//         paddingVertical: 12,
//       },
//       tabBarLabelStyle: { fontSize: 12, fontFamily: 'Segoe UI' },
//       headerShown: false,
//     })}
//   >
//     <Tab.Screen name="Home" component={HomeScreen} />
//     <Tab.Screen name="Friends" component={FriendsScreen} />
//     <Tab.Screen name="Create" component={CreateStackScreen} />
//     <Tab.Screen name="Chat" component={ChatScreen} />
//     <Tab.Screen name="Profile" component={ProfileScreen} />
//   </Tab.Navigator>
// );

// const App: React.FC = () => {
//   const [initializing, setInitializing] = useState(true);
//   const [user, setUser] = useState<any>(null);

//   useEffect(() => {
//     const authUnsubscribe = onAuthStateChanged(getAuth(), (currentUser) => {
//       setUser(currentUser);
//       if (initializing) setInitializing(false);
//     });
//     return () => authUnsubscribe();
//   }, [initializing]);

//   if (initializing) return null;

//   return (
//     <NavigationContainer>
//       <Stack.Navigator
//         initialRouteName={user ? 'Main' : 'Login'}
//         screenOptions={{
//           cardStyle: { backgroundColor: '#0f2027' },
//           cardStyleInterpolator: ({ current }) => ({
//             cardStyle: {
//               opacity: current.progress.interpolate({
//                 inputRange: [0, 1],
//                 outputRange: [0, 1],
//                 extrapolate: 'clamp',
//               }),
//             },
//             transitionSpec: {
//               open: { animation: 'timing', config: { duration: 300 } },
//               close: { animation: 'timing', config: { duration: 300 } },
//             },
//           }),
//         }}
//       >
//         <Stack.Screen
//           name="Main"
//           component={MainTabs}
//           options={{ headerShown: false }}
//         />
//         {!user && (
//           <>
//             <Stack.Screen
//               name="Login"
//               component={LoginScreen}
//               options={{ headerShown: false }}
//             />
//             <Stack.Screen
//               name="Register"
//               component={RegisterScreen}
//               options={{ headerShown: false }}
//             />
//           </>
//         )}
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// export default App;