import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth } from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import API_URL from './utiliti/config';
import { theme } from '../styles/theme';
import { useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const route = useRoute();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('Following');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [gender, setGender] = useState('male');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false); // New state for alert modal
  const [alertMessage, setAlertMessage] = useState(''); // Message for alert
  const [alertType, setAlertType] = useState('error'); // Type: 'error' or 'success'
  const hasCheckedAuth = useRef(false);
  const hasShownNewUserModal = useRef(false);

  // Check for registration modal parameter
  useEffect(() => {
    if (route.params?.showRegistrationModal) {
      setShowRegistrationModal(true);
      navigation.setParams({ showRegistrationModal: undefined });
    }
  }, [route.params, navigation]);


  // Check authentication state and user profile
useEffect(() => {
  const checkAuthState = async () => {
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const token = await AsyncStorage.getItem('authToken');
      const userInfo = await AsyncStorage.getItem('userInfo');

      let parsedUserInfo = null;
      if (userInfo) {
        try {
          parsedUserInfo = JSON.parse(userInfo);
        } catch (e) {
          console.error('Error parsing userInfo:', e);
        }
      }

      // If we have a Firebase user, that's our primary auth source
      if (currentUser) {
        console.log('Firebase user found:', currentUser.email);
        
        // If we don't have a backend token, try to get one
        if (!token) {
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
              timeout: 10000,
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
              setUserProfile(data.user);
              setUser(parsedUserInfo || { email: currentUser.email });
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error('Error getting backend token from Firebase user:', error);
          }
        }
        
        // If we have a token, fetch user profile
        if (token) {
          try {
            const response = await fetch(`${API_URL}/api/auth/profile`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              timeout: 10000,
            });

            if (response.ok) {
              const userData = await response.json();
              setUserProfile(userData.user);
              setUser(parsedUserInfo || { email: currentUser.email });
              // Pre-fill fields if available
              if (userData.user.name) setName(userData.user.name);
              if (userData.user.dateOfBirth) setDateOfBirth(new Date(userData.user.dateOfBirth));
              if (userData.user.gender) setGender(userData.user.gender);
            } else if (response.status === 401) {
              await AsyncStorage.removeItem('authToken');
              await AsyncStorage.removeItem('userInfo');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
              return;
            }
          } catch (error) {
            console.error('Error checking user profile:', error);
          }
        }
        
        setUser(currentUser || parsedUserInfo || { email: 'Backend User' });
      } 
      // If we don't have a Firebase user but have a token, check token validity
      else if (token) {
        try {
          const response = await fetch(`${API_URL}/api/auth/profile`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            timeout: 10000,
          });

          if (response.ok) {
            const userData = await response.json();
            setUserProfile(userData.user);
            setUser(parsedUserInfo || { email: userData.user.email });
            // Pre-fill fields if available
            if (userData.user.name) setName(userData.user.name);
            if (userData.user.dateOfBirth) setDateOfBirth(new Date(userData.user.dateOfBirth));
            if (userData.user.gender) setGender(userData.user.gender);
          } else if (response.status === 401) {
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('userInfo');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
            return;
          }
        } catch (error) {
          console.error('Error checking token validity:', error);
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('userInfo');
        }
      }
      // If we have neither, navigate to login
      else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } finally {
      setLoading(false);
    }
  };

  checkAuthState();
}, [navigation]);

  // Show modal for new users
  useEffect(() => {
    if (
      userProfile &&
      !userProfile.registrationComplete &&
      !hasShownNewUserModal.current
    ) {
      hasShownNewUserModal.current = true;
      setShowRegistrationModal(true);
    }
  }, [userProfile]);

  const handleProfileUpdate = async () => {
    if (!name.trim()) {
      setAlertType('error');
      setAlertMessage('Please enter your name');
      setShowAlertModal(true); // LINE MENTION: Replace Alert with custom modal
      return;
    }
    if (!dateOfBirth) {
      setAlertType('error');
      setAlertMessage('Please select your date of birth');
      setShowAlertModal(true); // LINE MENTION: Replace Alert with custom modal
      return;
    }

    setModalLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const formattedDateOfBirth = dateOfBirth.toISOString().split('T')[0];

      const response = await fetch(`${API_URL}/api/auth/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          dateOfBirth: formattedDateOfBirth,
          gender,
        }),
        timeout: 10000,
      });

      const data = await response.json();
      if (response.ok) {
        if (data.token) {
          await AsyncStorage.setItem('authToken', data.token);
        }
        setUserProfile({
          ...userProfile,
          name,
          dateOfBirth: formattedDateOfBirth,
          gender,
          registrationComplete: true,
        });
        setShowRegistrationModal(false);
        setAlertType('success');
        setAlertMessage('Profile updated successfully!');
        setShowAlertModal(true); // LINE MENTION: Replace Alert with custom modal
      } else {
        setAlertType('error');
        setAlertMessage(data.message || 'Failed to update profile');
        setShowAlertModal(true); // LINE MENTION: Replace Alert with custom modal
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setAlertType('error');
      setAlertMessage('Network error: Please check your connection and try again.');
      setShowAlertModal(true); // LINE MENTION: Replace Alert with custom modal
    } finally {
      setModalLoading(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || dateOfBirth;
    setShowDatePicker(Platform.OS === 'ios');
    setDateOfBirth(currentDate);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const closeAlertModal = () => {
    setShowAlertModal(false);
  };

  const tabs = ['Following', 'Friends', 'Follower', 'For You', 'Templates'];
  const stories = [
    { id: '1', username: 'Your Story', avatar: 'https://randomuser.me/api/portraits/women/32.jpg' },
    { id: '2', username: '@keirasugan', avatar: 'https://randomuser.me/api/portraits/men/22.jpg' },
    { id: '3', username: '@malarlithun', avatar: 'https://randomuser.me/api/portraits/women/65.jpg' },
    { id: '4', username: '@radhekrishna', avatar: 'https://randomuser.me/api/portraits/men/42.jpg' },
    { id: '5', username: '@doctorsango', avatar: 'https://randomuser.me/api/portraits/women/57.jpg' },
  ];

  const spotlightItems = [
    { id: '1', name: 'Sango 💬️', stats: ['2.4K', '140', '293'] },
    { id: '2', name: 'Husband 💤️', stats: ['1.5K', '85', '210'] },
    { id: '3', name: 'Ayoo semma', stats: ['22.9K', '1.2K', '3.5K'] },
  ];

  const reels = [
    {
      id: '1',
      username: '@keirasugan',
      avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
      music: 'Dang Dang - Manam Kothi Paravai',
      description: 'Husband sleeping 😴️ #Funny #DailyLife',
      hashtags: '#Comedy #CoupleGoals #Sleeping',
      actions: { likes: '498', comments: '125', shares: '58' },
      image: 'https://picsum.photos/400/600',
    },
    {
      id: '2',
      username: '@malarlithun',
      avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
      music: 'Original Sound - by 11699245201',
      description: 'Ayoo semma 💬 💬 💬',
      hashtags: '#Pacholay #Pathikidichi #TaubaTauba',
      actions: { likes: '22.9K', comments: '1.2K', shares: '3.5K' },
      image: 'https://picsum.photos/400/600?2',
    },
  ];

  const renderStory = ({ item }) => (
    <View style={styles.story}>
      <TouchableOpacity style={styles.storyAvatar}>
        <LinearGradient
          colors={['#8a2be2', '#ff0084', '#33001b']}
          style={styles.storyAvatarGradient}
        >
          <Image source={{ uri: item.avatar }} style={styles.storyAvatarImage} />
        </LinearGradient>
        {item.id === '1' && (
          <View style={styles.addStoryIcon}>
            <Icon name="add" size={12} color={theme.textPrimary} />
          </View>
        )}
      </TouchableOpacity>
      <Text style={styles.storyUsername} numberOfLines={1}>
        {item.username}
      </Text>
    </View>
  );

  const renderSpotlight = ({ item }) => (
    <TouchableOpacity style={styles.spotlightItem}>
      <Image source={{ uri: 'https://picsum.photos/200/200' }} style={styles.spotlightImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
        style={styles.spotlightGradient}
      />
      <View style={styles.spotlightInfo}>
        <Text style={styles.spotlightName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.spotlightStats}>
          <View style={styles.statItem}>
            <Icon name="visibility" size={14} color={theme.textPrimary} />
            <Text style={styles.spotlightStat}>{item.stats[0]}</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="favorite" size={14} color={theme.textPrimary} />
            <Text style={styles.spotlightStat}>{item.stats[1]}</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="share" size={14} color={theme.textPrimary} />
            <Text style={styles.spotlightStat}>{item.stats[2]}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderReel = ({ item }) => (
    <View style={styles.reelCard}>
      <View style={styles.reelHeader}>
        <View style={styles.userContainer}>
          <Image source={{ uri: item.avatar }} style={styles.reelAvatar} />
          <View style={styles.reelUserInfo}>
            <Text style={styles.reelUsername}>{item.username}</Text>
            <View style={styles.reelMusic}>
              <Icon name="music-note" size={14} color={theme.textSecondary} style={styles.reelMusicIcon} />
              <Text style={styles.reelMusicText}>{item.music}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.reelFollow}>
          <Text style={styles.reelFollowText}>Follow</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.reelVideo}>
        <Image source={{ uri: item.image }} style={styles.reelVideoImage} />
        <View style={styles.reelActions}>
          <TouchableOpacity style={styles.reelAction}>
            <View style={styles.actionIconBg}>
              <Icon name="favorite" size={22} color={theme.textPrimary} />
            </View>
            <Text style={styles.reelActionCount}>{item.actions.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reelAction}>
            <View style={styles.actionIconBg}>
              <Icon name="chat" size={22} color={theme.textPrimary} />
            </View>
            <Text style={styles.reelActionCount}>{item.actions.comments}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reelAction}>
            <View style={styles.actionIconBg}>
              <Icon name="share" size={22} color={theme.textPrimary} />
            </View>
            <Text style={styles.reelActionCount}>{item.actions.shares}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.reelContent}>
          <Text style={styles.reelDescription}>{item.description}</Text>
          <Text style={styles.reelHashtags}>{item.hashtags}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />
        <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.accentColor} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />
      <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
        <View style={styles.containerInner}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Icon name="home" size={22} color={theme.accentColor} />
              <Text style={styles.logo}>REELS2CHAT</Text>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.headerIcon}>
                <Icon name="search" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIcon}>
                <Icon name="mail" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.navTabs}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.navTabsContent}
            >
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.navTab, activeTab === tab && styles.navTabActive]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.navTabText, activeTab === tab && styles.navTabTextActive]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitle}>
                  <Icon name="circle" size={16} color={theme.accentColor} style={styles.sectionTitleIcon} />
                  <Text style={styles.sectionTitleText}>Stories</Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                horizontal
                data={stories}
                renderItem={renderStory}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storySectionContent}
              />
            </View>

            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitle}>
                  <Icon name="star" size={16} color={theme.accentColor} style={styles.sectionTitleIcon} />
                  <Text style={styles.sectionTitleText}>Spotlight</Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                horizontal
                data={spotlightItems}
                renderItem={renderSpotlight}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.spotlightGridContent}
              />
            </View>

            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitle}>
                  <Icon name="play-arrow" size={16} color={theme.accentColor} style={styles.sectionTitleIcon} />
                  <Text style={styles.sectionTitleText}>Trending Reels</Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={reels}
                renderItem={renderReel}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>
          </ScrollView>
        </View>
      </LinearGradient>

      {/* Registration Modal for New Users */}
      {showRegistrationModal && userProfile && !userProfile.registrationComplete && (
        <Modal
          visible={showRegistrationModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            if (!modalLoading) setShowRegistrationModal(false);
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Complete Your Profile</Text>
              <Text style={styles.modalMessage}>
                Please complete your profile. Because you're a new customer.
              </Text>

              <View style={styles.inputContainer}>
                <Icon name="person" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  placeholderTextColor={theme.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  spellCheck={false}
                  autoComplete="off"
                  textContentType="none"
                />
              </View>

           

<View style={styles.inputContainer}>
  <Icon name="badge" size={20} color={theme.textSecondary} style={styles.inputIcon} />
  <TextInput
    style={[styles.input, { color: theme.textSecondary }]}
    placeholder="User ID"
    placeholderTextColor={theme.textSecondary}
    value={userProfile?.userId || ''}
    editable={false}
  />
</View>

              <TouchableOpacity
                style={styles.datePickerContainer}
                onPress={() => setShowDatePicker(true)}
              >
                <Icon name="event" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <Text style={styles.datePickerText}>{formatDate(dateOfBirth)}</Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={dateOfBirth}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}

              <View style={styles.genderContainer}>
                <Text style={styles.genderLabel}>Gender:</Text>
                <View style={styles.genderOptions}>
                  <TouchableOpacity
                    style={[styles.genderOption, gender === 'male' && styles.genderSelected]}
                    onPress={() => setGender('male')}
                  >
                    <Text style={styles.genderText}>Male</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.genderOption, gender === 'female' && styles.genderSelected]}
                    onPress={() => setGender('female')}
                  >
                    <Text style={styles.genderText}>Female</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.genderOption, gender === 'other' && styles.genderSelected]}
                    onPress={() => setGender('other')}
                  >
                    <Text style={styles.genderText}>Other</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.modalButton, modalLoading && styles.disabledButton]}
                onPress={handleProfileUpdate}
                disabled={modalLoading}
              >
                {modalLoading ? (
                  <ActivityIndicator size="small" color={theme.textPrimary} />
                ) : (
                  <Text style={styles.modalButtonText}>Complete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Custom Alert Modal */}
      {showAlertModal && (
        <Modal
          visible={showAlertModal}
          transparent={true}
          animationType="fade"
          onRequestClose={closeAlertModal}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.alertModalContent, alertType === 'success' ? styles.successAlert : styles.errorAlert]}>
              <Text style={styles.alertMessageText}>{alertMessage}</Text>
              <TouchableOpacity style={styles.alertButton} onPress={closeAlertModal}>
                <Text style={styles.alertButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  containerInner: {
    maxWidth: 480,
    width: '100%',
    flex: 1,
    alignSelf: 'center',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Poppins',
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
  navTabs: {
    backgroundColor: 'rgba(18, 24, 38, 0.95)',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  navTabsContent: {
    paddingHorizontal: 20,
  },
  navTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  navTabActive: {
    borderBottomWidth: 3,
    borderBottomColor: theme.accentColor,
  },
  navTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'Poppins',
  },
  navTabTextActive: {
    color: theme.accentColor,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  sectionContainer: {
    backgroundColor: 'rgba(30, 40, 50, 0.7)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitleIcon: {
    marginRight: 8,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'Poppins',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.accentColor,
    fontFamily: 'Poppins',
  },
  storySectionContent: {
    paddingRight: 16,
  },
  story: {
    alignItems: 'center',
    marginRight: 16,
    width: 82,
  },
  storyAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
    position: 'relative',
  },
  storyAvatarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    borderWidth: 2,
    borderColor: theme.accentColor,
  },
  addStoryIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.accentColor,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.headerBg,
  },
  storyUsername: {
    fontSize: 13,
    color: theme.textPrimary,
    textAlign: 'center',
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  spotlightGridContent: {
    paddingRight: 12,
  },
  spotlightItem: {
    width: width / 3 - 24,
    aspectRatio: 0.8,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
    backgroundColor: '#222',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  spotlightImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  spotlightGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  spotlightInfo: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  spotlightName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'Poppins',
    marginBottom: 8,
  },
  spotlightStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spotlightStat: {
    fontSize: 11,
    color: theme.textPrimary,
    fontFamily: 'Poppins',
    fontWeight: '600',
    marginLeft: 4,
  },
  reelCard: {
    backgroundColor: 'rgba(30, 40, 50, 0.7)',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  reelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reelAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  reelUserInfo: {
    flex: 1,
  },
  reelUsername: {
    fontWeight: '700',
    fontSize: 16,
    color: theme.textPrimary,
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  reelMusic: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reelMusicIcon: {
    marginRight: 6,
  },
  reelMusicText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontFamily: 'Poppins',
  },
  reelFollow: {
    backgroundColor: theme.accentColor,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  reelFollowText: {
    color: theme.textPrimary,
    fontWeight: '600',
    fontSize: 13,
    fontFamily: 'Poppins',
  },
  reelVideo: {
    height: width <= 480 ? 420 : 520,
    position: 'relative',
  },
  reelVideoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 12,
  },
  reelActions: {
    position: 'absolute',
    right: 16,
    bottom: 110,
    alignItems: 'center',
    gap: 24,
  },
  reelAction: {
    alignItems: 'center',
  },
  actionIconBg: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  reelActionCount: {
    fontSize: 13,
    color: theme.textPrimary,
    marginTop: 6,
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  reelContent: {
    position: 'absolute',
    left: 16,
    bottom: 32,
    maxWidth: '70%',
  },
  reelDescription: {
    fontSize: 15,
    color: theme.textPrimary,
    marginBottom: 8,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  reelHashtags: {
    fontSize: 14,
    color: theme.accentColor,
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: theme.textSecondary,
    fontSize: 16,
    fontFamily: 'Poppins',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#252020ce',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 8,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  datePickerText: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  genderContainer: {
    width: '100%',
    marginBottom: 20,
  },
  genderLabel: {
    fontSize: 16,
    color: theme.textPrimary,
    marginBottom: 10,
  },
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 5,
    alignItems: 'center',
  },
  genderSelected: {
    backgroundColor: theme.accentColor,
  },
  genderText: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  modalButton: {
    backgroundColor: theme.accentColor,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  alertModalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successAlert: {
    backgroundColor: '#28a745', // Green for success
  },
  errorAlert: {
    backgroundColor: '#dc3545', // Red for error
  },
  alertMessageText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'Poppins',
  },
  alertButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  alertButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
});

export default HomeScreen;