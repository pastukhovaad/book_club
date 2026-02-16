import { useState, useEffect } from 'react';
import { IoSend, IoClose } from 'react-icons/io5';

const ReplyForm = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
  editingReply = null,
  error = null,
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
      {error && (
        <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded">
          <p className="text-xs text-red-800 dark:text-red-300">
            {error}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ответ..."
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-[#3B3D52] rounded-lg
                     bg-white dark:bg-[#242535] text-gray-800 dark:text-gray-200
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
          Отмена
        </button>
        <button
          type="submit"
          disabled={!text.trim() || isSubmitting}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg
                     hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                     flex items-center gap-1 transition-colors"
        >
          <IoSend size={14} />
          {isSubmitting ? 'Отправка...' : editingReply ? 'Обновить' : 'Ответить'}
        </button>
      </div>
    </form>
  );
};

export default ReplyForm;
