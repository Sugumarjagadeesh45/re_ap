import React from 'react';
import { View, Text, StyleSheet, StatusBar, Image, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons'; // 统一使用MaterialIcons
import { theme } from '../styles/theme';

const friends = [
  { id: '1', name: 'Sarah Miller', status: 'Active now', avatar: 'https://randomuser.me/api/portraits/women/33.jpg' },
  { id: '2', name: 'Mike Johnson', status: 'Active 5m ago', avatar: 'https://randomuser.me/api/portraits/men/45.jpg' },
  { id: '3', name: 'Emily Davis', status: 'Active 1h ago', avatar: 'https://randomuser.me/api/portraits/women/22.jpg' },
  { id: '4', name: 'James Wilson', status: 'Active 3h ago', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { id: '5', name: 'Olivia Brown', status: 'Active yesterday', avatar: 'https://randomuser.me/api/portraits/women/18.jpg' },
];

const addFriends = [
  { id: '6', name: 'Sophia Garcia', status: '15 mutual friends', avatar: 'https://randomuser.me/api/portraits/women/67.jpg' },
  { id: '7', name: 'William Taylor', status: '8 mutual friends', avatar: 'https://randomuser.me/api/portraits/men/55.jpg' },
];

const FriendsScreen = () => {
  const renderFriend = ({ item }) => (
    <View style={styles.friendItem}>
      <Image source={{ uri: item.avatar }} style={styles.friendAvatar} />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.friendStatus}>{item.status}</Text>
      </View>
      <TouchableOpacity style={styles.friendChatBtn}>
        <Text style={styles.friendChatBtnText}>{item.status.includes('mutual') ? 'Add' : 'Chat'}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />
      <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
        <View style={styles.containerInner}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Icon name="people" size={22} color={theme.accentColor} />
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
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitle}>
                  <Icon name="people" size={16} color={theme.accentColor} style={styles.sectionTitleIcon} />
                  <Text style={styles.sectionTitleText}>Friends</Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={friends}
                renderItem={renderFriend}
                keyExtractor={(item) => item.id}
                style={styles.friendsList}
              />
            </View>

            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitle}>
                  <Icon name="person-add" size={16} color={theme.accentColor} style={styles.sectionTitleIcon} />
                  <Text style={styles.sectionTitleText}>Add Friend</Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={addFriends}
                renderItem={renderFriend}
                keyExtractor={(item) => item.id}
                style={styles.friendsList}
              />
            </View>
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
  content: {
    padding: 16,
    flex: 1,
  },
  sectionContainer: {
    backgroundColor: 'rgba(30, 40, 50, 0.7)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
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
    color: theme.accentColor,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  friendsList: {
    marginBottom: 10,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontWeight: '600',
    fontSize: 16,
    color: theme.textPrimary,
    fontFamily: 'Poppins',
  },
  friendStatus: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 3,
    fontFamily: 'Poppins',
  },
  friendChatBtn: {
    backgroundColor: theme.accentColor,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  friendChatBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Poppins',
  },
});

export default FriendsScreen;