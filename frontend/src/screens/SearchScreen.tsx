import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, screenPadding, borderRadius } from '../theme';
import { usersAPI } from '../api/users';
import { UserSearchResult, ChatStackParamList } from '../types';

type SearchNavProp = NativeStackNavigationProp<ChatStackParamList, 'SearchUsers'>;

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<SearchNavProp>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (text.trim().length === 0) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const data = await usersAPI.search(text.trim());
      setResults(data.users);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const renderUser = ({ item }: { item: UserSearchResult }) => (
    <TouchableOpacity
      style={styles.userCard}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
    >
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarText}>
          {item.username[0]?.toUpperCase() || '?'}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.username}</Text>
        <Text style={styles.userJoined}>
          Joined {new Date(item.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
          })}
        </Text>
      </View>
      <Text style={styles.chevron}>{'\u203A'}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <Text style={styles.subtitle}>Find people in the community</Text>
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by username..."
          placeholderTextColor={colors.primary.disabled}
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent.main} />
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            searched ? (
              <View style={styles.centerContainer}>
                <Text style={styles.emptyTitle}>No users found</Text>
                <Text style={styles.emptySubtitle}>Try a different search term</Text>
              </View>
            ) : (
              <View style={styles.centerContainer}>
                <Text style={styles.emptyTitle}>Search for users</Text>
                <Text style={styles.emptySubtitle}>
                  Type a username to find people
                </Text>
              </View>
            )
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: screenPadding.horizontal,
    paddingTop: spacing.huge,
    marginBottom: spacing.lg,
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
  searchBar: {
    paddingHorizontal: screenPadding.horizontal,
    marginBottom: spacing.lg,
  },
  searchInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.primary.main,
  },
  listContent: {
    paddingHorizontal: screenPadding.horizontal,
    paddingBottom: spacing.massive,
  },
  userCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent.glow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  userAvatarText: {
    ...typography.h4,
    color: colors.accent.main,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.label,
    color: colors.primary.main,
  },
  userJoined: {
    ...typography.caption,
    color: colors.primary.disabled,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: colors.primary.disabled,
  },
  centerContainer: {
    alignItems: 'center',
    paddingVertical: spacing.colossal,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.primary.muted,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.primary.disabled,
  },
});
