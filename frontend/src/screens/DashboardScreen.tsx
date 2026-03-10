import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, screenPadding } from '../theme';
import { StatCard } from '../components/StatCard';
import { statsAPI, DashboardData, Achievement } from '../api/stats';
import { EXCUSE_CATEGORIES } from '../types';

const getExcuseLabel = (cat: string) =>
  EXCUSE_CATEGORIES.find(e => e.id === cat)?.label || cat;

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [dash, ach] = await Promise.all([
        statsAPI.getDashboard(),
        statsAPI.getAchievements(),
      ]);
      setData(dash);
      setAchievements(ach.achievements);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={colors.accent.main} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  const unlocked = achievements.filter(a => a.unlocked);
  const locked = achievements.filter(a => !a.unlocked);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.main} />}
      >
        <Text style={styles.title}>Dashboard</Text>

        <View style={styles.statsRow}>
          <StatCard title="Streak" value={data?.current_streak ?? 0} subtitle="current" accentColor={colors.success.main} />
          <View style={{ width: spacing.md }} />
          <StatCard title="Best" value={data?.longest_streak ?? 0} subtitle="longest" accentColor={colors.warning.main} />
        </View>
        <View style={[styles.statsRow, { marginTop: spacing.md }]}>
          <StatCard title="Total" value={data?.total_checkins ?? 0} subtitle="yes days" accentColor={colors.accent.main} />
          <View style={{ width: spacing.md }} />
          <StatCard
            title="Rate"
            value={`${Math.round((data?.success_rate ?? 0) * 100)}%`}
            subtitle="success"
            accentColor={(data?.success_rate ?? 0) >= 0.7 ? colors.success.main : colors.error.main}
          />
        </View>

        {/* Consistency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consistency</Text>
          <View style={styles.consistencyRow}>
            <View style={styles.consistencyCard}>
              <Text style={styles.consistencyValue}>{data?.consistency_7d ?? 0}/7</Text>
              <Text style={styles.consistencyLabel}>Last 7 days</Text>
            </View>
            <View style={styles.consistencyCard}>
              <Text style={styles.consistencyValue}>{data?.consistency_30d ?? 0}/30</Text>
              <Text style={styles.consistencyLabel}>Last 30 days</Text>
            </View>
          </View>
        </View>

        {/* Top Excuses */}
        {(data?.top_excuses?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Excuses</Text>
            {data!.top_excuses.map((e, i) => (
              <View key={e.category} style={styles.excuseRow}>
                <Text style={styles.excuseRank}>{i + 1}.</Text>
                <Text style={styles.excuseText}>{getExcuseLabel(e.category)}</Text>
                <Text style={styles.excuseCount}>{e.count}x</Text>
              </View>
            ))}
          </View>
        )}

        {/* Mood Distribution */}
        {data?.mood_distribution && Object.keys(data.mood_distribution).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mood Patterns</Text>
            <View style={styles.moodRow}>
              {Object.entries(data.mood_distribution).map(([mood, count]) => (
                <View key={mood} style={styles.moodChip}>
                  <Text style={styles.moodLabel}>{mood}</Text>
                  <Text style={styles.moodCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements ({unlocked.length}/{achievements.length})</Text>
          {unlocked.map(a => (
            <View key={a.key} style={styles.achievementCard}>
              <View style={styles.achievementIcon}>
                <Text style={styles.achievementIconText}>{a.icon}</Text>
              </View>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>{a.title}</Text>
                <Text style={styles.achievementDesc}>{a.description}</Text>
              </View>
            </View>
          ))}
          {locked.map(a => (
            <View key={a.key} style={[styles.achievementCard, styles.achievementLocked]}>
              <View style={[styles.achievementIcon, styles.achievementIconLocked]}>
                <Text style={styles.achievementIconTextLocked}>?</Text>
              </View>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitleLocked}>{a.title}</Text>
                <Text style={styles.achievementDesc}>{a.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  scrollContent: { paddingHorizontal: screenPadding.horizontal, paddingTop: spacing.huge, paddingBottom: spacing.massive },
  title: { ...typography.h1, color: colors.primary.main, marginBottom: spacing.xxl },
  statsRow: { flexDirection: 'row' },
  section: { marginTop: spacing.xxxl },
  sectionTitle: { ...typography.h3, color: colors.primary.main, marginBottom: spacing.lg },
  consistencyRow: { flexDirection: 'row', gap: spacing.md },
  consistencyCard: {
    flex: 1, backgroundColor: colors.background.secondary, borderRadius: 16,
    padding: spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: colors.border.subtle,
  },
  consistencyValue: { ...typography.h2, color: colors.accent.main },
  consistencyLabel: { ...typography.caption, color: colors.primary.muted, marginTop: spacing.xs },
  excuseRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border.subtle,
  },
  excuseRank: { ...typography.label, color: colors.primary.disabled, width: 30 },
  excuseText: { ...typography.body, color: colors.primary.muted, flex: 1 },
  excuseCount: { ...typography.label, color: colors.error.main },
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  moodChip: {
    backgroundColor: colors.background.secondary, paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm, borderRadius: 9999, borderWidth: 1,
    borderColor: colors.border.subtle, flexDirection: 'row', gap: spacing.sm,
  },
  moodLabel: { ...typography.label, color: colors.primary.muted, textTransform: 'capitalize' },
  moodCount: { ...typography.label, color: colors.accent.main },
  achievementCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.secondary,
    borderRadius: 12, padding: spacing.lg, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  achievementLocked: { opacity: 0.5 },
  achievementIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent.glow,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.lg,
  },
  achievementIconLocked: { backgroundColor: colors.background.elevated },
  achievementIconText: { ...typography.label, color: colors.accent.main, fontSize: 16 },
  achievementIconTextLocked: { ...typography.label, color: colors.primary.disabled, fontSize: 16 },
  achievementInfo: { flex: 1 },
  achievementTitle: { ...typography.label, color: colors.primary.main, fontSize: 15 },
  achievementTitleLocked: { ...typography.label, color: colors.primary.disabled, fontSize: 15 },
  achievementDesc: { ...typography.caption, color: colors.primary.muted, marginTop: 2 },
});
