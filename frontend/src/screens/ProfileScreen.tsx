import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, screenPadding, borderRadius } from '../theme';
import { useAuth } from '../hooks/useAuth';
import { checkinsAPI } from '../api/checkins';
import { usersAPI } from '../api/users';
import { goalsAPI } from '../api/goals';
import { StreakResponse, UserProfile, ProfileStackParamList, Goal } from '../types';

interface NavRowProps {
  icon: string;
  label: string;
  onPress: () => void;
}

const NavRow: React.FC<NavRowProps> = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.navRow} onPress={onPress} activeOpacity={0.6}>
    <View style={styles.navIconWrap}>
      <Text style={styles.navIcon}>{icon}</Text>
    </View>
    <Text style={styles.navLabel}>{label}</Text>
    <Text style={styles.navArrow}>{'\u203A'}</Text>
  </TouchableOpacity>
);

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { user, logout } = useAuth();
  const [streak, setStreak] = useState<StreakResponse | null>(null);
  const [profileStats, setProfileStats] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [streakData, statsData, goalsData] = await Promise.all([
        checkinsAPI.getStreak(),
        usersAPI.getMyStats(),
        goalsAPI.list().catch(() => ({ goals: [] })),
      ]);
      setStreak(streakData);
      setProfileStats(statsData);
      setGoals(goalsData.goals?.filter((g: Goal) => g.is_active) || []);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  };

  const successRate = Math.round((profileStats?.success_rate ?? 0) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.main} />}
      >
        {/* Avatar + Name */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{user?.username?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <Text style={styles.name}>{user?.username}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: 'rgba(108,99,255,0.12)' }]}>
            <Text style={[styles.statValue, { color: colors.accent.main }]}>{streak?.total_checkins ?? 0}</Text>
            <Text style={styles.statLabel}>Success</Text>
          </View>
          <View style={{ width: spacing.md }} />
          <View style={[styles.statBox, { backgroundColor: 'rgba(52,211,153,0.12)' }]}>
            <Text style={[styles.statValue, { color: colors.success.main }]}>{streak?.current_streak ?? 0}</Text>
            <Text style={styles.statLabel}>Day{'\n'}streak</Text>
          </View>
        </View>

        {/* Goals */}
        {goals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My goals</Text>
            <View style={styles.goalsCard}>
              {goals.slice(0, 4).map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={styles.goalRow}
                  onPress={() => navigation.navigate('Goals')}
                  activeOpacity={0.6}
                >
                  <View style={[styles.goalDot, { backgroundColor: g.color || colors.accent.main }]} />
                  <Text style={styles.goalText} numberOfLines={1}>{g.title}</Text>
                  <Text style={styles.navArrow}>{'\u203A'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Edit Profile */}
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('Settings')} activeOpacity={0.6}>
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Navigation */}
        <View style={styles.navSection}>
          <NavRow icon={'\u25A6'} label="Dashboard" onPress={() => navigation.navigate('Dashboard')} />
          <NavRow icon={'\u25C8'} label="Calendar" onPress={() => navigation.navigate('Calendar')} />
          <NavRow icon={'\u2261'} label="Weekly Review" onPress={() => navigation.navigate('WeeklySummary')} />
          <NavRow icon={'\u25CE'} label="Focus Areas" onPress={() => navigation.navigate('Goals')} />
          <NavRow icon={'\u2726'} label="Weekly Targets" onPress={() => navigation.navigate('WeeklyTargets')} />
          <NavRow icon={'\u2699'} label="Settings" onPress={() => navigation.navigate('Settings')} />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} activeOpacity={0.6}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  scroll: { paddingHorizontal: screenPadding.horizontal, paddingTop: spacing.xxl, paddingBottom: spacing.massive },

  profileHeader: { alignItems: 'center', marginBottom: spacing.xxl },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.accent.glow, borderWidth: 2.5,
    borderColor: colors.accent.main, alignItems: 'center',
    justifyContent: 'center', marginBottom: spacing.lg,
  },
  avatarLetter: { fontSize: 36, fontWeight: '700', color: colors.accent.main },
  name: { ...typography.h2, color: colors.primary.main },

  statsRow: { flexDirection: 'row', marginBottom: spacing.xxl },
  statBox: {
    flex: 1, borderRadius: borderRadius.lg, paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  statValue: { fontSize: 32, fontWeight: '800', marginBottom: 4 },
  statLabel: { ...typography.caption, color: colors.primary.muted, textAlign: 'center' },

  section: { marginBottom: spacing.xxl },
  sectionTitle: { ...typography.label, color: colors.primary.muted, marginBottom: spacing.md, fontSize: 14 },

  goalsCard: {
    backgroundColor: colors.background.secondary, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border.subtle, overflow: 'hidden',
  },
  goalRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg, borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  goalDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.md },
  goalText: { ...typography.body, color: colors.primary.main, flex: 1 },

  editBtn: {
    borderWidth: 1, borderColor: colors.border.light, borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg, alignItems: 'center', marginBottom: spacing.xxl,
  },
  editBtnText: { ...typography.label, color: colors.primary.muted, fontSize: 15 },

  navSection: {
    backgroundColor: colors.background.secondary, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border.subtle, overflow: 'hidden',
    marginBottom: spacing.xxl,
  },
  navRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg, borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  navIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: colors.background.elevated, alignItems: 'center',
    justifyContent: 'center', marginRight: spacing.lg,
  },
  navIcon: { fontSize: 16, color: colors.accent.main },
  navLabel: { ...typography.body, color: colors.primary.main, flex: 1, fontSize: 15 },
  navArrow: { fontSize: 22, color: colors.primary.disabled },

  logoutRow: {
    paddingVertical: spacing.lg, alignItems: 'center',
    borderRadius: borderRadius.lg, borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.2)',
  },
  logoutText: { ...typography.label, color: colors.error.main, fontSize: 15 },
});
