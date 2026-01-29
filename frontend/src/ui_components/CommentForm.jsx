import { useState } from 'react';
import { IoCloseOutline } from 'react-icons/io5';
import SmallSpinner from './SmallSpinner';

const CommentForm = ({
  selectedText,
  onSubmit,
  onCancel,
  initialComment = '',
  isEditing = false,
  isSubmitting = false,
  commentType = 'personal',
}) => {
  const [commentText, setCommentText] = useState(initialComment);
  const [highlightColor, setHighlightColor] = useState('#FFFF00');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    onSubmit({
      comment_text: commentText,
      highlight_color: highlightColor,
    });
  };

  const colorOptions = [
    { value: '#FFFF00', label: 'Yellow' },
    { value: '#FFB6C1', label: 'Pink' },
    { value: '#90EE90', label: 'Green' },
    { value: '#87CEEB', label: 'Blue' },
    { value: '#FFD700', label: 'Gold' },
    { value: '#FFA07A', label: 'Orange' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-[#181A2A] rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {isEditing ? 'Edit Comment' : `Add ${commentType === 'personal' ? 'Personal Note' : 'Group Comment'}`}
            </h3>
            {!isEditing && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {commentType === 'personal'
                  ? 'Visible only to you'
                  : 'Visible to all confirmed group members'}
              </p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            disabled={isSubmitting}
          >
            <IoCloseOutline size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Selected Text Display */}
          {selectedText && !isEditing && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Selected text:
              </p>
              <p className="text-sm text-gray-800 dark:text-gray-200 italic">
                "{selectedText}"
              </p>
            </div>
          )}

          {/* Comment Input */}
          <div className="mb-4">
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Your comment
            </label>
            <textarea
              id="comment"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 resize-none"
              rows="4"
              placeholder="Write your comment here..."
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Color Picker */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Highlight color
            </label>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setHighlightColor(color.value)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    highlightColor === color.value
                      ? 'border-blue-600 scale-110'
                      : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                  disabled={isSubmitting}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isSubmitting || !commentText.trim()}
            >
              {isSubmitting ? (
                <>
                  <SmallSpinner />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? 'Update' : 'Add Comment'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentForm;
