import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons'; // 统一使用MaterialIcons
import { theme } from '../styles/theme';

// Define gradient colors in your theme or here
const gradientColors = ['#0f2027', '#203a43', '#2c5364'];

// Static data for all tabs
const profileData = {
  name: 'Jessica Parker',
  bio: 'Content Creator | Travel Enthusiast | Dog Lover 🐶',
  avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
  stats: { posts: '245', followers: '12.5K', following: '1.2K' },
};

// Generate data for all tabs
const posts = Array(9).fill(0).map((_, index) => ({
  id: `post-${index + 1}`,
  image: `https://picsum.photos/200/200?post=${index}`,
}));

const reels = Array(6).fill(0).map((_, index) => ({
  id: `reel-${index + 1}`,
  image: `https://picsum.photos/200/200?reel=${index}`,
  views: `${Math.floor(Math.random() * 100) + 1}K`
}));

const tagged = Array(3).fill(0).map((_, index) => ({
  id: `tagged-${index + 1}`,
  image: `https://picsum.photos/200/200?tagged=${index}`,
}));

const ProfileScreen = () => {
  const [activeTab, setActiveTab] = useState('Posts');

  // Function to determine data based on active tab
  const getTabData = () => {
    switch (activeTab) {
      case 'Posts':
        return posts;
      case 'Reels':
        return reels;
      case 'Tagged':
        return tagged;
      default:
        return posts;
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />
      {/* Fixed LinearGradient with proper colors prop */}
      <LinearGradient 
        colors={gradientColors} 
        style={styles.container}
        start={{x: 0, y: 0}} 
        end={{x: 1, y: 1}}
      >
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

          <View style={styles.content}>
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatarContainer}>
                <Image source={{ uri: profileData.avatar }} style={styles.profileAvatarImage} />
              </View>
              <Text style={styles.profileName}>{profileData.name}</Text>
              <Text style={styles.profileBio}>{profileData.bio}</Text>
              <View style={styles.profileStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statCount}>{profileData.stats.posts}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statCount}>{profileData.stats.followers}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statCount}>{profileData.stats.following}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
              </View>
              <View style={styles.profileActions}>
                <TouchableOpacity style={[styles.profileBtn, styles.editBtn]}>
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
              data={getTabData()}
              renderItem={renderPost}
              keyExtractor={(item) => item.id}
              numColumns={3}
              style={styles.profileContent}
              ListEmptyComponent={<EmptyComponent />}
            />
          </View>
        </View>
      </LinearGradient>
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
    paddingTop: StatusBar.currentHeight || 0,  // 👈 Add this
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
 //   paddingTop: (StatusBar.currentHeight || 0) + 16, // <-- Add this
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
  content: {
    padding: 16,
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(30, 40, 50, 0.7)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  profileAvatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: theme.accentColor,
    marginBottom: 15,
    overflow: 'hidden',
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 5,
    fontFamily: 'Poppins',
  },
  profileBio: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statCount: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'Poppins',
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    fontFamily: 'Poppins',
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
    fontFamily: 'Poppins',
  },
  profileTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 40, 50, 0.7)',
    borderRadius: 12,
    padding: 4,
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
    fontFamily: 'Poppins',
  },
  profileTabTextActive: {
    color: theme.accentColor,
  },
  profileContent: {
    flex: 1,
    backgroundColor: 'rgba(30, 40, 50, 0.7)',
    borderRadius: 16,
    padding: 4,
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
});

export default ProfileScreen;