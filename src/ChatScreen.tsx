import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Image,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons'; // 统一使用MaterialIcons
import { theme } from '../styles/theme';

const chats = [
  {
    id: '1',
    name: 'Alex Johnson',
    preview: "Hey there! How's it going?",
    time: '10:30 AM',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80',
    unread: true,
    online: true,
  },
  {
    id: '2',
    name: 'Sarah Miller',
    preview: 'Did you see my latest reel?',
    time: 'Yesterday',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80',
    unread: false,
    online: false,
  },
  {
    id: '3',
    name: 'Mike Wilson',
    preview: "Let's catch up soon!",
    time: 'Wednesday',
    avatar: 'https://images.unsplash.com/photo-1539571696357-56869e3c914e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80',
    unread: false,
    online: false,
  },
  {
    id: '4',
    name: 'AI Assistant',
    preview: 'How can I help you today?',
    time: 'Monday',
    avatar: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80',
    unread: false,
    online: true,
  },
];

const ChatScreen = ({ navigation }) => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (selectedChat) {
      // Load messages for the selected chat
      loadMessages();
    }
  }, [selectedChat]);

  const loadMessages = () => {
    setIsLoading(true);
    // Simulate API call to load messages
    setTimeout(() => {
      setMessages([
        { id: '1', text: "Hey there! How's it going?", time: '10:28 AM', type: 'received' },
        { id: '2', text: 'Pretty good! Just finished editing my latest reel.', time: '10:29 AM', type: 'sent' },
        { id: '3', text: 'Nice! I saw it - the transitions were amazing!', time: '10:30 AM', type: 'received' },
        { id: '4', text: 'Thanks! I used that new template we talked about.', time: '10:31 AM', type: 'sent' },
        { id: '5', text: 'Really? I need to try it out. Any tips?', time: '10:32 AM', type: 'received' },
      ]);
      setIsLoading(false);
    }, 1000);
  };

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;

    const newMsg = {
      id: Date.now().toString(),
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'sent',
    };

    setMessages([...messages, newMsg]);
    setNewMessage('');
    
    // Scroll to bottom after sending a message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.chatItem} 
      onPress={() => setSelectedChat(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.chatAvatar} />
        {item.online && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatNameContainer}>
          <Text style={styles.chatName}>{item.name}</Text>
          {item.unread && <View style={styles.unreadIndicator} />}
        </View>
        <Text style={styles.chatPreview} numberOfLines={1}>{item.preview}</Text>
      </View>
      <Text style={styles.chatTime}>{item.time}</Text>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }) => (
    <View style={[styles.messageContainer, item.type === 'sent' ? styles.messageSent : styles.messageReceived]}>
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.messageTime}>{item.time}</Text>
    </View>
  );

  if (selectedChat) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />
        <KeyboardAvoidingView 
          style={styles.container} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setSelectedChat(null)} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: selectedChat.avatar }} style={styles.chatAvatar} />
              <View style={styles.onlineIndicator} />
            </View>
            <View style={styles.chatUserInfo}>
              <Text style={styles.chatName}>{selectedChat.name}</Text>
              <Text style={styles.chatStatus}>Online now</Text>
            </View>
            <TouchableOpacity style={styles.moreButton}>
              <Icon name="more-vert" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.accentColor} />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              style={styles.chatMessages}
              contentContainerStyle={styles.messagesContainer}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
          )}
          
          <View style={styles.messageInputContainer}>
            <TouchableOpacity style={styles.attachButton}>
              <Icon name="attach-file" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              placeholderTextColor={theme.textSecondary}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity 
              style={[styles.sendButton, !newMessage.trim() && styles.disabledButton]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Icon name="send" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
              <Icon name="chat" size={22} color={theme.accentColor} />
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
                  <Icon name="chat" size={16} color={theme.accentColor} style={styles.sectionTitleIcon} />
                  <Text style={styles.sectionTitleText}>Recent Chats</Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={chats}
                renderItem={renderChatItem}
                keyExtractor={(item) => item.id}
                style={styles.chatList}
                showsVerticalScrollIndicator={false}
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
    flex: 1,
    padding: 16,
  },
  sectionContainer: {
    backgroundColor: 'rgba(30, 40, 50, 0.7)',
    borderRadius: 16,
    padding: 16,
    flex: 1,
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
  chatList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.success,
    borderWidth: 2,
    borderColor: theme.headerBg,
  },
  chatInfo: {
    flex: 1,
  },
  chatNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatName: {
    fontWeight: '600',
    fontSize: 16,
    color: theme.textPrimary,
    fontFamily: 'Poppins',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.accentColor,
    marginLeft: 8,
  },
  chatPreview: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 3,
    maxWidth: 200,
    fontFamily: 'Poppins',
  },
  chatTime: {
    fontSize: 12,
    color: theme.textSecondary,
    fontFamily: 'Poppins',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(18, 24, 38, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    marginRight: 15,
  },
  chatUserInfo: {
    flex: 1,
  },
  chatStatus: {
    fontSize: 12,
    color: theme.textSecondary,
    fontFamily: 'Poppins',
  },
  moreButton: {
    padding: 5,
  },
  messagesContainer: {
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  chatMessages: {
    flex: 1,
    backgroundColor: 'rgba(15, 25, 35, 0.9)',
  },
  messageContainer: {
    maxWidth: '70%',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 15,
    marginBottom: 10,
  },
  messageReceived: {
    backgroundColor: 'rgba(30, 40, 50, 0.7)',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
  },
  messageSent: {
    backgroundColor: theme.accentColor,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  messageText: {
    fontSize: 16,
    color: theme.textPrimary,
    fontFamily: 'Poppins',
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    color: theme.textSecondary,
    textAlign: 'right',
    marginTop: 5,
    fontFamily: 'Poppins',
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 15,
    backgroundColor: 'rgba(18, 24, 38, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  attachButton: {
    padding: 10,
    marginRight: 10,
  },
  messageInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: theme.textPrimary,
    fontFamily: 'Poppins',
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: theme.accentColor,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  disabledButton: {
    opacity: 0.5,
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
});

export default ChatScreen;