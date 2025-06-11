import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  IconButton,
  Avatar,
  Text,
  useTheme,
} from 'react-native-paper';
import {useRoute} from '@react-navigation/native';
import {useSelector, useDispatch} from 'react-redux';

import {sendMessage, fetchMessages} from '@store/slices/chatSlice';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);
  const {modalId} = useRoute().params;
  const dispatch = useDispatch();
  const theme = useTheme();

  const messages = useSelector(state => state.chat.messages[modalId] || []);
  const currentUser = useSelector(state => state.auth.user);

  const loadMessages = useCallback(async () => {
    try {
      await dispatch(fetchMessages(modalId)).unwrap();
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [dispatch, modalId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const trimmedMessage = message.trim();
    setMessage('');

    try {
      await dispatch(
        sendMessage({
          modalId,
          message: trimmedMessage,
        }),
      ).unwrap();

      // Scroll to bottom after sending message
      flatListRef.current?.scrollToEnd();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = ({item}) => {
    const isOwnMessage = item.senderId === currentUser.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}>
        {!isOwnMessage && (
          <Avatar.Image
            size={32}
            source={{uri: item.senderAvatar}}
            style={styles.avatar}
          />
        )}
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
            {backgroundColor: isOwnMessage ? theme.colors.primary : '#f0f0f0'},
          ]}>
          <Text
            style={[
              styles.messageText,
              {color: isOwnMessage ? '#fff' : '#000'},
            ]}>
            {item.message}
          </Text>
          <Text
            style={[
              styles.timestamp,
              {color: isOwnMessage ? 'rgba(255,255,255,0.7)' : '#666'},
            ]}>
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        refreshing={loading}
        onRefresh={loadMessages}
      />

      <View style={styles.inputContainer}>
        <TextInput
          mode="outlined"
          placeholder="Type a message..."
          value={message}
          onChangeText={setMessage}
          style={styles.input}
          multiline
        />
        <IconButton
          icon="send"
          size={24}
          onPress={handleSend}
          disabled={!message.trim()}
          style={styles.sendButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  avatar: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
  },
  ownBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    alignSelf: 'flex-end',
    marginBottom: 6,
  },
});

export default Chat;
