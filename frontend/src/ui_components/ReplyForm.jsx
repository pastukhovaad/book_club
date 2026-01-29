import { useState, useEffect } from 'react';
import { IoSend, IoClose } from 'react-icons/io5';

const ReplyForm = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
  editingReply = null,
}) => {
  const [text, setText] = useState('');

  useEffect(() => {
    if (editingReply) {
      setText(editingReply.comment_text);
    } else {
      setText('');
    }
  }, [editingReply]);

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!text.trim()) return;

    onSubmit(text.trim());
    setText('');
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setText('');
    onCancel();
  };

  return (
    <form
      onSubmit={handleSubmit}
      onClick={(e) => e.stopPropagation()}
      className="mt-2"
    >
      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a reply..."
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     resize-none"
          rows={2}
          disabled={isSubmitting}
        />
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <button
          type="button"
          onClick={handleCancel}
          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400
                     hover:text-gray-800 dark:hover:text-gray-200
                     flex items-center gap-1 transition-colors"
          disabled={isSubmitting}
        >
          <IoClose size={16} />
          Cancel
        </button>
        <button
          type="submit"
          disabled={!text.trim() || isSubmitting}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg
                     hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                     flex items-center gap-1 transition-colors"
        >
          <IoSend size={14} />
          {isSubmitting ? 'Sending...' : editingReply ? 'Update' : 'Reply'}
        </button>
      </div>
    </form>
  );
};

export default ReplyForm;
