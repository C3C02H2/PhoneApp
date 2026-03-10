import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '../theme';
import { Comment } from '../types';
import { timeAgo } from '../utils/timeAgo';

interface CommentItemProps {
  comment: Comment;
  depth?: number;
  onReply: (parentId: string) => void;
}

const MAX_DEPTH = 3;

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  depth = 0,
  onReply,
}) => {
  const [showReplies, setShowReplies] = useState(true);
  const authorName = comment.is_anonymous
    ? 'Anonymous'
    : comment.author?.username || 'Unknown';
  const avatarLetter = comment.is_anonymous
    ? 'A'
    : authorName[0]?.toUpperCase() || '?';

  return (
    <View style={[styles.container, depth > 0 && styles.nested]}>
      <View style={styles.header}>
        <View style={[styles.avatar, comment.is_anonymous && styles.anonAvatar]}>
          <Text style={styles.avatarText}>{avatarLetter}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.username}>{authorName}</Text>
          <Text style={styles.date}>{timeAgo(comment.created_at)}</Text>
        </View>
      </View>

      <Text style={styles.content}>{comment.content}</Text>

      <View style={styles.actions}>
        {depth < MAX_DEPTH && (
          <TouchableOpacity onPress={() => onReply(comment.id)}>
            <Text style={styles.replyButton}>Reply</Text>
          </TouchableOpacity>
        )}
      </View>

      {comment.replies && comment.replies.length > 0 && (
        <>
          {comment.replies.length > 1 && (
            <TouchableOpacity onPress={() => setShowReplies(!showReplies)}>
              <Text style={styles.toggleReplies}>
                {showReplies
                  ? `Hide replies (${comment.replies.length})`
                  : `Show replies (${comment.replies.length})`}
              </Text>
            </TouchableOpacity>
          )}
          {showReplies &&
            comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                onReply={onReply}
              />
            ))}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  nested: {
    marginLeft: spacing.xl,
    borderLeftWidth: 2,
    borderLeftColor: colors.border.light,
    paddingLeft: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 9999,
    backgroundColor: colors.accent.glow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  anonAvatar: {
    backgroundColor: colors.background.elevated,
  },
  avatarText: {
    ...typography.caption,
    color: colors.accent.main,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  username: {
    ...typography.labelSmall,
    color: colors.primary.light,
  },
  date: {
    ...typography.caption,
    color: colors.primary.disabled,
  },
  content: {
    ...typography.body,
    color: colors.primary.muted,
    marginLeft: 36,
    marginBottom: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    marginLeft: 36,
  },
  replyButton: {
    ...typography.caption,
    color: colors.accent.main,
    fontWeight: '600',
  },
  toggleReplies: {
    ...typography.caption,
    color: colors.primary.disabled,
    marginLeft: 36,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
});
