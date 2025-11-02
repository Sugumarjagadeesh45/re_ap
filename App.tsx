import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
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

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(getAuth(), (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });
    return () => authUnsubscribe();
  }, [initializing]);

  if (initializing) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={user ? 'Main' : 'Login'}
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
        {!user && (
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