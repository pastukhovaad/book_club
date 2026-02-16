import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  getCommentReplies,
  createCommentReply,
  updateCommentReply,
  deleteCommentReply,
} from '@/services';

export const useCommentReplies = (slug, commentId, enabled = false) => {
  const queryClient = useQueryClient();
  const [editingReply, setEditingReply] = useState(null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyFormError, setReplyFormError] = useState(null);

  const {
    data: replies,
    isLoading: repliesLoading,
    error: repliesError,
  } = useQuery({
    queryKey: ['commentReplies', slug, commentId],
    queryFn: () => getCommentReplies(slug, commentId),
    enabled: enabled && !!slug && !!commentId,
  });

  const createReplyMutation = useMutation({
    mutationFn: (data) => createCommentReply(slug, commentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentReplies', slug, commentId] });
      queryClient.invalidateQueries({ queryKey: ['bookComments', slug] });
      setShowReplyForm(false);
      setReplyFormError(null);
      toast.success('Reply added');
    },
    onError: (err) => {
      const errorMessage = err.message || 'Failed to create reply';
      setReplyFormError(errorMessage);
      toast.error(errorMessage);
    },
  });

  const updateReplyMutation = useMutation({
    mutationFn: ({ replyId, data }) => updateCommentReply(slug, commentId, replyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentReplies', slug, commentId] });
      setShowReplyForm(false);
      setEditingReply(null);
      setReplyFormError(null);
      toast.success('Reply updated');
    },
    onError: (err) => {
      const errorMessage = err.message || 'Failed to update reply';
      setReplyFormError(errorMessage);
      toast.error(errorMessage);
    },
  });

  const deleteReplyMutation = useMutation({
    mutationFn: (replyId) => deleteCommentReply(slug, commentId, replyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentReplies', slug, commentId] });
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
    setReplyFormError(null);
  };

  const handleCloseReplyForm = () => {
    setShowReplyForm(false);
    setEditingReply(null);
    setReplyFormError(null);
  };

  return {
    replies,
    repliesLoading,
    repliesError,
    editingReply,
    showReplyForm,
    replyFormError,

    isSubmitting: createReplyMutation.isPending || updateReplyMutation.isPending,
    isDeleting: deleteReplyMutation.isPending,

    handleSubmitReply,
    handleEditReply,
    handleDeleteReply,
    handleOpenReplyForm,
    handleCloseReplyForm,
  };
};

export default useCommentReplies;
