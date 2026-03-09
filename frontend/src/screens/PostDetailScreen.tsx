import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, screenPadding, borderRadius } from '../theme';
import { postsAPI } from '../api/posts';
import { commentsAPI } from '../api/comments';
import { Post, Comment as CommentType, FeedStackParamList } from '../types';
import { timeAgo } from '../utils/timeAgo';
import { CommentItem } from '../components/CommentItem';
import { CommentInput } from '../components/CommentInput';
import { useAuth } from '../hooks/useAuth';

type PostDetailRouteProp = RouteProp<FeedStackParamList, 'PostDetail'>;

export const PostDetailScreen: React.FC = () => {
  const route = useRoute<PostDetailRouteProp>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { postId } = route.params;
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [replyToId, setReplyToId] = useState<string | undefined>(undefined);

  const fetchPost = useCallback(async () => {
    try {
      const data = await postsAPI.getById(postId);
      setPost(data);
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const fetchComments = useCallback(async () => {
    try {
      const data = await commentsAPI.getByPost(postId);
      setComments(data.comments);
      setCommentsTotal(data.total);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [fetchPost, fetchComments]);

  const handleLike = async () => {
    if (!post) return;
    try {
      const result = await postsAPI.toggleLike(postId);
      setPost({
        ...post,
        is_liked: result.liked,
        likes_count: result.likes_count,
      });
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleComment = async (content: string) => {
    await commentsAPI.create(postId, {
      content,
      parent_id: replyToId,
    });
    setReplyToId(undefined);
    await fetchComments();
    if (post) {
      setPost({ ...post, comments_count: commentsTotal + 1 });
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await postsAPI.delete(postId);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete post');
          }
        },
      },
    ]);
  };

  const isOwnPost = post && user && post.author_id === user.id;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.main} />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Post not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Author info */}
          <View style={styles.authorContainer}>
            <View style={[styles.avatar, post.is_anonymous && styles.anonAvatar]}>
              <Text style={styles.avatarText}>
                {post.is_anonymous ? 'A' : post.author?.username?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.authorName}>
                {post.is_anonymous ? 'Anonymous' : post.author?.username || 'Unknown'}
              </Text>
              <Text style={styles.date}>{timeAgo(post.created_at)}</Text>
            </View>
            {isOwnPost && (
              <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>{post.title}</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Content */}
          <Text style={styles.content}>{post.content}</Text>

          {/* Like + Stats bar */}
          <View style={styles.statsBar}>
            <TouchableOpacity onPress={handleLike} style={styles.likeButton}>
              <Text style={[styles.likeIcon, post.is_liked && styles.likeIconActive]}>
                {post.is_liked ? '\u2665' : '\u2661'}
              </Text>
              <Text style={[styles.likesCount, post.is_liked && styles.likesCountActive]}>
                {post.likes_count}
              </Text>
            </TouchableOpacity>
            <View style={styles.rightStats}>
              <Text style={styles.commentsCount}>
                {post.views_count || 0} {(post.views_count || 0) === 1 ? 'view' : 'views'}
              </Text>
              <Text style={styles.statDot}>{'\u00B7'}</Text>
              <Text style={styles.commentsCount}>
                {commentsTotal} {commentsTotal === 1 ? 'comment' : 'comments'}
              </Text>
            </View>
          </View>

          {/* Comments */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>Comments</Text>
            {comments.length === 0 ? (
              <Text style={styles.noComments}>No comments yet. Be the first!</Text>
            ) : (
              comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onReply={(parentId) => setReplyToId(parentId)}
                />
              ))
            )}
          </View>
        </ScrollView>

        <CommentInput
          onSubmit={handleComment}
          replyingTo={replyToId}
          onCancelReply={() => setReplyToId(undefined)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  flex: {
    flex: 1,
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
    paddingBottom: spacing.xxl,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent.glow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  anonAvatar: {
    backgroundColor: colors.background.elevated,
  },
  avatarText: {
    ...typography.h4,
    color: colors.accent.main,
  },
  authorName: {
    ...typography.label,
    color: colors.primary.light,
  },
  date: {
    ...typography.caption,
    color: colors.primary.disabled,
    marginTop: 2,
  },
  title: {
    ...typography.displayMedium,
    color: colors.primary.main,
    marginBottom: spacing.xl,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginBottom: spacing.xxl,
  },
  content: {
    ...typography.bodyLarge,
    color: colors.primary.muted,
    lineHeight: 28,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.subtle,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  likeIcon: {
    fontSize: 22,
    color: colors.primary.muted,
  },
  likeIconActive: {
    color: colors.error.main,
  },
  likesCount: {
    ...typography.label,
    color: colors.primary.muted,
  },
  likesCountActive: {
    color: colors.error.main,
  },
  rightStats: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
  },
  statDot: {
    color: colors.primary.disabled,
    fontSize: 10,
  },
  commentsCount: {
    ...typography.labelSmall,
    color: colors.primary.disabled,
  },
  commentsSection: {
    marginTop: spacing.xxl,
  },
  commentsTitle: {
    ...typography.h3,
    color: colors.primary.main,
    marginBottom: spacing.lg,
  },
  noComments: {
    ...typography.body,
    color: colors.primary.disabled,
    fontStyle: 'italic',
  },
  deleteBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.error.main,
  },
  deleteBtnText: {
    ...typography.labelSmall,
    color: colors.error.main,
  },
});
