import React, { useState, useEffect } from 'react';
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
  RefreshControl
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useUser } from './context/UserContext';
import UserService from './services/userService';
import { theme } from '../styles/theme';

const gradientColors = ['#0f2027', '#203a43', '#2c5364'];

const ProfileScreen = () => {
  const { user, userData, loading, token, updateUserProfile, uploadProfilePicture, refreshUserData } = useUser();
  const [activeTab, setActiveTab] = useState('Posts');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    website: '',
    gender: '',
    dateOfBirth: ''
  });

  // Load user stats
  useEffect(() => {
    if (token) {
      loadUserStats();
    }
  }, [token]);

  // Update form when user data changes
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
    }
  }, [user, userData]);

  const loadUserStats = async () => {
    try {
      const response = await UserService.getUserStats(token);
      if (response.success) {
        setStats(response);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUserData();
    await loadUserStats();
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
      } else {
        Alert.alert('Error', result.message || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleImageUpload = async (imageUrl) => {
    const result = await uploadProfilePicture(imageUrl);
    if (result.success) {
      Alert.alert('Success', 'Profile picture updated successfully');
    } else {
      Alert.alert('Error', result.message || 'Failed to update profile picture');
    }
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
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.headerIcon}>
                <Icon name="search" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIcon}>
                <Icon name="mail" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView 
            style={styles.content}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatarContainer}>
                <Image 
                  source={{ 
                    uri: user?.photoURL || userData?.profilePicture || 'https://randomuser.me/api/portraits/men/1.jpg' 
                  }} 
                  style={styles.profileAvatarImage} 
                />
                <TouchableOpacity 
                  style={styles.editPhotoButton}
                  onPress={() => handleImageUpload('https://randomuser.me/api/portraits/men/1.jpg')}
                >
                  <Icon name="camera-alt" size={16} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.profileName}>{user?.name || 'Unknown User'}</Text>
              <Text style={styles.profileBio}>{userData?.bio || 'No bio yet'}</Text>
              
              {userData?.location && (
                <View style={styles.profileDetail}>
                  <Icon name="location-on" size={14} color={theme.textSecondary} />
                  <Text style={styles.profileDetailText}>{userData.location}</Text>
                </View>
              )}

              {stats && (
                <View style={styles.profileStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statCount}>{stats.stats?.postsCount || 0}</Text>
                    <Text style={styles.statLabel}>Posts</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statCount}>{stats.stats?.followersCount || 0}</Text>
                    <Text style={styles.statLabel}>Followers</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statCount}>{stats.stats?.followingCount || 0}</Text>
                    <Text style={styles.statLabel}>Following</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statCount}>{stats.profileCompletion || 0}%</Text>
                    <Text style={styles.statLabel}>Complete</Text>
                  </View>
                </View>
              )}

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
              keyExtractor={(item) => item.id}
              numColumns={3}
              style={styles.profileContent}
              ListEmptyComponent={<EmptyComponent />}
              scrollEnabled={false}
            />
          </ScrollView>
        </View>
      </LinearGradient>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  // Modal Styles
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
});

export default ProfileScreen;