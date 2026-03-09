import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors, spacing, screenPadding } from '../theme';
import { useAuth } from '../hooks/useAuth';
import { chatAPI, ChatRequestData, ChatSessionData } from '../api/chat';

export const ChatListScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ChatRequestData[]>([]);
  const [sessions, setSessions] = useState<ChatSessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await chatAPI.getChats();
      setRequests(data.requests);
      setSessions(data.sessions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  const handleAccept = async (req: ChatRequestData) => {
    try {
      const result = await chatAPI.respondToRequest(req.id, 'accept');
      if (result.id) {
        navigation?.navigate('ChatRoom', { sessionId: result.id });
      }
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to accept');
    }
  };

  const handleDecline = async (req: ChatRequestData) => {
    Alert.alert('Decline', `Decline chat from ${req.sender_username}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: async () => {
          try {
            await chatAPI.respondToRequest(req.id, 'decline');
            load();
          } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.detail || 'Failed');
          }
        },
      },
    ]);
  };

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const incomingRequests = requests.filter(r => r.receiver_id === user?.id);
  const sentRequests = requests.filter(r => r.sender_id === user?.id);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={colors.accent.main} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={[]}
        renderItem={null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent.main} />}
        contentContainerStyle={styles.scroll}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Chat</Text>

            {incomingRequests.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>INCOMING REQUESTS</Text>
                {incomingRequests.map(req => (
                  <View key={req.id} style={styles.requestCard}>
                    <View style={styles.requestAvatar}>
                      <Text style={styles.requestAvatarText}>{req.sender_username[0]?.toUpperCase()}</Text>
                    </View>
                    <View style={styles.requestInfo}>
                      <Text style={styles.requestName}>{req.sender_username}</Text>
                      <Text style={styles.requestDuration}>{req.duration_minutes} min chat</Text>
                    </View>
                    <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(req)} activeOpacity={0.7}>
                      <Text style={styles.acceptBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.declineBtn} onPress={() => handleDecline(req)} activeOpacity={0.7}>
                      <Text style={styles.declineBtnText}>X</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}

            {sentRequests.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>SENT REQUESTS</Text>
                {sentRequests.map(req => (
                  <View key={req.id} style={styles.requestCard}>
                    <View style={styles.requestAvatar}>
                      <Text style={styles.requestAvatarText}>{req.receiver_username[0]?.toUpperCase()}</Text>
                    </View>
                    <View style={styles.requestInfo}>
                      <Text style={styles.requestName}>{req.receiver_username}</Text>
                      <Text style={styles.requestDuration}>Waiting... ({req.duration_minutes} min)</Text>
                    </View>
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingText}>Pending</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {sessions.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>ACTIVE CHATS</Text>
                {sessions.map(sess => {
                  const otherUser = sess.user1_id === user?.id ? sess.user2_username : sess.user1_username;
                  return (
                    <TouchableOpacity
                      key={sess.id}
                      style={styles.sessionCard}
                      onPress={() => navigation?.navigate('ChatRoom', { sessionId: sess.id })}
                      activeOpacity={0.7}
                    >
                      <View style={styles.sessionAvatar}>
                        <Text style={styles.sessionAvatarText}>{otherUser[0]?.toUpperCase()}</Text>
                      </View>
                      <View style={styles.sessionInfo}>
                        <Text style={styles.sessionName}>{otherUser}</Text>
                        <Text style={styles.sessionTimer}>{getTimeRemaining(sess.expires_at)} remaining</Text>
                      </View>
                      <Text style={styles.sessionArrow}>{'\u203A'}</Text>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {incomingRequests.length === 0 && sentRequests.length === 0 && sessions.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyTitle}>No active chats</Text>
                <Text style={styles.emptySubtitle}>Search for someone and send a chat request!</Text>
              </View>
            )}
          </>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  scroll: { paddingHorizontal: screenPadding.horizontal, paddingTop: spacing.xxl, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: '700', color: colors.primary.main, marginBottom: spacing.lg },

  sectionLabel: {
    fontSize: 11, fontWeight: '600', color: colors.primary.disabled, letterSpacing: 1.5,
    marginTop: spacing.xl, marginBottom: spacing.sm, marginLeft: spacing.xs,
  },

  requestCard: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    backgroundColor: colors.background.secondary, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border.subtle, marginBottom: spacing.sm,
  },
  requestAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.background.elevated,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  requestAvatarText: { fontSize: 18, fontWeight: '700', color: colors.accent.main },
  requestInfo: { flex: 1 },
  requestName: { fontSize: 15, fontWeight: '600', color: colors.primary.main },
  requestDuration: { fontSize: 12, color: colors.primary.disabled, marginTop: 2 },
  acceptBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
    backgroundColor: colors.accent.main, marginRight: spacing.sm,
  },
  acceptBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  declineBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.background.elevated, alignItems: 'center', justifyContent: 'center',
  },
  declineBtnText: { fontSize: 14, fontWeight: '700', color: colors.error.main },
  pendingBadge: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: colors.background.elevated,
  },
  pendingText: { fontSize: 12, fontWeight: '600', color: colors.primary.disabled },

  sessionCard: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    backgroundColor: colors.background.secondary, borderRadius: 16,
    borderWidth: 1, borderColor: colors.accent.main + '40', marginBottom: spacing.sm,
  },
  sessionAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent.main + '20',
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  sessionAvatarText: { fontSize: 18, fontWeight: '700', color: colors.accent.main },
  sessionInfo: { flex: 1 },
  sessionName: { fontSize: 15, fontWeight: '600', color: colors.primary.main },
  sessionTimer: { fontSize: 12, color: colors.accent.main, marginTop: 2, fontWeight: '500' },
  sessionArrow: { fontSize: 24, color: colors.primary.disabled },

  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 56, marginBottom: spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.primary.main, marginBottom: spacing.xs },
  emptySubtitle: { fontSize: 14, color: colors.primary.disabled, textAlign: 'center' },
});
