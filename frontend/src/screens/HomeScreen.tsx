import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ScrollView,
  Animated,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, screenPadding, shadows } from '../theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatCard } from '../components/StatCard';
import { checkinsAPI } from '../api/checkins';
import { goalsAPI } from '../api/goals';
import { weeklyTargetsAPI } from '../api/weeklyTargets';
import { useAuth } from '../hooks/useAuth';
import {
  StreakResponse,
  Goal,
  CreateCheckinContext,
  CreateExcuse,
  EXCUSE_CATEGORIES,
  MOOD_OPTIONS,
  DURATION_OPTIONS,
  WeeklyTarget,
} from '../types';

const YES_MESSAGES = [
  "You showed up. That's what matters.",
  "Another day of trying. Keep going.",
  "Consistency beats intensity.",
  "You chose effort over comfort.",
  "One more day in the books.",
  "The streak grows. So do you.",
];

const NO_MESSAGES = [
  "Tomorrow is not guaranteed. But you can try.",
  "Honesty is the first step.",
  "You didn't try. Now what?",
  "A missed day is a lesson, not a verdict.",
  "Acknowledge it. Move forward.",
];

const getRandomMessage = (messages: string[]) =>
  messages[Math.floor(Math.random() * messages.length)];

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakResponse | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [weeklyTargets, setWeeklyTargets] = useState<WeeklyTarget[]>([]);
  const [weeklyRangeLabel, setWeeklyRangeLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [showYesModal, setShowYesModal] = useState(false);
  const [showNoModal, setShowNoModal] = useState(false);
  const [showMessage, setShowMessage] = useState('');
  const messageAnim = React.useRef(new Animated.Value(0)).current;

  // Yes form state
  const [selectedGoal, setSelectedGoal] = useState<string | undefined>();
  const [whatITried, setWhatITried] = useState('');
  const [duration, setDuration] = useState<number | undefined>();
  const [note, setNote] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [mood, setMood] = useState<string | undefined>();
  const [energy, setEnergy] = useState<number | undefined>();

  // No form state
  const [excuseCategory, setExcuseCategory] = useState('');
  const [excuseDetail, setExcuseDetail] = useState('');

  const navigation = useNavigation<any>();

  const formatWeekRange = (start?: string, end?: string) => {
    if (!start || !end) return '';
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${e.toLocaleDateString(
      'en-US',
      { month: 'short', day: 'numeric', year: 'numeric' },
    )}`;
  };

  const fetchData = useCallback(async () => {
    try {
      const [streakData, goalsData, weeklyData] = await Promise.all([
        checkinsAPI.getStreak(),
        goalsAPI.list(),
        weeklyTargetsAPI.list(),
      ]);
      setStreak(streakData);
      setGoals(goalsData.goals);
      setWeeklyTargets(weeklyData.targets);
      setWeeklyRangeLabel(formatWeekRange(weeklyData.week_start, weeklyData.week_end));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const resetForms = () => {
    setSelectedGoal(undefined);
    setWhatITried('');
    setDuration(undefined);
    setNote('');
    setNextStep('');
    setMood(undefined);
    setEnergy(undefined);
    setExcuseCategory('');
    setExcuseDetail('');
  };

  const animateMessage = (msg: string) => {
    setShowMessage(msg);
    Animated.sequence([
      Animated.timing(messageAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(messageAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowMessage(''));
  };

  const handleYesPress = () => setShowYesModal(true);
  const handleNoPress = () => setShowNoModal(true);

  const submitYes = async () => {
    setChecking(true);
    try {
      const context: CreateCheckinContext = {};
      if (selectedGoal) context.goal_id = selectedGoal;
      if (whatITried.trim()) context.what_i_tried = whatITried.trim();
      if (duration) context.duration_minutes = duration;
      if (note.trim()) context.note = note.trim();
      if (nextStep.trim()) context.next_step = nextStep.trim();
      if (mood) context.mood = mood;
      if (energy) context.energy = energy;

      const hasContext = Object.keys(context).length > 0;
      await checkinsAPI.create({
        answer: true,
        context: hasContext ? context : undefined,
      });
      await fetchData();
      setShowYesModal(false);
      resetForms();
      animateMessage(getRandomMessage(YES_MESSAGES));
    } catch (error) {
      console.error('Error creating checkin:', error);
    } finally {
      setChecking(false);
    }
  };

  const submitNo = async () => {
    setChecking(true);
    try {
      const excuse: CreateExcuse | undefined = excuseCategory
        ? { category: excuseCategory, detail: excuseDetail.trim() || undefined }
        : undefined;

      await checkinsAPI.create({ answer: false, excuse });
      await fetchData();
      setShowNoModal(false);
      resetForms();
      animateMessage(getRandomMessage(NO_MESSAGES));
    } catch (error) {
      console.error('Error creating checkin:', error);
    } finally {
      setChecking(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.main} />
        }
      >
        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.question}>Did you try today?</Text>
          <Text style={styles.greetingSubtext}>{getGreeting()}, {user?.username || 'Tryer'}</Text>
        </View>

        {/* Buttons or checked-in badge */}
        {streak?.checked_in_today ? (
          <View style={styles.checkedInContainer}>
            <Text style={styles.checkedInText}>You've checked in today</Text>
          </View>
        ) : (
          <View style={styles.buttonCol}>
            <TouchableOpacity style={styles.yesBtn} onPress={handleYesPress} activeOpacity={0.8}>
              <Text style={styles.yesBtnText}>Yes, I tried</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.noBtn} onPress={handleNoPress} activeOpacity={0.8}>
              <Text style={styles.noBtnText}>Not yet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.noteBtn} onPress={handleYesPress} activeOpacity={0.6}>
              <Text style={styles.noteBtnText}>Add a note  {'\u203A'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {showMessage !== '' && (
          <Animated.View style={[styles.messageContainer, { opacity: messageAnim }]}>
            <Text style={styles.messageText}>{showMessage}</Text>
          </Animated.View>
        )}

        {/* Weekly targets preview */}
        <View style={styles.weeklySection}>
          <View style={styles.weeklyHeaderRow}>
            <Text style={styles.weeklyTitle}>This week&apos;s targets</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('ProfileTab', { screen: 'WeeklyTargets' })}
              activeOpacity={0.7}
            >
              <Text style={styles.weeklyLinkText}>Set weekly targets {'\u203A'}</Text>
            </TouchableOpacity>
          </View>
          {weeklyRangeLabel ? <Text style={styles.weeklySubtitle}>{weeklyRangeLabel}</Text> : null}

          {weeklyTargets.length === 0 ? (
            <Text style={styles.weeklyEmptyText}>No targets yet. Set up to 5 goals for this week.</Text>
          ) : (
            <View style={styles.weeklyList}>
              {weeklyTargets.slice(0, 3).map((t) => (
                <View key={t.id} style={styles.weeklyItem}>
                  <Text style={styles.weeklyItemTitle} numberOfLines={1}>
                    {t.title}
                  </Text>
                  <Text style={styles.weeklyItemProgress}>
                    {t.current_count} / {t.target_count}
                  </Text>
                </View>
              ))}
              {weeklyTargets.length > 3 && (
                <Text style={styles.weeklyMoreText}>
                  + {weeklyTargets.length - 3} more in Weekly Targets
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Quote */}
        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>
            "Small progress is still progress."
          </Text>
        </View>
      </ScrollView>

      {/* YES MODAL */}
      <Modal visible={showYesModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>What did you try?</Text>
              <Text style={styles.modalSubtitle}>Optional details about your effort</Text>

              {goals.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>GOAL</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chipRow}>
                      {goals.map((g) => (
                        <TouchableOpacity
                          key={g.id}
                          style={[
                            styles.chip,
                            selectedGoal === g.id && { backgroundColor: g.color + '30', borderColor: g.color },
                          ]}
                          onPress={() => setSelectedGoal(selectedGoal === g.id ? undefined : g.id)}
                        >
                          <View style={[styles.chipDot, { backgroundColor: g.color }]} />
                          <Text style={[styles.chipText, selectedGoal === g.id && { color: colors.primary.main }]}>
                            {g.title}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>WHAT I TRIED</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Briefly, what did you do?"
                  placeholderTextColor={colors.primary.disabled}
                  value={whatITried}
                  onChangeText={setWhatITried}
                  maxLength={500}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>HOW LONG</Text>
                <View style={styles.chipRow}>
                  {DURATION_OPTIONS.map((d) => (
                    <TouchableOpacity
                      key={d.minutes}
                      style={[styles.chip, duration === d.minutes && styles.chipSelected]}
                      onPress={() => setDuration(duration === d.minutes ? undefined : d.minutes)}
                    >
                      <Text style={[styles.chipText, duration === d.minutes && { color: colors.primary.main }]}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>MOOD</Text>
                <View style={styles.chipRow}>
                  {MOOD_OPTIONS.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.chip, mood === m.id && styles.chipSelected]}
                      onPress={() => setMood(mood === m.id ? undefined : m.id)}
                    >
                      <Text style={[styles.chipText, mood === m.id && { color: colors.primary.main }]}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>ENERGY (1-5)</Text>
                <View style={styles.chipRow}>
                  {[1, 2, 3, 4, 5].map((e) => (
                    <TouchableOpacity
                      key={e}
                      style={[styles.chip, styles.chipSmall, energy === e && styles.chipSelected]}
                      onPress={() => setEnergy(energy === e ? undefined : e)}
                    >
                      <Text style={[styles.chipText, energy === e && { color: colors.primary.main }]}>
                        {e}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>NOTE</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Anything on your mind..."
                  placeholderTextColor={colors.primary.disabled}
                  value={note}
                  onChangeText={setNote}
                  multiline
                  maxLength={2000}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>NEXT SMALL STEP</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="What will you do tomorrow?"
                  placeholderTextColor={colors.primary.disabled}
                  value={nextStep}
                  onChangeText={setNextStep}
                  maxLength={500}
                />
              </View>

              <View style={styles.modalButtons}>
                <PrimaryButton
                  title="Save check-in"
                  onPress={submitYes}
                  variant="success"
                  loading={checking}
                />
                <PrimaryButton
                  title="Skip details"
                  onPress={() => {
                    resetForms();
                    submitYes();
                  }}
                  variant="ghost"
                  size="medium"
                  style={{ marginTop: spacing.sm }}
                />
                <PrimaryButton
                  title="Cancel"
                  onPress={() => { setShowYesModal(false); resetForms(); }}
                  variant="ghost"
                  size="small"
                  style={{ marginTop: spacing.xs }}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* NO MODAL */}
      <Modal visible={showNoModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Why not?</Text>
            <Text style={styles.modalSubtitle}>Be honest with yourself</Text>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>REASON</Text>
              {EXCUSE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.excuseRow,
                    excuseCategory === cat.id && styles.excuseRowSelected,
                  ]}
                  onPress={() => setExcuseCategory(excuseCategory === cat.id ? '' : cat.id)}
                >
                  <Text style={[
                    styles.excuseText,
                    excuseCategory === cat.id && { color: colors.primary.main },
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {excuseCategory === 'other' && (
              <View style={styles.section}>
                <TextInput
                  style={styles.textInput}
                  placeholder="What happened?"
                  placeholderTextColor={colors.primary.disabled}
                  value={excuseDetail}
                  onChangeText={setExcuseDetail}
                  maxLength={1000}
                />
              </View>
            )}

            <View style={styles.modalButtons}>
              <PrimaryButton
                title="Submit"
                onPress={submitNo}
                variant="danger"
                loading={checking}
              />
              <PrimaryButton
                title="Cancel"
                onPress={() => { setShowNoModal(false); resetForms(); }}
                variant="ghost"
                size="small"
                style={{ marginTop: spacing.sm }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  questionContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    paddingTop: spacing.huge,
  },
  question: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.primary.main,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  greetingSubtext: {
    ...typography.body,
    color: colors.primary.muted,
    textAlign: 'center',
  },
  buttonCol: {
    width: '100%',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  yesBtn: {
    backgroundColor: colors.success.main,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  yesBtnText: { fontSize: 17, fontWeight: '700', color: '#000' },
  noBtn: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  noBtnText: { fontSize: 17, fontWeight: '600', color: colors.primary.muted },
  noteBtn: {
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  noteBtnText: { ...typography.label, color: colors.primary.disabled, fontSize: 14 },
  checkedInContainer: {
    backgroundColor: colors.success.glow,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 9999,
    marginBottom: spacing.xxl,
    alignSelf: 'center',
  },
  checkedInText: {
    ...typography.label,
    color: colors.success.main,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  messageText: {
    ...typography.body,
    color: colors.primary.muted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  quoteContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  quoteText: {
    ...typography.body,
    color: colors.primary.disabled,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay.heavy,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: screenPadding.horizontal,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.massive,
    maxHeight: '90%',
  },
  modalTitle: {
    ...typography.h2,
    color: colors.primary.main,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.primary.muted,
    marginBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    ...typography.labelSmall,
    color: colors.primary.disabled,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.tertiary,
  },
  chipSmall: {
    paddingHorizontal: spacing.md,
    minWidth: 44,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.accent.glow,
    borderColor: colors.accent.main,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  chipText: {
    ...typography.label,
    color: colors.primary.muted,
  },
  textInput: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.primary.main,
    minHeight: 48,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  excuseRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: spacing.sm,
    backgroundColor: colors.background.tertiary,
  },
  excuseRowSelected: {
    borderColor: colors.error.main,
    backgroundColor: colors.error.glow,
  },
  excuseText: {
    ...typography.body,
    color: colors.primary.muted,
  },
  modalButtons: {
    marginTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  weeklySection: {
    paddingHorizontal: screenPadding.horizontal,
    marginBottom: spacing.xxl,
  },
  weeklyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  weeklyTitle: {
    ...typography.h3,
    color: colors.primary.main,
  },
  weeklyLinkText: {
    ...typography.labelSmall,
    color: colors.accent.main,
  },
  weeklySubtitle: {
    ...typography.caption,
    color: colors.primary.disabled,
    marginBottom: spacing.sm,
  },
  weeklyEmptyText: {
    ...typography.body,
    color: colors.primary.muted,
  },
  weeklyList: {
    marginTop: spacing.xs,
  },
  weeklyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  weeklyItemTitle: {
    ...typography.body,
    color: colors.primary.main,
    flex: 1,
    marginRight: spacing.sm,
  },
  weeklyItemProgress: {
    ...typography.labelSmall,
    color: colors.accent.main,
  },
  weeklyMoreText: {
    ...typography.caption,
    color: colors.primary.disabled,
    marginTop: spacing.xs,
  },
});
