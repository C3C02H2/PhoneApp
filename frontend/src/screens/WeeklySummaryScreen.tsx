import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing, screenPadding } from '../theme';
import { weeklyAPI, WeeklySummary } from '../api/weekly';
import { EXCUSE_CATEGORIES } from '../types';

const getExcuseLabel = (cat: string) =>
  EXCUSE_CATEGORIES.find(e => e.id === cat)?.label || cat;

export const WeeklySummaryScreen: React.FC = () => {
  const [data, setData] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const result = await weeklyAPI.getSummary();
      setData(result);
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

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyText}>No data available.</Text>
      </SafeAreaView>
    );
  }

  const total = data.yes_days + data.no_days + data.missed_days;
  const yesPercent = total > 0 ? Math.round((data.yes_days / 7) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.main} />}
      >
        <Text style={styles.title}>Weekly Review</Text>
        <Text style={styles.subtitle}>{data.week_start} — {data.week_end}</Text>

        {/* Insight */}
        <View style={styles.insightCard}>
          <Text style={styles.insightText}>{data.insight}</Text>
        </View>

        {/* Week bar */}
        <View style={styles.weekBar}>
          {Array.from({ length: 7 }).map((_, i) => {
            let bgColor = colors.background.elevated;
            if (i < data.yes_days) bgColor = colors.success.main;
            else if (i < data.yes_days + data.no_days) bgColor = colors.error.main;
            return <View key={i} style={[styles.weekDot, { backgroundColor: bgColor }]} />;
          })}
        </View>
        <View style={styles.weekLabels}>
          <Text style={styles.weekLabel}>{data.yes_days} Yes</Text>
          <Text style={styles.weekLabel}>{data.no_days} No</Text>
          <Text style={styles.weekLabel}>{data.missed_days} Missed</Text>
        </View>

        {/* Big percent */}
        <View style={styles.percentCard}>
          <Text style={styles.percentValue}>{yesPercent}%</Text>
          <Text style={styles.percentLabel}>of the week you tried</Text>
        </View>

        {/* Streak */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data.current_streak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data.longest_streak}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>
        </View>

        {/* Top excuses */}
        {data.top_excuses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What held you back</Text>
            {data.top_excuses.map((e, i) => (
              <View key={e.category} style={styles.excuseRow}>
                <Text style={styles.excuseText}>{getExcuseLabel(e.category)}</Text>
                <Text style={styles.excuseCount}>{e.count}x</Text>
              </View>
            ))}
          </View>
        )}

        {/* Mood trends */}
        {Object.keys(data.mood_trends).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mood this week</Text>
            <View style={styles.moodRow}>
              {Object.entries(data.mood_trends).map(([mood, count]) => (
                <View key={mood} style={styles.moodChip}>
                  <Text style={styles.moodLabel}>{mood}</Text>
                  <Text style={styles.moodCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  scrollContent: { paddingHorizontal: screenPadding.horizontal, paddingTop: spacing.huge, paddingBottom: spacing.massive },
  title: { ...typography.h1, color: colors.primary.main },
  subtitle: { ...typography.caption, color: colors.primary.disabled, marginBottom: spacing.xxl },
  emptyText: { ...typography.body, color: colors.primary.muted, textAlign: 'center', marginTop: 100 },
  insightCard: {
    backgroundColor: colors.background.secondary, borderRadius: 16,
    padding: spacing.xl, borderLeftWidth: 4, borderLeftColor: colors.accent.main, marginBottom: spacing.xxl,
  },
  insightText: { ...typography.body, color: colors.primary.main, fontStyle: 'italic', lineHeight: 22 },
  weekBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  weekDot: { flex: 1, height: 28, borderRadius: 8, marginHorizontal: 2 },
  weekLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xxl },
  weekLabel: { ...typography.caption, color: colors.primary.muted },
  percentCard: {
    alignItems: 'center', backgroundColor: colors.background.secondary, borderRadius: 16,
    padding: spacing.xxl, marginBottom: spacing.xxl, borderWidth: 1, borderColor: colors.border.subtle,
  },
  percentValue: { fontSize: 56, fontWeight: '800', color: colors.accent.main },
  percentLabel: { ...typography.body, color: colors.primary.muted, marginTop: spacing.xs },
  statsRow: {
    flexDirection: 'row', backgroundColor: colors.background.secondary, borderRadius: 16,
    padding: spacing.xl, marginBottom: spacing.xxl, borderWidth: 1, borderColor: colors.border.subtle,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.border.subtle },
  statValue: { ...typography.h2, color: colors.primary.main },
  statLabel: { ...typography.caption, color: colors.primary.muted, marginTop: spacing.xs },
  section: { marginBottom: spacing.xxl },
  sectionTitle: { ...typography.h3, color: colors.primary.main, marginBottom: spacing.lg },
  excuseRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border.subtle,
  },
  excuseText: { ...typography.body, color: colors.primary.muted },
  excuseCount: { ...typography.label, color: colors.error.main },
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  moodChip: {
    backgroundColor: colors.background.secondary, paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm, borderRadius: 9999, borderWidth: 1,
    borderColor: colors.border.subtle, flexDirection: 'row', gap: spacing.sm,
  },
  moodLabel: { ...typography.label, color: colors.primary.muted, textTransform: 'capitalize' },
  moodCount: { ...typography.label, color: colors.accent.main },
});
