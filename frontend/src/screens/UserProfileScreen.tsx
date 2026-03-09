import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, screenPadding, borderRadius } from '../theme';
import { StatCard } from '../components/StatCard';
import { usersAPI } from '../api/users';
import { chatAPI } from '../api/chat';
import { UserProfile, FeedStackParamList } from '../types';
import { useAuth } from '../hooks/useAuth';

type UserProfileRouteProp = RouteProp<FeedStackParamList, 'UserProfile'>;

export const UserProfileScreen: React.FC = () => {
  const route = useRoute<UserProfileRouteProp>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { userId } = route.params;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [blockToggling, setBlockToggling] = useState(false);
  const [chatRequesting, setChatRequesting] = useState(false);
  const [myIsPrivate, setMyIsPrivate] = useState(false);
  const isOwnProfile = user?.id === userId;

  const fetchProfile = useCallback(async () => {
    try {
      const data = await usersAPI.getUserProfile(userId);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!isOwnProfile) {
      usersAPI.getSettings().then((s) => setMyIsPrivate(s.is_private)).catch(() => {});
    }
  }, [isOwnProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const handleToggleFollow = async () => {
    if (!profile || toggling) return;
    setToggling(true);
    try {
      const result = await usersAPI.toggleFollow(userId);
      setProfile({
        ...profile,
        is_following: result.following,
        followers_count: result.followers_count,
        following_count: result.following_count,
      });
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setToggling(false);
    }
  };

  const handleChatRequest = () => {
    if (chatRequesting) return;
    Alert.alert(
      'Chat Request',
      `How long do you want to chat with ${profile?.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '5 min', onPress: () => sendChatRequest(5) },
        { text: '15 min', onPress: () => sendChatRequest(15) },
        { text: '30 min', onPress: () => sendChatRequest(30) },
      ]
    );
  };

  const sendChatRequest = async (minutes: number) => {
    setChatRequesting(true);
    try {
      await chatAPI.sendRequest(userId, minutes);
      Alert.alert('Sent!', `Chat request sent to ${profile?.username} for ${minutes} minutes`);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to send request');
    } finally {
      setChatRequesting(false);
    }
  };

  const handleToggleBlock = () => {
    if (!profile || blockToggling || isOwnProfile) return;
    Alert.alert(
      profile.is_blocked ? 'Unblock' : 'Block',
      profile.is_blocked
        ? `Unblock ${profile.username}? They will be able to see your posts and profile again.`
        : `Block ${profile.username}? They won't be able to see your profile or posts.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: profile.is_blocked ? 'Unblock' : 'Block',
          style: profile.is_blocked ? 'default' : 'destructive',
          onPress: async () => {
            setBlockToggling(true);
            try {
              const result = await usersAPI.toggleBlock(userId);
              setProfile({ ...profile, is_blocked: result.blocked });
              if (result.blocked) {
                navigation.goBack();
              }
            } catch (error) {
              console.error('Error toggling block:', error);
            } finally {
              setBlockToggling(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.main} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent.main}
          />
        }
      >
        <View style={styles.profileContainer}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>
              {profile.username[0]?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.username}>{profile.username}</Text>
          <Text style={styles.joined}>
            Joined {formatDate(profile.created_at)}
          </Text>

          <View style={styles.followRow}>
            <View style={styles.followStat}>
              <Text style={styles.followCount}>{profile.followers_count}</Text>
              <Text style={styles.followLabel}>Followers</Text>
            </View>
            <View style={styles.followDivider} />
            <View style={styles.followStat}>
              <Text style={styles.followCount}>{profile.following_count}</Text>
              <Text style={styles.followLabel}>Following</Text>
            </View>
          </View>

          {!isOwnProfile && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.followButton, profile.is_following && styles.followButtonActive]}
                onPress={handleToggleFollow}
                disabled={toggling}
                activeOpacity={0.7}
              >
                {toggling ? (
                  <ActivityIndicator size="small" color={profile.is_following ? colors.accent.main : '#fff'} />
                ) : (
                  <Text style={[styles.followButtonText, profile.is_following && styles.followButtonTextActive]}>
                    {profile.is_following ? 'Unfollow' : 'Follow'}
                  </Text>
                )}
              </TouchableOpacity>
              {!profile.is_private && !myIsPrivate && (
                <TouchableOpacity
                  style={styles.chatButton}
                  onPress={handleChatRequest}
                  disabled={chatRequesting}
                  activeOpacity={0.7}
                >
                  {chatRequesting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.chatButtonText}>Chat</Text>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.blockButton, profile.is_blocked && styles.blockButtonActive]}
                onPress={handleToggleBlock}
                disabled={blockToggling}
                activeOpacity={0.7}
              >
                {blockToggling ? (
                  <ActivityIndicator size="small" color={profile.is_blocked ? colors.error.main : '#fff'} />
                ) : (
                  <Text style={[styles.blockButtonText, profile.is_blocked && styles.blockButtonTextActive]}>
                    {profile.is_blocked ? 'Unblock' : 'Block'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatCard
              title="Posts"
              value={profile.posts_count}
              subtitle="stories shared"
              accentColor={colors.warning.main}
            />
            <View style={{ width: spacing.md }} />
            <StatCard
              title="Likes"
              value={profile.total_likes_received}
              subtitle="received"
              accentColor={colors.error.main}
            />
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <View style={[
                styles.statusDot,
                { backgroundColor: profile.is_active ? colors.success.main : colors.primary.disabled },
              ]} />
              <Text style={[
                styles.statusText,
                { color: profile.is_active ? colors.success.main : colors.primary.disabled },
              ]}>
                {profile.is_active ? 'Active Tryer' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...typography.h3,
    color: colors.error.main,
  },
  scrollContent: {
    paddingHorizontal: screenPadding.horizontal,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.massive,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent.glow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.accent.main,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.accent.main,
  },
  username: {
    ...typography.h2,
    color: colors.primary.main,
    marginBottom: spacing.xs,
  },
  joined: {
    ...typography.caption,
    color: colors.primary.disabled,
  },
  followRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  followStat: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  followCount: {
    ...typography.h3,
    color: colors.primary.main,
  },
  followLabel: {
    ...typography.caption,
    color: colors.primary.disabled,
    marginTop: 2,
  },
  followDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border.subtle,
  },
  followButton: {
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent.main,
    minWidth: 140,
    alignItems: 'center',
  },
  followButtonActive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent.main,
  },
  followButtonText: {
    ...typography.label,
    color: '#fff',
    fontWeight: '600',
  },
  followButtonTextActive: {
    color: colors.accent.main,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  chatButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.accent.main,
    minWidth: 80,
    alignItems: 'center',
  },
  chatButtonText: {
    ...typography.label,
    color: colors.accent.main,
    fontWeight: '600',
  },
  blockButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error.main,
    minWidth: 100,
    alignItems: 'center',
  },
  blockButtonActive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.error.main,
  },
  blockButtonText: {
    ...typography.label,
    color: '#fff',
    fontWeight: '600',
  },
  blockButtonTextActive: {
    color: colors.error.main,
  },
  statsContainer: {
    marginBottom: spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row',
  },
  infoSection: {
    marginBottom: spacing.xxxl,
  },
  infoCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  infoLabel: {
    ...typography.label,
    color: colors.primary.muted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statusText: {
    ...typography.label,
  },
});
