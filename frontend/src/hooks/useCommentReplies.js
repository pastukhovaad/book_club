import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  getCommentReplies,
  createCommentReply,
  updateCommentReply,
  deleteCommentReply,
} from '@/services/apiBook';

export const useCommentReplies = (slug, commentId, enabled = false) => {
  const queryClient = useQueryClient();
  const [editingReply, setEditingReply] = useState(null);
  const [showReplyForm, setShowReplyForm] = useState(false);

  // Fetch replies for a specific comment
  const {
    data: replies,
    isLoading: repliesLoading,
    error: repliesError,
  } = useQuery({
    queryKey: ['commentReplies', slug, commentId],
    queryFn: () => getCommentReplies(slug, commentId),
    enabled: enabled && !!slug && !!commentId,
  });

  // Create reply mutation
  const createReplyMutation = useMutation({
    mutationFn: (data) => createCommentReply(slug, commentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentReplies', slug, commentId] });
      // Also invalidate parent comments to update replies_count
      queryClient.invalidateQueries({ queryKey: ['bookComments', slug] });
      setShowReplyForm(false);
      toast.success('Reply added');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create reply');
    },
  });

  // Update reply mutation
  const updateReplyMutation = useMutation({
    mutationFn: ({ replyId, data }) => updateCommentReply(slug, commentId, replyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentReplies', slug, commentId] });
      setShowReplyForm(false);
      setEditingReply(null);
      toast.success('Reply updated');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update reply');
    },
  });

  // Delete reply mutation
  const deleteReplyMutation = useMutation({
    mutationFn: (replyId) => deleteCommentReply(slug, commentId, replyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentReplies', slug, commentId] });
      // Also invalidate parent comments to update replies_count
      queryClient.invalidateQueries({ queryKey: ['bookComments', slug] });
      toast.success('Reply deleted');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete reply');
    },
  });

  const handleSubmitReply = (text) => {
    if (editingReply) {
      updateReplyMutation.mutate({
        replyId: editingReply.id,
        data: { comment_text: text },
      });
    } else {
      createReplyMutation.mutate({ comment_text: text });
    }
  };

  const handleEditReply = (reply) => {
    setEditingReply(reply);
    setShowReplyForm(true);
  };

  const handleDeleteReply = (replyId) => {
    deleteReplyMutation.mutate(replyId);
  };

  const handleOpenReplyForm = () => {
    setEditingReply(null);
    setShowReplyForm(true);
  };

  const handleCloseReplyForm = () => {
    setShowReplyForm(false);
    setEditingReply(null);
  };

  return {
    // State
    replies,
    repliesLoading,
    repliesError,
    editingReply,
    showReplyForm,

    // Mutation states
    isSubmitting: createReplyMutation.isPending || updateReplyMutation.isPending,
    isDeleting: deleteReplyMutation.isPending,

    // Handlers
    handleSubmitReply,
    handleEditReply,
    handleDeleteReply,
    handleOpenReplyForm,
    handleCloseReplyForm,
  };
};

export default useCommentReplies;
