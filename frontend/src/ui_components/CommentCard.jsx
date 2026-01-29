import { useState } from 'react';
import { BiEdit, BiTrash } from 'react-icons/bi';
import { BsQuote } from 'react-icons/bs';
import { IoChevronDown, IoChevronUp, IoChatbubbleOutline } from 'react-icons/io5';
import { BASE_URL } from "@/api";
import useCommentReplies from '@/hooks/useCommentReplies';
import CommentReplies from './CommentReplies';

const CommentCard = ({
  comment,
  currentUser,
  onEdit,
  onDelete,
  onJumpTo,
  isActive = false,
  isGroupComment = false,
  bookSlug,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const isOwner = currentUser && comment.user.username === currentUser;

  // Hook for managing replies (only enabled when replies section is open)
  const {
    replies,
    repliesLoading,
    editingReply,
    showReplyForm,
    isSubmitting,
    isDeleting,
    handleSubmitReply,
    handleEditReply,
    handleDeleteReply,
    handleOpenReplyForm,
    handleCloseReplyForm,
  } = useCommentReplies(bookSlug, comment.id, showReplies && isGroupComment);

  const repliesCount = comment.replies_count || 0;

  const handleDelete = () => {
    onDelete(comment.id);
    setShowDeleteConfirm(false);
  };


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`border dark:border-gray-700 rounded-lg p-4 mb-3 transition-all hover:shadow-md ${
        comment.cfi_range ? 'cursor-pointer' : 'cursor-default'
      } ${
        isActive
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
          : 'bg-white dark:bg-gray-800'
      }`}
      onClick={() => {
        if (comment.cfi_range) {
          onJumpTo(comment.cfi_range);
        }
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* User Avatar */}
          {comment.user.profile_picture ? (
            <img
              src={`${BASE_URL}${comment.user.profile_picture}`}
              alt={comment.user.username}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
              {comment.user.username[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-sm text-gray-800 dark:text-white">
              {comment.user.username || comment.user.first_name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(comment.created_at)}
            </p>
          </div>
        </div>

        {/* Actions */}
        {isOwner && (
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(comment);
              }}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
              title="Edit comment"
            >
              <BiEdit size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
              title="Delete comment"
            >
              <BiTrash size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Selected Text Quote */}
      <div className="mb-2 pl-3 border-l-3 border-gray-300 dark:border-gray-600">
        <div className="flex items-start gap-2">
          <BsQuote className="text-gray-400 dark:text-gray-500 flex-shrink-0 mt-1" size={14} />
          <p className="text-sm text-gray-600 dark:text-gray-400 italic line-clamp-2">
            {comment.selected_text}
          </p>
        </div>
      </div>

      {/* Comment Text */}
      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
        {comment.comment_text}
      </p>

      {/* Highlight Color Indicator */}
      <div className="flex items-center gap-2 mt-2">
        <div
          className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
          style={{ backgroundColor: comment.highlight_color }}
        />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Highlight color
        </span>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div
          className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm text-red-800 dark:text-red-300 mb-2">
            Delete this comment?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Replies Section - Only for group comments */}
      {isGroupComment && (
        <div className="mt-3">
          {/* Toggle Replies Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowReplies(!showReplies);
            }}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <IoChatbubbleOutline size={16} />
            <span>
              {repliesCount > 0 ? `${repliesCount} ${repliesCount === 1 ? 'reply' : 'replies'}` : 'Reply'}
            </span>
            {repliesCount > 0 && (
              showReplies ? <IoChevronUp size={14} /> : <IoChevronDown size={14} />
            )}
          </button>

          {/* Replies Content */}
          {showReplies && (
            <CommentReplies
              replies={replies}
              repliesLoading={repliesLoading}
              currentUser={currentUser}
              showReplyForm={showReplyForm}
              editingReply={editingReply}
              isSubmitting={isSubmitting}
              isDeleting={isDeleting}
              onSubmitReply={handleSubmitReply}
              onEditReply={handleEditReply}
              onDeleteReply={handleDeleteReply}
              onOpenReplyForm={handleOpenReplyForm}
              onCloseReplyForm={handleCloseReplyForm}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default CommentCard;
