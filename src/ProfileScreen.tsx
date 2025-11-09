import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  PermissionsAndroid,
  Dimensions
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useUser } from './context/UserContext';
import UserService from './services/userService';
import { theme } from '../styles/theme';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import { useNavigation, CommonActions } from '@react-navigation/native';

const gradientColors = ['#0f2027', '#203a43', '#2c5364'];
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, userData, loading, token, updateUserProfile, uploadProfilePicture, refreshUserData, logout } = useUser();
  const [activeTab, setActiveTab] = useState('Posts');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [stats, setStats] = useState({
    postsCount: 0,
    followersCount: 0,
    followingCount: 0,
    profileCompletion: 75
  });
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [userId, setUserId] = useState(''); // State to hold the User ID
  
  // Menu states
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  
  // Camera states
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [cameraInitialized, setCameraInitialized] = useState(false);
  const cameraRef = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices?.find(d => d.position === (isFrontCamera ? 'front' : 'back')) ?? devices?.[0] ?? null;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    website: '',
    gender: '',
    dateOfBirth: ''
  });

  // Load user data including User ID
  useEffect(() => {
    if (token) {
      loadUserData();
    }
  }, [token]);


  useEffect(() => {
  if (user) {
    setFormData({
      name: user.name || '',
      bio: userData?.bio || '',
      location: userData?.location || '',
      website: userData?.website || '',
      gender: user.gender || '',
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''
    });
    
    // Prioritize the custom userId field
    const userID = user.userId || user._id || user.id;
    if (userID) {
      console.log('Setting User ID from user object:', userID);
      setUserId(userID);
    }
  }
}, [user, userData]);

