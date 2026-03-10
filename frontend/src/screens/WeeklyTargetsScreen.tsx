import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { colors, typography, spacing, screenPadding } from '../theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { weeklyTargetsAPI } from '../api/weeklyTargets';
import { WeeklyTarget } from '../types';

export const WeeklyTargetsScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [targets, setTargets] = useState<WeeklyTarget[]>([]);
  const [weekStart, setWeekStart] = useState('');
  const [weekEnd, setWeekEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTargetCount, setNewTargetCount] = useState('1');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCount, setEditCount] = useState('');

  const fetchTargets = useCallback(async () => {
    try {
      const data = await weeklyTargetsAPI.list();
      setTargets(data.targets);
      setWeekStart(data.week_start);
      setWeekEnd(data.week_end);
    } catch (error) {
      console.error('Error fetching weekly targets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTargets();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title) return;
    const count = Math.max(1, Math.min(999, parseInt(newTargetCount, 10) || 1));
    setSaving(true);
    try {
      await weeklyTargetsAPI.create({ title, target_count: count });
      setNewTitle('');
      setNewTargetCount('1');
      setShowForm(false);
      await fetchTargets();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to create target');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCount = async (t: WeeklyTarget, newVal: number) => {
    try {
      await weeklyTargetsAPI.update(t.id, { current_count: Math.max(0, newVal) });
      await fetchTargets();
      setEditingId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = (t: WeeklyTarget) => {
    Alert.alert(
      'Delete target',
      `Delete "${t.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await weeklyTargetsAPI.delete(t.id);
              await fetchTargets();
            } catch (e) {
              console.error(e);
            }
          },
        },
      ]
    );
  };

  const formatWeek = (start: string, end: string) => {
    if (!start || !end) return '';
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.main} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Weekly targets</Text>
          <Text style={styles.subtitle}>Set up to 5 goals for this week</Text>
          {weekStart && weekEnd && (
            <Text style={styles.weekLabel}>{formatWeek(weekStart, weekEnd)}</Text>
          )}
        </View>

        {targets.map((t) => (
          <View key={t.id} style={styles.targetCard}>
            <View style={styles.targetMain}>
              <Text style={styles.targetTitle}>{t.title}</Text>
              {editingId === t.id ? (
                <View style={styles.countRow}>
                  <TouchableOpacity
                    style={styles.countBtn}
                    onPress={() => handleUpdateCount(t, t.current_count - 1)}
                  >
                    <Text style={styles.countBtnText}>-</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.countInput}
                    value={editCount}
                    onChangeText={setEditCount}
                    keyboardType="number-pad"
                    maxLength={3}
                    onBlur={() => {
                      const v = parseInt(editCount, 10);
                      if (!isNaN(v) && v >= 0) handleUpdateCount(t, v);
                      setEditingId(null);
                    }}
                  />
                  <TouchableOpacity
                    style={styles.countBtn}
                    onPress={() => handleUpdateCount(t, t.current_count + 1)}
                  >
                    <Text style={styles.countBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.progressRow}
                  onPress={() => {
                    setEditingId(t.id);
                    setEditCount(String(t.current_count));
                  }}
                >
                  <Text style={styles.progressText}>
                    {t.current_count} / {t.target_count}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(t)}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        ))}

        {showForm ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>New target</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Train 3x, Read 30 min"
              placeholderTextColor={colors.primary.disabled}
              value={newTitle}
              onChangeText={setNewTitle}
              maxLength={200}
              autoFocus
            />
            <Text style={styles.label}>Target count</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              placeholderTextColor={colors.primary.disabled}
              value={newTargetCount}
              onChangeText={setNewTargetCount}
              keyboardType="number-pad"
              maxLength={3}
            />
            <View style={styles.formButtons}>
              <PrimaryButton title="Add" onPress={handleCreate} loading={saving} size="medium" />
              <PrimaryButton
                title="Cancel"
                onPress={() => { setShowForm(false); setNewTitle(''); setNewTargetCount('1'); }}
                variant="ghost"
                size="small"
                style={{ marginTop: spacing.sm }}
              />
            </View>
          </View>
        ) : (
          <PrimaryButton
            title="Add target"
            onPress={() => setShowForm(true)}
            variant="secondary"
            size="medium"
            style={{ marginTop: spacing.lg }}
            disabled={targets.length >= 5}
          />
        )}

        {targets.length === 0 && !showForm && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No targets for this week yet</Text>
            <Text style={styles.emptySub}>Add up to 5 goals to track</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingHorizontal: screenPadding.horizontal,
    paddingTop: spacing.huge,
    paddingBottom: spacing.massive,
  },
  header: {
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    color: colors.primary.main,
  },
  subtitle: {
    ...typography.body,
    color: colors.primary.muted,
    marginTop: spacing.xs,
  },
  weekLabel: {
    ...typography.caption,
    color: colors.primary.disabled,
    marginTop: spacing.sm,
  },
  targetCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  targetMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetTitle: {
    ...typography.label,
    color: colors.primary.main,
    fontSize: 16,
    flex: 1,
  },
  progressRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  progressText: {
    ...typography.label,
    color: colors.accent.main,
    fontWeight: '600',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  countBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary.main,
  },
  countInput: {
    width: 50,
    height: 40,
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.main,
  },
  deleteBtn: {
    marginTop: spacing.md,
    alignSelf: 'flex-end',
  },
  deleteBtnText: {
    ...typography.labelSmall,
    color: colors.error.main,
  },
  formCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.xl,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent.glow,
  },
  formTitle: {
    ...typography.h3,
    color: colors.primary.main,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.primary.main,
    marginBottom: spacing.md,
    minHeight: 48,
  },
  label: {
    ...typography.labelSmall,
    color: colors.primary.disabled,
    marginBottom: spacing.sm,
  },
  formButtons: {
    marginTop: spacing.md,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
  },
  emptyText: {
    ...typography.h3,
    color: colors.primary.muted,
  },
  emptySub: {
    ...typography.body,
    color: colors.primary.disabled,
    marginTop: spacing.sm,
  },
});
