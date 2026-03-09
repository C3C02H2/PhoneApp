import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, screenPadding, borderRadius } from '../theme';
import { PostCard } from '../components/PostCard';
import { postsAPI } from '../api/posts';
import { usersAPI } from '../api/users';
import { Post, UserSearchResult, FeedStackParamList, COMMUNITY_CATEGORIES } from '../types';
import { useAuth } from '../hooks/useAuth';

type Nav = NativeStackNavigationProp<FeedStackParamList, 'FeedList'>;

const SORT_TABS = [
  { key: 'recent', label: 'Latest' },
  { key: 'most_liked', label: 'Top' },
  { key: 'following', label: 'Following' },
] as const;

export const FeedScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<string>('recent');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchPosts = useCallback(async (sort: string = sortBy, cat?: string) => {
    try {
      const data = await postsAPI.getAll(0, 20, sort, cat);
      setPosts(data.posts);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [sortBy]);

  useEffect(() => { setLoading(true); fetchPosts(sortBy, selectedCategory); }, [sortBy, selectedCategory]);

  const onRefresh = async () => { setRefreshing(true); await fetchPosts(sortBy, selectedCategory); setRefreshing(false); };

  const handleLikeUpdate = (postId: string, liked: boolean, likesCount: number) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_liked: liked, likes_count: likesCount } : p));
  };

  const handleDelete = async (postId: string) => {
    Alert.alert('Delete Post', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await postsAPI.delete(postId); setPosts(prev => prev.filter(p => p.id !== postId)); }
        catch (e) { Alert.alert('Error', 'Failed to delete'); }
      }},
    ]);
  };

  const handleSearch = useCallback(async (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try { const d = await usersAPI.search(text.trim()); setSearchResults(d.users); }
    catch (e) { console.error(e); }
    finally { setSearching(false); }
  }, []);

  const closeSearch = () => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]); };
  const isSearchMode = searchOpen && searchQuery.trim().length > 0;

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
      onLikeUpdate={handleLikeUpdate}
      onDelete={item.author_id === user?.id ? () => handleDelete(item.id) : undefined}
    />
  );

  const renderUser = ({ item }: { item: UserSearchResult }) => (
    <TouchableOpacity
      style={styles.userCard}
      activeOpacity={0.7}
      onPress={() => { closeSearch(); navigation.navigate('UserProfile', { userId: item.id }); }}
    >
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarText}>{item.username[0]?.toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.userName}>{item.username}</Text>
        <Text style={styles.userJoined}>Joined {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</Text>
      </View>
      <Text style={styles.chevron}>{'\u203A'}</Text>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyIcon}>{'\u2727'}</Text>
      <Text style={styles.emptyTitle}>{sortBy === 'following' ? 'No posts from people you follow' : 'No posts yet'}</Text>
      <Text style={styles.emptySubtitle}>{sortBy === 'following' ? 'Follow users to see their posts here' : 'Be the first to share'}</Text>
    </View>
  );

  if (loading && !searchOpen) {
    return <SafeAreaView style={styles.container}><ActivityIndicator color={colors.accent.main} style={{ marginTop: 120 }} /></SafeAreaView>;
  }

  const header = (
    <View>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.title}>Community</Text>
        <TouchableOpacity
          onPress={searchOpen ? closeSearch : () => setSearchOpen(true)}
          style={styles.searchBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.searchBtnIcon}>{searchOpen ? '\u2715' : '\u2315'}</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      {searchOpen && (
        <View style={styles.searchBar}>
          <Text style={styles.searchBarIcon}>{'\u2315'}</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor={colors.primary.disabled}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}><Text style={styles.clearIcon}>{'\u2715'}</Text></TouchableOpacity>
          )}
        </View>
      )}

      {!isSearchMode && (
        <>
          {/* Sort tabs - underline style */}
          <View style={styles.sortBar}>
            {SORT_TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setSortBy(tab.key)}
                style={[styles.sortTab, sortBy === tab.key && styles.sortTabActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.sortTabText, sortBy === tab.key && styles.sortTabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Category pills - horizontal scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
            <TouchableOpacity
              onPress={() => setSelectedCategory(undefined)}
              style={[styles.catPill, !selectedCategory && styles.catPillActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.catPillText, !selectedCategory && styles.catPillTextActive]}>All</Text>
            </TouchableOpacity>
            {COMMUNITY_CATEGORIES.map(c => (
              <TouchableOpacity
                key={c.id}
                onPress={() => setSelectedCategory(selectedCategory === c.id ? undefined : c.id)}
                style={[styles.catPill, selectedCategory === c.id && styles.catPillActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.catPillText, selectedCategory === c.id && styles.catPillTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Quote banner */}
          <View style={styles.quoteBanner}>
            <Text style={styles.quoteText}>"Consistency is the key to success."</Text>
          </View>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={isSearchMode ? searchResults : posts}
        renderItem={isSearchMode ? renderUser : renderPost}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={header}
        ListEmptyComponent={isSearchMode ? () => (
          <View style={styles.emptyWrap}>
            {searching ? <ActivityIndicator color={colors.accent.main} /> : (
              <>
                <Text style={styles.emptyTitle}>No users found</Text>
                <Text style={styles.emptySubtitle}>Try a different name</Text>
              </>
            )}
          </View>
        ) : renderEmpty}
        refreshControl={!isSearchMode ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.main} /> : undefined}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  listContent: { paddingHorizontal: screenPadding.horizontal, paddingBottom: 100 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: spacing.xxl, marginBottom: spacing.lg,
  },
  title: { fontSize: 28, fontWeight: '700', color: colors.primary.main },
  searchBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.background.secondary, borderWidth: 1,
    borderColor: colors.border.subtle, alignItems: 'center', justifyContent: 'center',
  },
  searchBtnIcon: { fontSize: 18, color: colors.primary.muted },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background.secondary, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border.light,
    paddingHorizontal: spacing.md, marginBottom: spacing.lg, height: 46,
  },
  searchBarIcon: { fontSize: 16, color: colors.primary.disabled, marginRight: spacing.sm },
  searchInput: { flex: 1, fontSize: 15, color: colors.primary.main, paddingVertical: 0 },
  clearIcon: { fontSize: 14, color: colors.primary.disabled, padding: spacing.xs },

  // Sort tabs - underline style
  sortBar: {
    flexDirection: 'row', borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle, marginBottom: spacing.lg,
  },
  sortTab: {
    paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
    borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1,
  },
  sortTabActive: { borderBottomColor: colors.accent.main },
  sortTabText: { fontSize: 14, fontWeight: '600', color: colors.primary.disabled },
  sortTabTextActive: { color: colors.accent.main },

  // Category pills
  catRow: { paddingBottom: spacing.lg, gap: spacing.sm },
  catPill: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.background.tertiary, borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  catPillActive: {
    backgroundColor: colors.accent.main, borderColor: colors.accent.main,
  },
  catPillText: { fontSize: 13, fontWeight: '600', color: colors.primary.muted },
  catPillTextActive: { color: '#fff' },

  // Quote banner
  quoteBanner: {
    backgroundColor: colors.background.secondary, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 20, marginBottom: spacing.xl,
    borderLeftWidth: 3, borderLeftColor: colors.accent.main,
  },
  quoteText: { fontSize: 13, color: colors.primary.muted, fontStyle: 'italic', lineHeight: 19 },

  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 40, color: colors.primary.disabled, marginBottom: spacing.lg },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.primary.muted, marginBottom: spacing.xs },
  emptySubtitle: { fontSize: 14, color: colors.primary.disabled },

  // User search
  userCard: {
    backgroundColor: colors.background.secondary, borderRadius: 14,
    padding: spacing.lg, marginBottom: spacing.sm,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  userAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.accent.glow, alignItems: 'center',
    justifyContent: 'center', marginRight: spacing.md,
  },
  userAvatarText: { fontSize: 18, fontWeight: '700', color: colors.accent.main },
  userName: { fontSize: 15, fontWeight: '600', color: colors.primary.main },
  userJoined: { fontSize: 12, color: colors.primary.disabled, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.primary.disabled },
});
