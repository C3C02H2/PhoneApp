import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, screenPadding } from '../theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextInputField } from '../components/TextInputField';
import { postsAPI } from '../api/posts';
import { COMMUNITY_CATEGORIES, POST_PROMPTS } from '../types';

export const CreatePostScreen: React.FC = () => {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [category, setCategory] = useState<string | undefined>();
  const [selectedPrompt, setSelectedPrompt] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  const validate = (): boolean => {
    const newErrors: { title?: string; content?: string } = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!content.trim()) newErrors.content = 'Content is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePromptSelect = (prompt: string) => {
    if (selectedPrompt === prompt) {
      setSelectedPrompt(undefined);
      setTitle('');
    } else {
      setSelectedPrompt(prompt);
      setTitle(prompt);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await postsAPI.create({
        title: title.trim(),
        content: content.trim(),
        is_anonymous: isAnonymous,
        category: category || undefined,
        prompt: selectedPrompt || undefined,
      });
      setTitle('');
      setContent('');
      setIsAnonymous(false);
      setCategory(undefined);
      setSelectedPrompt(undefined);
      setErrors({});
      Alert.alert('Success', 'Your post has been published!');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to create post.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Share your story</Text>
            <Text style={styles.headerSubtitle}>Inspire others with your journey</Text>
          </View>

          {/* Prompts */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>START WITH A PROMPT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {POST_PROMPTS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.promptChip, selectedPrompt === p && styles.promptChipSelected]}
                    onPress={() => handlePromptSelect(p)}
                  >
                    <Text style={[
                      styles.promptChipText,
                      selectedPrompt === p && { color: colors.primary.main },
                    ]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>COMMUNITY</Text>
            <View style={styles.chipRow}>
              {COMMUNITY_CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, category === c.id && styles.chipSelected]}
                  onPress={() => setCategory(category === c.id ? undefined : c.id)}
                >
                  <Text style={[
                    styles.chipText,
                    category === c.id && { color: colors.primary.main },
                  ]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Form */}
          <TextInputField
            label="Title"
            placeholder="What's on your mind?"
            value={title}
            onChangeText={(t) => { setTitle(t); if (selectedPrompt && t !== selectedPrompt) setSelectedPrompt(undefined); }}
            error={errors.title}
            maxLength={200}
          />

          <View style={styles.contentContainer}>
            <Text style={styles.label}>Content</Text>
            <TextInput
              style={[styles.contentInput, errors.content ? styles.contentInputError : null]}
              placeholder="Tell your story..."
              placeholderTextColor={colors.primary.disabled}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              maxLength={5000}
            />
            {errors.content && <Text style={styles.errorText}>{errors.content}</Text>}
          </View>

          <Text style={styles.charCount}>{content.length} / 5000</Text>

          {/* Anonymous toggle */}
          <TouchableOpacity
            onPress={() => setIsAnonymous(!isAnonymous)}
            style={styles.toggleRow}
            activeOpacity={0.7}
          >
            <View style={[styles.toggleTrack, isAnonymous && styles.toggleTrackActive]}>
              <View style={[styles.toggleThumb, isAnonymous && styles.toggleThumbActive]} />
            </View>
            <Text style={styles.toggleLabel}>Post anonymously</Text>
          </TouchableOpacity>

          <PrimaryButton
            title="Publish"
            onPress={handleSubmit}
            loading={loading}
            disabled={!title.trim() || !content.trim()}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: screenPadding.horizontal,
    paddingTop: spacing.huge,
    paddingBottom: spacing.massive,
  },
  header: {
    marginBottom: spacing.xxl,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.primary.main,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.primary.muted,
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.tertiary,
  },
  chipSelected: {
    backgroundColor: colors.accent.glow,
    borderColor: colors.accent.main,
  },
  chipText: {
    ...typography.label,
    color: colors.primary.muted,
  },
  promptChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.secondary,
    marginRight: spacing.sm,
    maxWidth: 220,
  },
  promptChipSelected: {
    backgroundColor: colors.accent.glow,
    borderColor: colors.accent.main,
  },
  promptChipText: {
    ...typography.label,
    color: colors.primary.muted,
  },
  label: {
    ...typography.label,
    color: colors.primary.muted,
    marginBottom: spacing.sm,
  },
  contentContainer: {
    marginBottom: spacing.lg,
  },
  contentInput: {
    minHeight: 160,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.primary.main,
  },
  contentInputError: {
    borderColor: colors.error.main,
  },
  errorText: {
    ...typography.caption,
    color: colors.error.main,
    marginTop: spacing.xs,
  },
  charCount: {
    ...typography.caption,
    color: colors.primary.disabled,
    textAlign: 'right',
    marginBottom: spacing.xl,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background.elevated,
    padding: 2,
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: colors.accent.main,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary.disabled,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary.main,
  },
  toggleLabel: {
    ...typography.label,
    color: colors.primary.muted,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});
