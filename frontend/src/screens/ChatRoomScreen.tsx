import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { colors, spacing, screenPadding } from '../theme';
import { useAuth } from '../hooks/useAuth';
import { chatAPI, ChatMessageData } from '../api/chat';
import { API_BASE_URL } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ChatRoomScreen: React.FC<{ route?: any; navigation?: any }> = ({ route, navigation }) => {
  const { user } = useAuth();
  const sessionId = route?.params?.sessionId;
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [otherUsername, setOtherUsername] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      const msgs = await chatAPI.getMessages(sessionId);
      setMessages(msgs);
    } catch (e: any) {
      if (e?.response?.status === 400) {
        setExpired(true);
      }
    }
  }, [sessionId]);

  const loadSessionInfo = useCallback(async () => {
    try {
      const data = await chatAPI.getChats();
      const sess = data.sessions.find(s => s.id === sessionId);
      if (sess) {
        setExpiresAt(new Date(sess.expires_at));
        const other = sess.user1_id === user?.id ? sess.user2_username : sess.user1_username;
        setOtherUsername(other);
      }
    } catch (e) {
      console.error(e);
    }
  }, [sessionId, user]);

  useEffect(() => {
    loadSessionInfo();
    loadMessages();
  }, [loadSessionInfo, loadMessages]);

  useEffect(() => {
    const connectWs = async () => {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) return;

      const wsUrl = API_BASE_URL.replace('http', 'ws') + `/chat/ws/${sessionId}?token=${token}`;
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'message') {
            setMessages(prev => [...prev, data as ChatMessageData]);
          }
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      ws.onerror = () => {};
      ws.onclose = () => {};

      wsRef.current = ws;
    };

    connectWs();

    return () => {
      wsRef.current?.close();
    };
  }, [sessionId]);

  useEffect(() => {
    if (!expiresAt) return;
    const timer = setInterval(() => {
      const diff = expiresAt.getTime() - Date.now();
      if (diff <= 0) {
        setExpired(true);
        setTimeLeft('0:00');
        clearInterval(timer);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const handleSend = async () => {
    if (!text.trim() || sending || expired) return;
    const content = text.trim();
    setText('');
    setSending(true);
    try {
      const msg = await chatAPI.sendMessage(sessionId, content);
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    } catch (e: any) {
      if (e?.response?.status === 400) {
        setExpired(true);
        Alert.alert('Chat Expired', 'This chat session has ended.');
      } else {
        Alert.alert('Error', 'Failed to send message');
        setText(content);
      }
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (expired) {
      navigation?.setOptions?.({ headerTitle: `${otherUsername} (Ended)` });
    } else if (otherUsername) {
      navigation?.setOptions?.({ headerTitle: `${otherUsername} - ${timeLeft}` });
    }
  }, [otherUsername, timeLeft, expired]);

  const renderMessage = ({ item }: { item: ChatMessageData }) => {
    const isMe = item.sender_id === user?.id;
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
        <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}>
          <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>{item.content}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        {expired && (
          <View style={styles.expiredBanner}>
            <Text style={styles.expiredText}>Chat has ended. Messages have been deleted.</Text>
          </View>
        )}

        {!expired && timeLeft && (
          <View style={styles.timerBar}>
            <Text style={styles.timerText}>{timeLeft} remaining</Text>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>Say hello!</Text>
            </View>
          }
        />

        {!expired && (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={colors.primary.disabled}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!text.trim() || sending}
              activeOpacity={0.7}
            >
              <Text style={styles.sendBtnText}>↑</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },

  timerBar: {
    paddingVertical: 8, alignItems: 'center',
    backgroundColor: colors.accent.main + '15', borderBottomWidth: 1, borderColor: colors.border.subtle,
  },
  timerText: { fontSize: 13, fontWeight: '700', color: colors.accent.main },

  expiredBanner: {
    paddingVertical: 12, alignItems: 'center',
    backgroundColor: colors.error.main + '15', borderBottomWidth: 1, borderColor: colors.error.main + '30',
  },
  expiredText: { fontSize: 13, fontWeight: '600', color: colors.error.main },

  messagesList: { paddingHorizontal: screenPadding.horizontal, paddingVertical: spacing.md, flexGrow: 1 },

  msgRow: { marginBottom: spacing.sm },
  msgRowRight: { alignItems: 'flex-end' },
  msgRowLeft: { alignItems: 'flex-start' },
  msgBubble: { maxWidth: '80%', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18 },
  msgBubbleMe: { backgroundColor: colors.accent.main, borderBottomRightRadius: 4 },
  msgBubbleOther: { backgroundColor: colors.background.secondary, borderWidth: 1, borderColor: colors.border.subtle, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, lineHeight: 20 },
  msgTextMe: { color: '#fff' },
  msgTextOther: { color: colors.primary.main },

  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyChatText: { fontSize: 16, color: colors.primary.disabled },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: screenPadding.horizontal, paddingVertical: spacing.sm,
    backgroundColor: colors.background.secondary, borderTopWidth: 1, borderColor: colors.border.subtle,
  },
  input: {
    flex: 1, minHeight: 40, maxHeight: 100, paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: colors.background.elevated, borderRadius: 20,
    fontSize: 15, color: colors.primary.main, borderWidth: 1, borderColor: colors.border.subtle,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent.main,
    alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { fontSize: 20, color: '#fff', fontWeight: '700', marginTop: -2 },
});