const loadUserData = async () => {
  try {
    console.log('Loading user data including User ID...');
    
    // First try to get from user context
    if (user) {
      // Prioritize the custom userId field
      const userID = user.userId || user._id || user.id;
      if (userID) {
        console.log('User ID from context:', userID);
        setUserId(userID);
        return;
      }
    }
    
    // If not in context, fetch from API
    const response = await UserService.getUserProfile();
    console.log('User profile API response:', response);
    
    if (response.success && response.data) {
      console.log('User profile data:', response.data);
      
      // Set User ID from the user object in the response
      const userID = response.data.user?.userId || response.data.user?._id || response.data.user?.id;
      if (userID) {
        console.log('Setting User ID from API:', userID);
        setUserId(userID);
      } else {
        console.log('No User ID found in profile response');
      }
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
};
// Update the debug function to check the correct field
const debugUserData = () => {
  console.log('=== USER DATA DEBUG ===');
  console.log('User object:', user);
  console.log('User _id (MongoDB ID):', user?._id);
  console.log('User userId (Display ID):', user?.userId); // This is what you want
  console.log('User Data object:', userData);
  console.log('Current userId state:', userId);
  console.log('======================');
};


  // Call debug function when component mounts or user changes
  useEffect(() => {
    if (user) {
      debugUserData();
    }
  }, [user]);

  
  // Camera permission
  useEffect(() => {
    if (cameraModalVisible) {
      checkCameraPermission();
    }
  }, [cameraModalVisible]);

  const checkCameraPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        if (granted) {
          setHasCameraPermission(true);
          setCameraInitialized(true);
          return true;
        }
        const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
        const ok = res === PermissionsAndroid.RESULTS.GRANTED;
        setHasCameraPermission(ok);
        setCameraInitialized(true);
        return ok;
      } else {
        const status = await Camera.requestCameraPermission();
        const ok = status === 'granted';
        setHasCameraPermission(ok);
        setCameraInitialized(true);
        return ok;
      }
    } catch (error) {
      console.error('Camera permission error:', error);
      setCameraInitialized(true);
      return false;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUserData();
    await loadUserData();
    setRefreshing(false);
  };

  const handleUpdateProfile = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    setUpdating(true);
    try {
      const result = await updateUserProfile(formData);
      if (result.success) {
        setEditModalVisible(false);
        Alert.alert('Success', 'Profile updated successfully');
        // Refresh data to get updated User ID if it was changed
        await loadUserData();
      } else {
        Alert.alert('Error', result.message || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  // Menu functions
  const handleMenuPress = () => {
    setMenuModalVisible(true);
  };

  const handleMenuOptionPress = (option) => {
    setMenuModalVisible(false);
    
    switch (option) {
      case 'logout':
        handleLogout();
        break;
      case 'settings':
        Alert.alert('Settings', 'Settings screen would open here');
        break;
      case 'blocked':
        Alert.alert('Blocked Users', 'Blocked users list would open here');
        break;
      case 'report':
        Alert.alert('Report', 'Report options would appear here');
        break;
      case 'requests':
        Alert.alert('Requests', 'Friend/follow requests would appear here');
        break;
      case 'archive':
        Alert.alert('Archive', 'Archived content would appear here');
        break;
      case 'saved':
        Alert.alert('Saved', 'Saved reels would appear here');
        break;
      case 'drafts':
        Alert.alert('Drafts', 'Draft reels would appear here');
        break;
      case 'analytics':
        Alert.alert('Analytics', 'Content analytics would appear here');
        break;
      case 'monetization':
        Alert.alert('Monetization', 'Monetization settings would appear here');
        break;
      case 'creator':
        Alert.alert('Creator Studio', 'Creator studio would open here');
        break;
      case 'privacy':
        Alert.alert('Privacy', 'Privacy settings would appear here');
        break;
      case 'help':
        Alert.alert('Help & Support', 'Help center would open here');
        break;
      default:
        break;
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              console.log('Logout successful, navigating to Login...');
              
              try {
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  })
                );
              } catch (error1) {
                console.log('First navigation approach failed:', error1.message);
                
                try {
                  navigation.getParent()?.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [{ name: 'Login' }],
                    })
                  );
                } catch (error2) {
                  console.log('Second navigation approach failed:', error2.message);
                  
                  try {
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Login' }],
                    });
                  } catch (error3) {
                    console.log('Third navigation approach failed:', error3.message);
                    navigation.navigate('Login');
                  }
                }
              }
            } catch (error) {
              console.error('Logout navigation error:', error);
              Alert.alert('Logged Out', 'You have been successfully logged out.');
            }
          },
        },
      ]
    );
  };

  // Convert image to base64
  const convertImageToBase64 = async (imageUri) => {
    try {
      console.log('Converting image to base64:', imageUri);
      
      if (imageUri.startsWith('data:image')) {
        console.log('Image is already base64');
        return imageUri;
      }
      
      const cleanUri = imageUri.replace('file://', '');
      
      const fileExists = await RNFS.exists(cleanUri);
      if (!fileExists) {
        throw new Error('Image file does not exist');
      }
      
      const base64 = await RNFS.readFile(cleanUri, 'base64');
      console.log('Image converted to base64, length:', base64.length);
      
      let mimeType = 'image/jpeg';
      if (imageUri.toLowerCase().includes('.png')) mimeType = 'image/png';
      if (imageUri.toLowerCase().includes('.gif')) mimeType = 'image/gif';
      if (imageUri.toLowerCase().includes('.webp')) mimeType = 'image/webp';
      
      const base64Image = `data:${mimeType};base64,${base64}`;
      console.log('Base64 image created with MIME type:', mimeType);
      
      return base64Image;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error(`Failed to convert image: ${error.message}`);
    }
  };

  const handleImageUpload = async (imageUrl) => {
    try {
      if (!imageUrl) {
        throw new Error('No image URL provided');
      }
      
      console.log('Original image URL:', imageUrl);
      
      const base64Image = await convertImageToBase64(imageUrl);
      
      console.log('Uploading base64 image, length:', base64Image.length);
      
      const result = await uploadProfilePicture(base64Image);
      if (result.success) {
        Alert.alert('Success', 'Profile picture updated successfully');
        setCameraModalVisible(false);
        await refreshUserData();
      } else {
        Alert.alert('Error', result.message || 'Failed to update profile picture');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert('Error', 'Failed to process image: ' + error.message);
    }
  };

  const handleProfilePicturePress = () => {
    setCameraModalVisible(true);
  };

  const handleFlipCamera = () => {
    setIsFrontCamera(prev => !prev);
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current || isTakingPhoto) return;
    setIsTakingPhoto(true);
    try {
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        qualityPrioritization: 'quality',
      });
      
      let imageUri = photo.path;
      if (Platform.OS === 'android' && !imageUri.startsWith('file://')) {
        imageUri = 'file://' + imageUri;
      }
      
      console.log('Camera photo URI:', imageUri);
      await handleImageUpload(imageUri);
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setIsTakingPhoto(false);
    }
  };

  const handleOpenGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
      });
      
      if (result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        console.log('Gallery image URI:', selectedImage.uri);
        await handleImageUpload(selectedImage.uri);
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  // Helper function to check if image URI is valid
  const getProfileImageUri = () => {
    const sources = [
      user?.photoURL,
      userData?.profilePicture
    ];

    const validSource = sources.find(source => 
      source && 
      (source.startsWith('data:image') || source.startsWith('http'))
    );

    return validSource || 'https://randomuser.me/api/portraits/men/1.jpg';
  };

  const renderPost = ({ item }) => (
    <TouchableOpacity style={styles.profilePost}>
      <Image source={{ uri: item.image }} style={styles.profilePostImage} />
      {activeTab === 'Reels' && (
        <View style={styles.reelInfo}>
          <Icon name="play-arrow" size={12} color={theme.textPrimary} />
          <Text style={styles.reelViews}>{item.views}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Icon name="photo-library" size={40} color={theme.textSecondary} />
      <Text style={styles.emptyText}>No {activeTab.toLowerCase()} yet</Text>
    </View>
  );

  // Menu options data
  const menuOptions = [
    { id: 'settings', icon: 'settings', title: 'Settings', color: theme.textPrimary },
    { id: 'saved', icon: 'bookmark', title: 'Saved Reels', color: theme.textPrimary },
    { id: 'drafts', icon: 'drafts', title: 'Drafts', color: theme.textPrimary },
    { id: 'archive', icon: 'archive', title: 'Archive', color: theme.textPrimary },
    { id: 'analytics', icon: 'analytics', title: 'Analytics', color: theme.textPrimary },
    { id: 'monetization', icon: 'attach-money', title: 'Monetization', color: theme.textPrimary },
    { id: 'creator', icon: 'star', title: 'Creator Studio', color: theme.textPrimary },
    { id: 'requests', icon: 'group-add', title: 'Requests', color: theme.textPrimary },
    { id: 'blocked', icon: 'block', title: 'Blocked Users', color: theme.textPrimary },
    { id: 'privacy', icon: 'lock', title: 'Privacy', color: theme.textPrimary },
    { id: 'help', icon: 'help', title: 'Help & Support', color: theme.textPrimary },
    { id: 'report', icon: 'flag', title: 'Report a Problem', color: theme.textPrimary },
    { id: 'logout', icon: 'logout', title: 'Logout', color: '#FF4444' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={gradientColors} style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accentColor} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />
      <LinearGradient colors={gradientColors} style={styles.container}>
        <View style={styles.containerInner}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Icon name="person" size={22} color={theme.accentColor} />
              <Text style={styles.logo}>REELS2CHAT</Text>
            </View>
            <TouchableOpacity style={styles.menuIcon} onPress={handleMenuPress}>
              <Icon name="menu" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView 
            style={styles.content}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View style={styles.profileHeader}>
              <TouchableOpacity 
                style={styles.profileAvatarContainer}
                onPress={handleProfilePicturePress}
              >
                <Image 
                  source={{ uri: getProfileImageUri() }} 
                  style={styles.profileAvatarImage} 
                  onError={(e) => {
                    console.log('Image load error:', e.nativeEvent.error);
                  }}
                />
                <View style={styles.editPhotoButton}>
                  <Icon name="camera-alt" size={16} color={theme.textPrimary} />
                </View>
              </TouchableOpacity>
              
              <Text style={styles.profileName}>{user?.name || 'Unknown User'}</Text>
              
              {/* Display User ID from state */}
              <Text style={styles.profileUserId}>ID: {userId || 'No ID'}</Text>
              
              <Text style={styles.profileBio}>{userData?.bio || 'No bio yet'}</Text>
              {userData?.location && (
                <View style={styles.profileDetail}>
                  <Icon name="location-on" size={14} color={theme.textSecondary} />
                  <Text style={styles.profileDetailText}>{userData.location}</Text>
                </View>
              )}
              
              <View style={styles.profileStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statCount}>{stats.postsCount}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statCount}>{stats.followersCount}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statCount}>{stats.followingCount}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statCount}>{stats.profileCompletion}%</Text>
                  <Text style={styles.statLabel}>Complete</Text>
                </View>
              </View>
              
              <View style={styles.profileActions}>
                <TouchableOpacity 
                  style={[styles.profileBtn, styles.editBtn]}
                  onPress={() => setEditModalVisible(true)}
                >
                  <Text style={styles.profileBtnText}>Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.profileBtn, styles.shareBtn]}>
                  <Text style={styles.profileBtnText}>Share Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.profileTabs}>
              {['Posts', 'Reels', 'Tagged'].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.profileTab, activeTab === tab && styles.profileTabActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.profileTabText, activeTab === tab && styles.profileTabTextActive]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <FlatList
              data={[]}
              renderItem={renderPost}
              keyExtractor={(item, index) => index.toString()}
              numColumns={3}
              style={styles.profileContent}
              ListEmptyComponent={<EmptyComponent />}
              scrollEnabled={false}
            />
          </ScrollView>
        </View>
      </LinearGradient>
      
      {/* Menu Modal */}
      <Modal
        visible={menuModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMenuModalVisible(false)}
      >
        <View style={styles.menuModalOverlay}>
          <TouchableOpacity 
            style={styles.menuModalBackdrop}
            activeOpacity={1}
            onPress={() => setMenuModalVisible(false)}
          />
          <View style={styles.menuModalContainer}>
            <View style={styles.menuModalContent}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>Options</Text>
                <TouchableOpacity 
                  style={styles.menuCloseButton}
                  onPress={() => setMenuModalVisible(false)}
                >
                  <Icon name="close" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                style={styles.menuBody}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.menuBodyContent}
              >
                {menuOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.menuOption,
                      option.id === 'logout' && styles.menuOptionLogout
                    ]}
                    onPress={() => handleMenuOptionPress(option.id)}
                  >
                    <Icon 
                      name={option.icon} 
                      size={22} 
                      color={option.color} 
                      style={styles.menuOptionIcon} 
                    />
                    <Text style={[
                      styles.menuOptionText,
                      option.id === 'logout' && styles.logoutText
                    ]}>
                      {option.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Icon name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({...formData, name: text})}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.bio}
                  onChangeText={(text) => setFormData({...formData, bio: text})}
                  placeholder="Tell us about yourself"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={formData.location}
                  onChangeText={(text) => setFormData({...formData, location: text})}
                  placeholder="Where are you from?"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Website</Text>
                <TextInput
                  style={styles.input}
                  value={formData.website}
                  onChangeText={(text) => setFormData({...formData, website: text})}
                  placeholder="Your website URL"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Gender</Text>
                <TextInput
                  style={styles.input}
                  value={formData.gender}
                  onChangeText={(text) => setFormData({...formData, gender: text})}
                  placeholder="Your gender"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Date of Birth</Text>
                <TextInput
                  style={styles.input}
                  value={formData.dateOfBirth}
                  onChangeText={(text) => setFormData({...formData, dateOfBirth: text})}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateProfile}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color={theme.textPrimary} />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Camera Modal */}
      <Modal
        visible={cameraModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setCameraModalVisible(false)}
      >
        <View style={styles.cameraContainer}>
          <StatusBar backgroundColor="#000" barStyle="light-content" />
          
          {/* Camera Header */}
          <View style={styles.cameraHeader}>
            <TouchableOpacity 
              style={styles.cameraCloseButton}
              onPress={() => setCameraModalVisible(false)}
            >
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.cameraTitle}>Update Profile Picture</Text>
            <View style={styles.cameraHeaderPlaceholder} />
          </View>
          
          {/* Camera View */}
          {cameraInitialized && hasCameraPermission && device ? (
            <Camera
              ref={cameraRef}
              style={styles.camera}
              device={device}
              isActive={cameraModalVisible}
              photo={true}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.cameraPlaceholder}>
              <Text style={styles.cameraPlaceholderText}>
                {!hasCameraPermission ? 'Camera permission required' : 'Camera not available'}
              </Text>
            </View>
          )}
          
          {/* Camera Controls */}
          <View style={styles.cameraControls}>
            {/* Gallery Button - Left */}
            <TouchableOpacity 
              style={styles.cameraControlButton}
              onPress={handleOpenGallery}
            >
              <Icon name="photo-library" size={28} color="#fff" />
              <Text style={styles.cameraControlText}>Gallery</Text>
            </TouchableOpacity>
            
            {/* Capture Button - Center */}
            <TouchableOpacity
              style={[styles.captureButton, isTakingPhoto && styles.captureButtonDisabled]}
              onPress={handleTakePhoto}
              disabled={isTakingPhoto}
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>
            
            {/* Flip Camera Button - Right */}
            <TouchableOpacity 
              style={styles.cameraControlButton}
              onPress={handleFlipCamera}
            >
              <Icon name="flip-camera-ios" size={28} color="#fff" />
              <Text style={styles.cameraControlText}>Flip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  profileUserId: {
    fontSize: 14,
    color: theme.accentColor,
    marginBottom: 5,
    fontWeight: '600',
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.textPrimary,
    marginTop: 10,
    fontSize: 16,
  },
  containerInner: {
    maxWidth: 480,
    width: '100%',
    flex: 1,
    alignSelf: 'center',
    paddingTop: StatusBar.currentHeight || 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(18, 24, 38, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.textPrimary,
    marginLeft: 8,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(30, 40, 50, 0.7)',
    borderRadius: 16,
    padding: 20,
    margin: 16,
  },
  profileAvatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: theme.accentColor,
    marginBottom: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 5,
  },
  profileBio: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 10,
    textAlign: 'center',
  },
  profileDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  profileDetailText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginLeft: 5,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    marginBottom: 20,
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statCount: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  profileActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  profileBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  editBtn: {
    backgroundColor: theme.accentColor,
  },
  shareBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.accentColor,
  },
  profileBtnText: {
    color: theme.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  profileTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 40, 50, 0.7)',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  profileTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  profileTabActive: {
    backgroundColor: 'rgba(255, 0, 119, 0.15)',
  },
  profileTabText: {
    fontWeight: '600',
    fontSize: 14,
    color: theme.textSecondary,
  },
  profileTabTextActive: {
    color: theme.accentColor,
  },
  profileContent: {
    backgroundColor: 'rgba(30, 40, 50, 0.7)',
    borderRadius: 16,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  profilePost: {
    flex: 1,
    aspectRatio: 1,
    margin: 4,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  profilePostImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  reelInfo: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  reelViews: {
    color: theme.textPrimary,
    fontSize: 10,
    marginLeft: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    color: theme.textSecondary,
    textAlign: 'center',
    fontSize: 16,
    marginTop: 10,
  },
  menuModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  menuModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuModalContainer: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    top:20,
    maxHeight: '70%',
    marginBottom: Platform.OS === 'android' ? 20 : 0,
  },
  menuModalContent: {
    paddingBottom: Platform.OS === 'android' ? 30 : 20,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  menuCloseButton: {
    padding: 4,
  },
  menuBody: {
    maxHeight: 400,
  },
  menuBodyContent: {
    padding: 20,
    paddingTop: 10,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  menuOptionLogout: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    borderBottomWidth: 0,
  },
  menuOptionIcon: {
    marginRight: 15,
    width: 24,
  },
  menuOptionText: {
    fontSize: 16,
    color: theme.textPrimary,
    fontWeight: '500',
  },
  logoutText: {
    color: '#FF4444',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    color: theme.textPrimary,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  saveButton: {
    backgroundColor: theme.accentColor,
  },
  cancelButtonText: {
    color: theme.textPrimary,
    fontWeight: '600',
  },
  saveButtonText: {
    color: theme.textPrimary,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  cameraCloseButton: {
    padding: 8,
  },
  cameraTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cameraHeaderPlaceholder: {
    width: 40,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  cameraPlaceholderText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 30,
    backgroundColor: '#000',
  },
  cameraControlButton: {
    alignItems: 'center',
    padding: 10,
  },
  cameraControlText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
});

export default ProfileScreen;

// import React, { useState, useEffect, useRef } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   SafeAreaView,
//   StatusBar,
//   Image,
//   TouchableOpacity,
//   FlatList,
//   TextInput,
//   Modal,
//   ScrollView,
//   Alert,
//   ActivityIndicator,
//   RefreshControl,
//   Platform,
//   PermissionsAndroid,
//   Dimensions
// } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { useUser } from './context/UserContext';
// import UserService from './services/userService';
// import { theme } from '../styles/theme';
// import { Camera, useCameraDevices } from 'react-native-vision-camera';
// import { launchImageLibrary } from 'react-native-image-picker';
// import RNFS from 'react-native-fs';
// import { useNavigation, CommonActions } from '@react-navigation/native';

// const gradientColors = ['#0f2027', '#203a43', '#2c5364'];
// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// const ProfileScreen = () => {
//   const navigation = useNavigation();
//   const { user, userData, loading, token, updateUserProfile, uploadProfilePicture, refreshUserData, logout } = useUser();
//   const [activeTab, setActiveTab] = useState('Posts');
//   const [editModalVisible, setEditModalVisible] = useState(false);
//   const [stats, setStats] = useState(null);
//   const [refreshing, setRefreshing] = useState(false);
//   const [updating, setUpdating] = useState(false);
  
//   // Menu states
//   const [menuModalVisible, setMenuModalVisible] = useState(false);
  
//   // Camera states
//   const [cameraModalVisible, setCameraModalVisible] = useState(false);
//   const [hasCameraPermission, setHasCameraPermission] = useState(false);
//   const [isFrontCamera, setIsFrontCamera] = useState(true);
//   const [isTakingPhoto, setIsTakingPhoto] = useState(false);
//   const [cameraInitialized, setCameraInitialized] = useState(false);
//   const cameraRef = useRef<Camera>(null);
//   const devices = useCameraDevices();
//   const device = devices?.find(d => d.position === (isFrontCamera ? 'front' : 'back')) ?? devices?.[0] ?? null;

//   // Form state
//   const [formData, setFormData] = useState({
//     name: '',
//     bio: '',
//     location: '',
//     website: '',
//     gender: '',
//     dateOfBirth: ''
//   });

//   // Load user stats
//   useEffect(() => {
//     if (token) {
//       loadUserStats();
//     }
//   }, [token]);

//   // Update form when user data changes
//   useEffect(() => {
//     if (user) {
//       setFormData({
//         name: user.name || '',
//         bio: userData?.bio || '',
//         location: userData?.location || '',
//         website: userData?.website || '',
//         gender: user.gender || '',
//         dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''
//       });
//     }
//   }, [user, userData]);

//   // Camera permission
//   useEffect(() => {
//     if (cameraModalVisible) {
//       checkCameraPermission();
//     }
//   }, [cameraModalVisible]);

//   const checkCameraPermission = async () => {
//     try {
//       if (Platform.OS === 'android') {
//         const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
//         if (granted) {
//           setHasCameraPermission(true);
//           setCameraInitialized(true);
//           return true;
//         }
//         const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
//         const ok = res === PermissionsAndroid.RESULTS.GRANTED;
//         setHasCameraPermission(ok);
//         setCameraInitialized(true);
//         return ok;
//       } else {
//         const status = await Camera.requestCameraPermission();
//         const ok = status === 'granted';
//         setHasCameraPermission(ok);
//         setCameraInitialized(true);
//         return ok;
//       }
//     } catch (error) {
//       console.error('Camera permission error:', error);
//       setCameraInitialized(true);
//       return false;
//     }
//   };

//   const loadUserStats = async () => {
//     try {
//       const response = await UserService.getUserStats();
//       if (response.success) {
//         setStats(response);
//       }
//     } catch (error) {
//       console.error('Error loading user stats:', error);
//     }
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await refreshUserData();
//     await loadUserStats();
//     setRefreshing(false);
//   };




//   const loadUserData = async () => {
// try {
// console.log('Loading user data including User ID...');

// // First try to get from user context
// if (user?.userId) {
// console.log('User ID from context:', user.userId);
// setUserId(user.userId);
// return;
// }

// // If not in context, fetch from API
// const response = await UserService.getUserProfile();
// console.log('User profile API response:', response);

// if (response.success && response.data) {
// console.log('User profile data:', response.data);

// // Set User ID from various possible fields
// const userID = response.data.userId || response.data.userID || response.data.id || user?.userId;
// if (userID) {
// console.log('Setting User ID from API:', userID);
// setUserId(userID);
// } else {
// console.log('No User ID found in profile response');
// }
// }
// } catch (error) {
// console.error('Error loading user data:', error);
// }
// };




//   const handleUpdateProfile = async () => {
//     if (!formData.name.trim()) {
//       Alert.alert('Error', 'Name is required');
//       return;
//     }
//     setUpdating(true);
//     try {
//       const result = await updateUserProfile(formData);
//       if (result.success) {
//         setEditModalVisible(false);
//         Alert.alert('Success', 'Profile updated successfully');
//       } else {
//         Alert.alert('Error', result.message || 'Failed to update profile');
//       }
//     } catch (error) {
//       Alert.alert('Error', 'Failed to update profile');
//     } finally {
//       setUpdating(false);
//     }
//   };

//   // Menu functions
//   const handleMenuPress = () => {
//     setMenuModalVisible(true);
//   };

//   const handleMenuOptionPress = (option) => {
//     setMenuModalVisible(false);
    
//     switch (option) {
//       case 'logout':
//         handleLogout();
//         break;
//       case 'settings':
//         // Navigate to settings screen
//         Alert.alert('Settings', 'Settings screen would open here');
//         break;
//       case 'blocked':
//         Alert.alert('Blocked Users', 'Blocked users list would open here');
//         break;
//       case 'report':
//         Alert.alert('Report', 'Report options would appear here');
//         break;
//       case 'requests':
//         Alert.alert('Requests', 'Friend/follow requests would appear here');
//         break;
//       case 'archive':
//         Alert.alert('Archive', 'Archived content would appear here');
//         break;
//       case 'saved':
//         Alert.alert('Saved', 'Saved reels would appear here');
//         break;
//       case 'drafts':
//         Alert.alert('Drafts', 'Draft reels would appear here');
//         break;
//       case 'analytics':
//         Alert.alert('Analytics', 'Content analytics would appear here');
//         break;
//       case 'monetization':
//         Alert.alert('Monetization', 'Monetization settings would appear here');
//         break;
//       case 'creator':
//         Alert.alert('Creator Studio', 'Creator studio would open here');
//         break;
//       case 'privacy':
//         Alert.alert('Privacy', 'Privacy settings would appear here');
//         break;
//       case 'help':
//         Alert.alert('Help & Support', 'Help center would open here');
//         break;
//       default:
//         break;
//     }
//   };

//   const handleLogout = async () => {
//     Alert.alert(
//       'Logout',
//       'Are you sure you want to logout?',
//       [
//         {
//           text: 'Cancel',
//           style: 'cancel',
//         },
//         {
//           text: 'Logout',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await logout();
//               console.log('Logout successful, navigating to Login...');
              
//               // Try multiple navigation approaches to ensure we reach the Login screen
//               try {
//                 // First try: Use navigation.dispatch with CommonActions
//                 navigation.dispatch(
//                   CommonActions.reset({
//                     index: 0,
//                     routes: [{ name: 'Login' }],
//                   })
//                 );
//               } catch (error1) {
//                 console.log('First navigation approach failed:', error1.message);
                
//                 try {
//                   // Second try: Use navigation.getParent()?.dispatch
//                   navigation.getParent()?.dispatch(
//                     CommonActions.reset({
//                       index: 0,
//                       routes: [{ name: 'Login' }],
//                     })
//                   );
//                 } catch (error2) {
//                   console.log('Second navigation approach failed:', error2.message);
                  
//                   try {
//                     // Third try: Use navigation.reset
//                     navigation.reset({
//                       index: 0,
//                       routes: [{ name: 'Login' }],
//                     });
//                   } catch (error3) {
//                     console.log('Third navigation approach failed:', error3.message);
                    
//                     // Fourth try: Use navigation.navigate as a fallback
//                     navigation.navigate('Login');
//                   }
//                 }
//               }
//             } catch (error) {
//               console.error('Logout navigation error:', error);
//               // Even if navigation fails, we've already logged out
//               Alert.alert('Logged Out', 'You have been successfully logged out.');
//             }
//           },
//         },
//       ]
//     );
//   };
//   // Convert image to base64
//   const convertImageToBase64 = async (imageUri) => {
//     try {
//       console.log('Converting image to base64:', imageUri);
      
//       // If it's already base64, return as is
//       if (imageUri.startsWith('data:image')) {
//         console.log('Image is already base64');
//         return imageUri;
//       }
      
//       // Remove file:// prefix if present
//       const cleanUri = imageUri.replace('file://', '');
      
//       // Check if file exists
//       const fileExists = await RNFS.exists(cleanUri);
//       if (!fileExists) {
//         throw new Error('Image file does not exist');
//       }
      
//       // Read file and convert to base64
//       const base64 = await RNFS.readFile(cleanUri, 'base64');
//       console.log('Image converted to base64, length:', base64.length);
      
//       // Determine MIME type from file extension or default to jpeg
//       let mimeType = 'image/jpeg';
//       if (imageUri.toLowerCase().includes('.png')) mimeType = 'image/png';
//       if (imageUri.toLowerCase().includes('.gif')) mimeType = 'image/gif';
//       if (imageUri.toLowerCase().includes('.webp')) mimeType = 'image/webp';
      
//       const base64Image = `data:${mimeType};base64,${base64}`;
//       console.log('Base64 image created with MIME type:', mimeType);
      
//       return base64Image;
//     } catch (error) {
//       console.error('Error converting image to base64:', error);
//       throw new Error(`Failed to convert image: ${error.message}`);
//     }
//   };

//   const handleImageUpload = async (imageUrl) => {
//     try {
//       if (!imageUrl) {
//         throw new Error('No image URL provided');
//       }
      
//       console.log('Original image URL:', imageUrl);
      
//       // Convert image to base64 before uploading
//       const base64Image = await convertImageToBase64(imageUrl);
      
//       console.log('Uploading base64 image, length:', base64Image.length);
      
//       const result = await uploadProfilePicture(base64Image);
//       if (result.success) {
//         Alert.alert('Success', 'Profile picture updated successfully');
//         setCameraModalVisible(false);
//         // Refresh data to show updated image
//         await refreshUserData();
//       } else {
//         Alert.alert('Error', result.message || 'Failed to update profile picture');
//       }
//     } catch (error) {
//       console.error('Image upload error:', error);
//       Alert.alert('Error', 'Failed to process image: ' + error.message);
//     }
//   };

//   const handleProfilePicturePress = () => {
//     setCameraModalVisible(true);
//   };

//   const handleFlipCamera = () => {
//     setIsFrontCamera(prev => !prev);
//   };

//   const handleTakePhoto = async () => {
//     if (!cameraRef.current || isTakingPhoto) return;
//     setIsTakingPhoto(true);
//     try {
//       const photo = await cameraRef.current.takePhoto({
//         flash: 'off',
//         qualityPrioritization: 'quality',
//       });
      
//       // Convert path to URI format
//       let imageUri = photo.path;
//       if (Platform.OS === 'android' && !imageUri.startsWith('file://')) {
//         imageUri = 'file://' + imageUri;
//       }
      
//       console.log('Camera photo URI:', imageUri);
//       await handleImageUpload(imageUri);
//     } catch (error) {
//       console.error('Error taking photo:', error);
//       Alert.alert('Error', 'Failed to take photo');
//     } finally {
//       setIsTakingPhoto(false);
//     }
//   };

//   const handleOpenGallery = async () => {
//     try {
//       const result = await launchImageLibrary({
//         mediaType: 'photo',
//         quality: 0.8,
//         maxWidth: 800,
//         maxHeight: 800,
//       });
      
//       if (result.assets && result.assets.length > 0) {
//         const selectedImage = result.assets[0];
//         console.log('Gallery image URI:', selectedImage.uri);
//         await handleImageUpload(selectedImage.uri);
//       }
//     } catch (error) {
//       console.error('Error opening gallery:', error);
//       Alert.alert('Error', 'Failed to open gallery');
//     }
//   };

//   // Helper function to check if image URI is valid
//   const getProfileImageUri = () => {
//     const sources = [
//       user?.photoURL,
//       userData?.profilePicture
//     ];

//     // Find first valid source that's base64 or URL (not local file)
//     const validSource = sources.find(source => 
//       source && 
//       (source.startsWith('data:image') || source.startsWith('http'))
//     );

//     return validSource || 'https://randomuser.me/api/portraits/men/1.jpg';
//   };

//   const renderPost = ({ item }) => (
//     <TouchableOpacity style={styles.profilePost}>
//       <Image source={{ uri: item.image }} style={styles.profilePostImage} />
//       {activeTab === 'Reels' && (
//         <View style={styles.reelInfo}>
//           <Icon name="play-arrow" size={12} color={theme.textPrimary} />
//           <Text style={styles.reelViews}>{item.views}</Text>
//         </View>
//       )}
//     </TouchableOpacity>
//   );

//   const EmptyComponent = () => (
//     <View style={styles.emptyContainer}>
//       <Icon name="photo-library" size={40} color={theme.textSecondary} />
//       <Text style={styles.emptyText}>No {activeTab.toLowerCase()} yet</Text>
//     </View>
//   );

//   // Menu options data
//   const menuOptions = [
//     { id: 'settings', icon: 'settings', title: 'Settings', color: theme.textPrimary },
//     { id: 'saved', icon: 'bookmark', title: 'Saved Reels', color: theme.textPrimary },
//     { id: 'drafts', icon: 'drafts', title: 'Drafts', color: theme.textPrimary },
//     { id: 'archive', icon: 'archive', title: 'Archive', color: theme.textPrimary },
//     { id: 'analytics', icon: 'analytics', title: 'Analytics', color: theme.textPrimary },
//     { id: 'monetization', icon: 'attach-money', title: 'Monetization', color: theme.textPrimary },
//     { id: 'creator', icon: 'star', title: 'Creator Studio', color: theme.textPrimary },
//     { id: 'requests', icon: 'group-add', title: 'Requests', color: theme.textPrimary },
//     { id: 'blocked', icon: 'block', title: 'Blocked Users', color: theme.textPrimary },
//     { id: 'privacy', icon: 'lock', title: 'Privacy', color: theme.textPrimary },
//     { id: 'help', icon: 'help', title: 'Help & Support', color: theme.textPrimary },
//     { id: 'report', icon: 'flag', title: 'Report a Problem', color: theme.textPrimary },
//     { id: 'logout', icon: 'logout', title: 'Logout', color: '#FF4444' },
//   ];

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <LinearGradient colors={gradientColors} style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={theme.accentColor} />
//           <Text style={styles.loadingText}>Loading profile...</Text>
//         </LinearGradient>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />
//       <LinearGradient colors={gradientColors} style={styles.container}>
//         <View style={styles.containerInner}>
//           <View style={styles.header}>
//             <View style={styles.logoContainer}>
//               <Icon name="person" size={22} color={theme.accentColor} />
//               <Text style={styles.logo}>REELS2CHAT</Text>
//             </View>
//             <TouchableOpacity style={styles.menuIcon} onPress={handleMenuPress}>
//               <Icon name="menu" size={24} color={theme.textPrimary} />
//             </TouchableOpacity>
//           </View>
//           <ScrollView 
//             style={styles.content}
//             refreshControl={
//               <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//             }
//           >
//             <View style={styles.profileHeader}>
//               <TouchableOpacity 
//                 style={styles.profileAvatarContainer}
//                 onPress={handleProfilePicturePress}
//               >
//                 <Image 
//                   source={{ uri: getProfileImageUri() }} 
//                   style={styles.profileAvatarImage} 
//                   onError={(e) => {
//                     console.log('Image load error:', e.nativeEvent.error);
//                   }}
//                 />
//                 <View style={styles.editPhotoButton}>
//                   <Icon name="camera-alt" size={16} color={theme.textPrimary} />
//                 </View>
//               </TouchableOpacity>
              
           

// <Text style={styles.profileName}>{user?.name || 'Unknown User'}</Text>
// {user?.userId && (
//   <Text style={styles.profileUserId}>ID: {user.userId}</Text>
// )}
// <Text style={styles.profileBio}>{userData?.bio || 'No bio yet'}</Text>
//               {userData?.location && (
//                 <View style={styles.profileDetail}>
//                   <Icon name="location-on" size={14} color={theme.textSecondary} />
//                   <Text style={styles.profileDetailText}>{userData.location}</Text>
//                 </View>
//               )}
              
//               {stats && (
//                 <View style={styles.profileStats}>
//                   <View style={styles.statItem}>
//                     <Text style={styles.statCount}>{stats.stats?.postsCount || 0}</Text>
//                     <Text style={styles.statLabel}>Posts</Text>
//                   </View>
//                   <View style={styles.statItem}>
//                     <Text style={styles.statCount}>{stats.stats?.followersCount || 0}</Text>
//                     <Text style={styles.statLabel}>Followers</Text>
//                   </View>
//                   <View style={styles.statItem}>
//                     <Text style={styles.statCount}>{stats.stats?.followingCount || 0}</Text>
//                     <Text style={styles.statLabel}>Following</Text>
//                   </View>
//                   <View style={styles.statItem}>
//                     <Text style={styles.statCount}>{stats.profileCompletion || 0}%</Text>
//                     <Text style={styles.statLabel}>Complete</Text>
//                   </View>
//                 </View>
//               )}
              
//               <View style={styles.profileActions}>
//                 <TouchableOpacity 
//                   style={[styles.profileBtn, styles.editBtn]}
//                   onPress={() => setEditModalVisible(true)}
//                 >
//                   <Text style={styles.profileBtnText}>Edit Profile</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity style={[styles.profileBtn, styles.shareBtn]}>
//                   <Text style={styles.profileBtnText}>Share Profile</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
            
//             <View style={styles.profileTabs}>
//               {['Posts', 'Reels', 'Tagged'].map((tab) => (
//                 <TouchableOpacity
//                   key={tab}
//                   style={[styles.profileTab, activeTab === tab && styles.profileTabActive]}
//                   onPress={() => setActiveTab(tab)}
//                 >
//                   <Text style={[styles.profileTabText, activeTab === tab && styles.profileTabTextActive]}>
//                     {tab}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
            
//             <FlatList
//               data={[]}
//               renderItem={renderPost}
//               keyExtractor={(item) => item.id}
//               numColumns={3}
//               style={styles.profileContent}
//               ListEmptyComponent={<EmptyComponent />}
//               scrollEnabled={false}
//             />
//           </ScrollView>
//         </View>
//       </LinearGradient>
      
//       {/* Menu Modal - FIXED POSITIONING */}
//       <Modal
//         visible={menuModalVisible}
//         animationType="slide"
//         transparent={true}
//         onRequestClose={() => setMenuModalVisible(false)}
//       >
//         <View style={styles.menuModalOverlay}>
//           <TouchableOpacity 
//             style={styles.menuModalBackdrop}
//             activeOpacity={1}
//             onPress={() => setMenuModalVisible(false)}
//           />
//           <View style={styles.menuModalContainer}>
//             <View style={styles.menuModalContent}>
//               <View style={styles.menuHeader}>
//                 <Text style={styles.menuTitle}>Options</Text>
//                 <TouchableOpacity 
//                   style={styles.menuCloseButton}
//                   onPress={() => setMenuModalVisible(false)}
//                 >
//                   <Icon name="close" size={24} color={theme.textPrimary} />
//                 </TouchableOpacity>
//               </View>
              
//               <ScrollView 
//                 style={styles.menuBody}
//                 showsVerticalScrollIndicator={false}
//                 contentContainerStyle={styles.menuBodyContent}
//               >
//                 {menuOptions.map((option) => (
//                   <TouchableOpacity
//                     key={option.id}
//                     style={[
//                       styles.menuOption,
//                       option.id === 'logout' && styles.menuOptionLogout
//                     ]}
//                     onPress={() => handleMenuOptionPress(option.id)}
//                   >
//                     <Icon 
//                       name={option.icon} 
//                       size={22} 
//                       color={option.color} 
//                       style={styles.menuOptionIcon} 
//                     />
//                     <Text style={[
//                       styles.menuOptionText,
//                       option.id === 'logout' && styles.logoutText
//                     ]}>
//                       {option.title}
//                     </Text>
//                   </TouchableOpacity>
//                 ))}
//               </ScrollView>
//             </View>
//           </View>
//         </View>
//       </Modal>
      
//       {/* Edit Profile Modal */}
//       <Modal
//         visible={editModalVisible}
//         animationType="slide"
//         transparent={true}
//         onRequestClose={() => setEditModalVisible(false)}
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Edit Profile</Text>
//               <TouchableOpacity onPress={() => setEditModalVisible(false)}>
//                 <Icon name="close" size={24} color={theme.textPrimary} />
//               </TouchableOpacity>
//             </View>
//             <ScrollView style={styles.modalBody}>
//               <View style={styles.formGroup}>
//                 <Text style={styles.label}>Name *</Text>
//                 <TextInput
//                   style={styles.input}
//                   value={formData.name}
//                   onChangeText={(text) => setFormData({...formData, name: text})}
//                   placeholder="Enter your name"
//                   placeholderTextColor={theme.textSecondary}
//                 />
//               </View>
//               <View style={styles.formGroup}>
//                 <Text style={styles.label}>Bio</Text>
//                 <TextInput
//                   style={[styles.input, styles.textArea]}
//                   value={formData.bio}
//                   onChangeText={(text) => setFormData({...formData, bio: text})}
//                   placeholder="Tell us about yourself"
//                   placeholderTextColor={theme.textSecondary}
//                   multiline
//                   numberOfLines={3}
//                 />
//               </View>
//               <View style={styles.formGroup}>
//                 <Text style={styles.label}>Location</Text>
//                 <TextInput
//                   style={styles.input}
//                   value={formData.location}
//                   onChangeText={(text) => setFormData({...formData, location: text})}
//                   placeholder="Where are you from?"
//                   placeholderTextColor={theme.textSecondary}
//                 />
//               </View>
//               <View style={styles.formGroup}>
//                 <Text style={styles.label}>Website</Text>
//                 <TextInput
//                   style={styles.input}
//                   value={formData.website}
//                   onChangeText={(text) => setFormData({...formData, website: text})}
//                   placeholder="Your website URL"
//                   placeholderTextColor={theme.textSecondary}
//                 />
//               </View>
//               <View style={styles.formGroup}>
//                 <Text style={styles.label}>Gender</Text>
//                 <TextInput
//                   style={styles.input}
//                   value={formData.gender}
//                   onChangeText={(text) => setFormData({...formData, gender: text})}
//                   placeholder="Your gender"
//                   placeholderTextColor={theme.textSecondary}
//                 />
//               </View>
//               <View style={styles.formGroup}>
//                 <Text style={styles.label}>Date of Birth</Text>
//                 <TextInput
//                   style={styles.input}
//                   value={formData.dateOfBirth}
//                   onChangeText={(text) => setFormData({...formData, dateOfBirth: text})}
//                   placeholder="YYYY-MM-DD"
//                   placeholderTextColor={theme.textSecondary}
//                 />
//               </View>
//             </ScrollView>
//             <View style={styles.modalFooter}>
//               <TouchableOpacity 
//                 style={[styles.modalButton, styles.cancelButton]}
//                 onPress={() => setEditModalVisible(false)}
//               >
//                 <Text style={styles.cancelButtonText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity 
//                 style={[styles.modalButton, styles.saveButton]}
//                 onPress={handleUpdateProfile}
//                 disabled={updating}
//               >
//                 {updating ? (
//                   <ActivityIndicator size="small" color={theme.textPrimary} />
//                 ) : (
//                   <Text style={styles.saveButtonText}>Save Changes</Text>
//                 )}
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
      
//       {/* Camera Modal */}
//       <Modal
//         visible={cameraModalVisible}
//         animationType="slide"
//         transparent={false}
//         onRequestClose={() => setCameraModalVisible(false)}
//       >
//         <View style={styles.cameraContainer}>
//           <StatusBar backgroundColor="#000" barStyle="light-content" />
          
//           {/* Camera Header */}
//           <View style={styles.cameraHeader}>
//             <TouchableOpacity 
//               style={styles.cameraCloseButton}
//               onPress={() => setCameraModalVisible(false)}
//             >
//               <Icon name="close" size={24} color="#fff" />
//             </TouchableOpacity>
//             <Text style={styles.cameraTitle}>Update Profile Picture</Text>
//             <View style={styles.cameraHeaderPlaceholder} />
//           </View>
          
//           {/* Camera View */}
//           {cameraInitialized && hasCameraPermission && device ? (
//             <Camera
//               ref={cameraRef}
//               style={styles.camera}
//               device={device}
//               isActive={cameraModalVisible}
//               photo={true}
//               resizeMode="cover"
//             />
//           ) : (
//             <View style={styles.cameraPlaceholder}>
//               <Text style={styles.cameraPlaceholderText}>
//                 {!hasCameraPermission ? 'Camera permission required' : 'Camera not available'}
//               </Text>
//             </View>
//           )}
          
//           {/* Camera Controls */}
//           <View style={styles.cameraControls}>
//             {/* Gallery Button - Left */}
//             <TouchableOpacity 
//               style={styles.cameraControlButton}
//               onPress={handleOpenGallery}
//             >
//               <Icon name="photo-library" size={28} color="#fff" />
//               <Text style={styles.cameraControlText}>Gallery</Text>
//             </TouchableOpacity>
            
//             {/* Capture Button - Center */}
//             <TouchableOpacity
//               style={[styles.captureButton, isTakingPhoto && styles.captureButtonDisabled]}
//               onPress={handleTakePhoto}
//               disabled={isTakingPhoto}
//             >
//               <View style={styles.captureInner} />
//             </TouchableOpacity>
            
//             {/* Flip Camera Button - Right */}
//             <TouchableOpacity 
//               style={styles.cameraControlButton}
//               onPress={handleFlipCamera}
//             >
//               <Icon name="flip-camera-ios" size={28} color="#fff" />
//               <Text style={styles.cameraControlText}>Flip</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({

//   profileUserId: {
//   fontSize: 14,
//   color: theme.accentColor,
//   marginBottom: 5,
//   fontWeight: '600',
//   fontFamily: 'Poppins',
// },

//   menuIcon: {
//     width: 38,
//     height: 38,
//     borderRadius: 19,
//     backgroundColor: 'rgba(255, 255, 255, 0.08)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   container: {
//     flex: 1,
//     backgroundColor: theme.background,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     color: theme.textPrimary,
//     marginTop: 10,
//     fontSize: 16,
//   },
//   containerInner: {
//     maxWidth: 480,
//     width: '100%',
//     flex: 1,
//     alignSelf: 'center',
//     paddingTop: StatusBar.currentHeight || 0,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 16,
//     paddingHorizontal: 20,
//     backgroundColor: 'rgba(18, 24, 38, 0.95)',
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(255, 255, 255, 0.08)',
//   },
//   logoContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   logo: {
//     fontSize: 22,
//     fontWeight: '700',
//     color: theme.textPrimary,
//     marginLeft: 8,
//   },
//   headerIcons: {
//     flexDirection: 'row',
//     gap: 16,
//   },
//   headerIcon: {
//     width: 38,
//     height: 38,
//     borderRadius: 19,
//     backgroundColor: 'rgba(255, 255, 255, 0.08)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   content: {
//     flex: 1,
//   },
//   profileHeader: {
//     alignItems: 'center',
//     marginBottom: 20,
//     backgroundColor: 'rgba(30, 40, 50, 0.7)',
//     borderRadius: 16,
//     padding: 20,
//     margin: 16,
//   },
//   profileAvatarContainer: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     borderWidth: 3,
//     borderColor: theme.accentColor,
//     marginBottom: 15,
//     overflow: 'hidden',
//     position: 'relative',
//   },
//   profileAvatarImage: {
//     width: '100%',
//     height: '100%',
//     resizeMode: 'cover',
//   },
//   editPhotoButton: {
//     position: 'absolute',
//     bottom: 5,
//     right: 5,
//     backgroundColor: 'rgba(0,0,0,0.7)',
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   profileName: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: theme.textPrimary,
//     marginBottom: 5,
//   },
//   profileBio: {
//     fontSize: 14,
//     color: theme.textSecondary,
//     marginBottom: 10,
//     textAlign: 'center',
//   },
//   profileDetail: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 5,
//   },
//   profileDetailText: {
//     fontSize: 12,
//     color: theme.textSecondary,
//     marginLeft: 5,
//   },
//   profileStats: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     gap: 30,
//     marginBottom: 20,
//     marginTop: 10,
//   },
//   statItem: {
//     alignItems: 'center',
//   },
//   statCount: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: theme.textPrimary,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: theme.textSecondary,
//   },
//   profileActions: {
//     flexDirection: 'row',
//     gap: 10,
//     justifyContent: 'center',
//   },
//   profileBtn: {
//     paddingVertical: 8,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//   },
//   editBtn: {
//     backgroundColor: theme.accentColor,
//   },
//   shareBtn: {
//     backgroundColor: 'transparent',
//     borderWidth: 1,
//     borderColor: theme.accentColor,
//   },
//   profileBtnText: {
//     color: theme.textPrimary,
//     fontWeight: '600',
//     fontSize: 14,
//   },
//   profileTabs: {
//     flexDirection: 'row',
//     backgroundColor: 'rgba(30, 40, 50, 0.7)',
//     borderRadius: 12,
//     padding: 4,
//     marginHorizontal: 16,
//     marginBottom: 16,
//   },
//   profileTab: {
//     flex: 1,
//     alignItems: 'center',
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   profileTabActive: {
//     backgroundColor: 'rgba(255, 0, 119, 0.15)',
//   },
//   profileTabText: {
//     fontWeight: '600',
//     fontSize: 14,
//     color: theme.textSecondary,
//   },
//   profileTabTextActive: {
//     color: theme.accentColor,
//   },
//   profileContent: {
//     backgroundColor: 'rgba(30, 40, 50, 0.7)',
//     borderRadius: 16,
//     padding: 4,
//     marginHorizontal: 16,
//     marginBottom: 16,
//   },
//   profilePost: {
//     flex: 1,
//     aspectRatio: 1,
//     margin: 4,
//     position: 'relative',
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   profilePostImage: {
//     width: '100%',
//     height: '100%',
//     resizeMode: 'cover',
//   },
//   reelInfo: {
//     position: 'absolute',
//     bottom: 5,
//     left: 5,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     paddingHorizontal: 5,
//     paddingVertical: 2,
//     borderRadius: 3,
//   },
//   reelViews: {
//     color: theme.textPrimary,
//     fontSize: 10,
//     marginLeft: 3,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//     marginTop: 50,
//   },
//   emptyText: {
//     color: theme.textSecondary,
//     textAlign: 'center',
//     fontSize: 16,
//     marginTop: 10,
//   },
//   // FIXED Menu Modal Styles
//   menuModalOverlay: {
//     flex: 1,
//     justifyContent: 'flex-end',
//   },
//   menuModalBackdrop: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//   },
//   menuModalContainer: {
//     backgroundColor: theme.background,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     top:20,
//     maxHeight: '70%', // Reduced height to avoid bottom navigation
//     marginBottom: Platform.OS === 'android' ? 20 : 0, // Extra margin for Android
//   },
//   menuModalContent: {
//     paddingBottom: Platform.OS === 'android' ? 30 : 20, // Extra padding for Android
//   },
//   menuHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(255,255,255,0.1)',
//   },
//   menuTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: theme.textPrimary,
//   },
//   menuCloseButton: {
//     padding: 4,
//   },
//   menuBody: {
//     maxHeight: 400, // Limit height
//   },
//   menuBodyContent: {
//     padding: 20,
//     paddingTop: 10,
//   },
//   menuOption: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(255,255,255,0.05)',
//   },
//   menuOptionLogout: {
//     marginTop: 10,
//     borderTopWidth: 1,
//     borderTopColor: 'rgba(255,255,255,0.1)',
//     borderBottomWidth: 0,
//   },
//   menuOptionIcon: {
//     marginRight: 15,
//     width: 24,
//   },
//   menuOptionText: {
//     fontSize: 16,
//     color: theme.textPrimary,
//     fontWeight: '500',
//   },
//   logoutText: {
//     color: '#FF4444',
//     fontWeight: '600',
//   },
//   // Edit Profile Modal Styles
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'flex-end',
//     backgroundColor: 'rgba(0,0,0,0.5)',
//   },
//   modalContent: {
//     backgroundColor: theme.background,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     maxHeight: '80%',
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(255,255,255,0.1)',
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: theme.textPrimary,
//   },
//   modalBody: {
//     padding: 20,
//   },
//   modalFooter: {
//     flexDirection: 'row',
//     padding: 20,
//     borderTopWidth: 1,
//     borderTopColor: 'rgba(255,255,255,0.1)',
//   },
//   formGroup: {
//     marginBottom: 16,
//   },
//   label: {
//     color: theme.textPrimary,
//     marginBottom: 8,
//     fontWeight: '600',
//   },
//   input: {
//     backgroundColor: 'rgba(255,255,255,0.1)',
//     borderRadius: 8,
//     padding: 12,
//     color: theme.textPrimary,
//     borderWidth: 1,
//     borderColor: 'rgba(255,255,255,0.2)',
//   },
//   textArea: {
//     height: 80,
//     textAlignVertical: 'top',
//   },
//   modalButton: {
//     flex: 1,
//     padding: 15,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginHorizontal: 5,
//   },
//   cancelButton: {
//     backgroundColor: 'rgba(255,255,255,0.1)',
//   },
//   saveButton: {
//     backgroundColor: theme.accentColor,
//   },
//   cancelButtonText: {
//     color: theme.textPrimary,
//     fontWeight: '600',
//   },
//   saveButtonText: {
//     color: theme.textPrimary,
//     fontWeight: '600',
//   },
//   // Camera Styles
//   cameraContainer: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   cameraHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     backgroundColor: '#000',
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(255,255,255,0.1)',
//   },
//   cameraCloseButton: {
//     padding: 8,
//   },
//   cameraTitle: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '600',
//   },
//   cameraHeaderPlaceholder: {
//     width: 40,
//   },
//   camera: {
//     flex: 1,
//     width: '100%',
//   },
//   cameraPlaceholder: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#000',
//   },
//   cameraPlaceholderText: {
//     color: '#fff',
//     fontSize: 16,
//     textAlign: 'center',
//   },
//   cameraControls: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     paddingHorizontal: 30,
//     paddingVertical: 30,
//     backgroundColor: '#000',
//   },
//   cameraControlButton: {
//     alignItems: 'center',
//     padding: 10,
//   },
//   cameraControlText: {
//     color: '#fff',
//     fontSize: 12,
//     marginTop: 5,
//   },
//   captureButton: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     borderWidth: 4,
//     borderColor: '#fff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'transparent',
//   },
//   captureButtonDisabled: {
//     opacity: 0.5,
//   },
//   captureInner: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: '#fff',
//   },
// });

// export default ProfileScreen;




