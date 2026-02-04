import { useState } from 'react';
import { BiEdit, BiTrash } from 'react-icons/bi';
import { resolveMediaUrl } from "@/api";
import ReplyForm from './ReplyForm';

const ReplyItem = ({
  reply,
  currentUser,
  onEdit,
  onDelete,
  isDeleting,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isOwner = currentUser && reply.user.username === currentUser;

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

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(reply.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div
      className="pl-4 border-l-2 border-gray-200 dark:border-gray-600 py-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {/* User Avatar */}
          {reply.user.profile_picture ? (
            <img
              src={resolveMediaUrl(reply.user.profile_picture)}
              alt={reply.user.username}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-white font-semibold text-xs">
              {reply.user.username[0].toUpperCase()}
            </div>
          )}
          <div>
            <span className="font-medium text-xs text-gray-800 dark:text-white">
              {reply.user.username}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              {formatDate(reply.created_at)}
            </span>
          </div>
        </div>

        {/* Actions */}
        {isOwner && (
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(reply);
              }}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
              title="Edit reply"
            >
              <BiEdit size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
              title="Delete reply"
            >
              <BiTrash size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Reply Text */}
      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 ml-8">
        {reply.comment_text}
      </p>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div
          className="mt-2 ml-8 p-2 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs text-red-800 dark:text-red-300 mb-2">
            Delete this reply?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(false);
              }}
              className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const CommentReplies = ({
  replies,
  repliesLoading,
  currentUser,
  showReplyForm,
  editingReply,
  isSubmitting,
  onSubmitReply,
  onEditReply,
  onDeleteReply,
  onOpenReplyForm,
  onCloseReplyForm,
  isDeleting,
}) => {
  return (
    <div
      className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Replies List */}
      {repliesLoading ? (
        <div className="flex justify-center py-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        </div>
      ) : replies && replies.length > 0 ? (
        <div className="space-y-2">
          {replies.map((reply) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              currentUser={currentUser}
              onEdit={onEditReply}
              onDelete={onDeleteReply}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
          No replies yet
        </p>
      )}

      {/* Reply Form */}
      {showReplyForm ? (
        <ReplyForm
          onSubmit={onSubmitReply}
          onCancel={onCloseReplyForm}
          isSubmitting={isSubmitting}
          editingReply={editingReply}
        />
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenReplyForm();
          }}
          className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          + Add reply
        </button>
      )}
    </div>
  );
};

export default CommentReplies;
