import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { Post } from '../types';
import { timeAgo } from '../utils/timeAgo';
import { postsAPI } from '../api/posts';

interface PostCardProps {
  post: Post;
  onPress: () => void;
  onLikeUpdate?: (postId: string, liked: boolean, likesCount: number) => void;
  onDelete?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPress, onLikeUpdate, onDelete }) => {
  const authorName = post.is_anonymous
    ? 'Anonymous'
    : post.author?.username || 'Unknown';
  const avatarLetter = post.is_anonymous
    ? 'A'
    : authorName[0]?.toUpperCase() || '?';

  const handleLike = async () => {
    try {
      const result = await postsAPI.toggleLike(post.id);
      onLikeUpdate?.(post.id, result.liked, result.likes_count);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, post.is_anonymous && styles.anonAvatar]}>
          <Text style={styles.avatarText}>{avatarLetter}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.username}>{authorName}</Text>
          <Text style={styles.date}>{timeAgo(post.created_at)}</Text>
        </View>
        {onDelete && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              onDelete();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteIcon}>{'\u2715'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {(post.category || post.prompt) && (
        <View style={styles.tagRow}>
          {post.category ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{post.category}</Text>
            </View>
          ) : null}
          {post.prompt ? (
            <Text style={styles.promptTag} numberOfLines={1}>{post.prompt}</Text>
          ) : null}
        </View>
      )}

      <Text style={styles.title} numberOfLines={2}>
        {post.title}
      </Text>

      <View style={styles.footer}>
        <View style={styles.footerStats}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              handleLike();
            }}
            style={styles.likeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.likeIcon, post.is_liked && styles.likeActive]}>
              {post.is_liked ? '\u2665' : '\u2661'}
            </Text>
            <Text style={[styles.statText, post.is_liked && styles.likeActive]}>
              {post.likes_count || 0}
            </Text>
          </TouchableOpacity>

          <View style={styles.rightStats}>
            <Text style={styles.statText}>
              {post.views_count || 0} {(post.views_count || 0) === 1 ? 'view' : 'views'}
            </Text>
            <Text style={styles.statDot}>{'\u00B7'}</Text>
            <Text style={styles.statText}>
              {post.comments_count || 0} {(post.comments_count || 0) === 1 ? 'comment' : 'comments'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    ...shadows.small,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
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
    ...typography.label,
    color: colors.accent.main,
  },
  headerInfo: {
    flex: 1,
  },
  username: {
    ...typography.label,
    color: colors.primary.light,
  },
  date: {
    ...typography.caption,
    color: colors.primary.disabled,
    marginTop: 2,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    fontSize: 14,
    color: colors.primary.disabled,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    backgroundColor: colors.accent.glow,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    ...typography.caption,
    color: colors.accent.main,
    textTransform: 'capitalize',
    fontSize: 11,
  },
  promptTag: {
    ...typography.caption,
    color: colors.primary.disabled,
    fontStyle: 'italic',
    flex: 1,
  },
  title: {
    ...typography.h3,
    color: colors.primary.main,
    marginBottom: spacing.sm,
  },
  footer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  footerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  likeIcon: {
    fontSize: 18,
    color: colors.primary.muted,
  },
  likeActive: {
    color: colors.error.main,
  },
  rightStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statDot: {
    color: colors.primary.disabled,
    fontSize: 10,
  },
  statText: {
    ...typography.caption,
    color: colors.primary.disabled,
  },
});
