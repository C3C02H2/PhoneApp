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
import { colors, typography, spacing, screenPadding, borderRadius, shadows } from '../theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { goalsAPI } from '../api/goals';
import { Goal } from '../types';

const GOAL_COLORS = [
  '#8B5CF6', '#6C63FF', '#34D399', '#F87171',
  '#FBBF24', '#60A5FA', '#F472B6', '#A78BFA',
];

export const GoalsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColor, setNewColor] = useState(GOAL_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const fetchGoals = useCallback(async () => {
    try {
      const data = await goalsAPI.list(false);
      setGoals(data.goals);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGoals();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      await goalsAPI.create({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        color: newColor,
      });
      setNewTitle('');
      setNewDescription('');
      setNewColor(GOAL_COLORS[0]);
      setShowForm(false);
      await fetchGoals();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create goal');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (goal: Goal) => {
    try {
      await goalsAPI.update(goal.id, { is_active: !goal.is_active });
      await fetchGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const handleDelete = (goal: Goal) => {
    Alert.alert(
      'Delete goal',
      `Are you sure you want to delete "${goal.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await goalsAPI.delete(goal.id);
              await fetchGoals();
            } catch (error) {
              console.error('Error deleting goal:', error);
            }
          },
        },
      ]
    );
  };

  const activeGoals = goals.filter((g) => g.is_active);
  const inactiveGoals = goals.filter((g) => !g.is_active);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.main} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Focus Areas</Text>
          <Text style={styles.subtitle}>What are you trying to improve?</Text>
        </View>

        {activeGoals.length === 0 && !showForm && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No goals yet</Text>
            <Text style={styles.emptySubtitle}>
              Add focus areas to track what you're working on
            </Text>
          </View>
        )}

        {activeGoals.map((goal) => (
          <View key={goal.id} style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <View style={[styles.goalDot, { backgroundColor: goal.color }]} />
              <View style={styles.goalInfo}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                {goal.description && (
                  <Text style={styles.goalDescription}>{goal.description}</Text>
                )}
              </View>
            </View>
            <View style={styles.goalActions}>
              <TouchableOpacity onPress={() => handleToggleActive(goal)} style={styles.actionBtn}>
                <Text style={styles.actionText}>Archive</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(goal)} style={styles.actionBtn}>
                <Text style={[styles.actionText, { color: colors.error.main }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {inactiveGoals.length > 0 && (
          <View style={styles.archivedSection}>
            <Text style={styles.archivedLabel}>ARCHIVED</Text>
            {inactiveGoals.map((goal) => (
              <View key={goal.id} style={[styles.goalCard, styles.goalCardInactive]}>
                <View style={styles.goalHeader}>
                  <View style={[styles.goalDot, { backgroundColor: goal.color, opacity: 0.4 }]} />
                  <Text style={[styles.goalTitle, { color: colors.primary.disabled }]}>{goal.title}</Text>
                </View>
                <TouchableOpacity onPress={() => handleToggleActive(goal)} style={styles.actionBtn}>
                  <Text style={[styles.actionText, { color: colors.success.main }]}>Restore</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {showForm ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>New focus area</Text>
            <TextInput
              style={styles.input}
              placeholder="Title (e.g. Fitness, Study, Writing)"
              placeholderTextColor={colors.primary.disabled}
              value={newTitle}
              onChangeText={setNewTitle}
              maxLength={100}
              autoFocus
            />
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.primary.disabled}
              value={newDescription}
              onChangeText={setNewDescription}
              maxLength={500}
              multiline
            />
            <Text style={styles.colorLabel}>COLOR</Text>
            <View style={styles.colorRow}>
              {GOAL_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: c },
                    newColor === c && styles.colorSwatchSelected,
                  ]}
                  onPress={() => setNewColor(c)}
                />
              ))}
            </View>
            <View style={styles.formButtons}>
              <PrimaryButton title="Create" onPress={handleCreate} loading={saving} size="medium" />
              <PrimaryButton
                title="Cancel"
                onPress={() => { setShowForm(false); setNewTitle(''); setNewDescription(''); }}
                variant="ghost"
                size="small"
                style={{ marginTop: spacing.sm }}
              />
            </View>
          </View>
        ) : (
          <PrimaryButton
            title="Add focus area"
            onPress={() => setShowForm(true)}
            variant="secondary"
            size="medium"
            style={{ marginTop: spacing.lg }}
          />
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.primary.muted,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.primary.disabled,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  goalCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  goalCardInactive: {
    opacity: 0.6,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.md,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    ...typography.label,
    color: colors.primary.main,
    fontSize: 16,
  },
  goalDescription: {
    ...typography.body,
    color: colors.primary.muted,
    marginTop: spacing.xs,
  },
  goalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  actionBtn: {
    paddingVertical: spacing.xs,
  },
  actionText: {
    ...typography.labelSmall,
    color: colors.primary.disabled,
  },
  archivedSection: {
    marginTop: spacing.xxl,
  },
  archivedLabel: {
    ...typography.labelSmall,
    color: colors.primary.disabled,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  formCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
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
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.primary.main,
    marginBottom: spacing.md,
    minHeight: 48,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  colorLabel: {
    ...typography.labelSmall,
    color: colors.primary.disabled,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  colorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: colors.primary.main,
  },
  formButtons: {
    marginTop: spacing.md,
  },
});
