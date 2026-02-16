import { useState, useRef, useEffect } from 'react'
import { IoCloseOutline, IoChevronDown } from 'react-icons/io5'
import { BiMessageSquareDetail } from 'react-icons/bi'
import { HiUserGroup } from 'react-icons/hi'
import CommentCard from './CommentCard'
import SmallSpinner from './SmallSpinner'

const CommentsSidebar = ({
  comments,
  currentUser,
  isLoading,
  error,
  onClose,
  onEdit,
  onDelete,
  onJumpTo,
  activeCommentId,
  onClearActiveComment,
  commentType,
  onCommentTypeChange,
  readingGroupId,
  userGroups,
  userGroupsLoading,
  onSelectGroup,
  selectedGroup,
  bookSlug,
  isAuthenticated = true,
  showCommentForm,
  selectedText,
  onSubmitComment,
  onCancelComment,
  editingComment,
  isSubmitting,
  formError,
}) => {
  const [showGroupDropdown, setShowGroupDropdown] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [highlightColor, setHighlightColor] = useState('#FFFF00')
  const dropdownRef = useRef(null)
  const commentsListRef = useRef(null)
  const commentRefs = useRef({})

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowGroupDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (editingComment) {
      setCommentText(editingComment.comment_text || '')
      setHighlightColor(editingComment.highlight_color || '#FFFF00')
    } else {
      setCommentText('')
      setHighlightColor('#FFFF00')
    }
  }, [editingComment, showCommentForm])

  useEffect(() => {
    if (activeCommentId && commentRefs.current[activeCommentId]) {
      const commentElement = commentRefs.current[activeCommentId]
      const container = commentsListRef.current

      if (commentElement && container) {
        const containerRect = container.getBoundingClientRect()
        const commentRect = commentElement.getBoundingClientRect()

        const scrollOffset = commentRect.top - containerRect.top + container.scrollTop - 20

        container.scrollTo({
          top: scrollOffset,
          behavior: 'smooth'
        })
      }

      const timer = setTimeout(() => {
        if (onClearActiveComment) {
          onClearActiveComment()
        }
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [activeCommentId, onClearActiveComment])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!commentText.trim()) return

    onSubmitComment({
      comment_text: commentText,
      highlight_color: highlightColor,
    })
  }

  const colorOptions = [
    { value: '#FFFF00', label: 'Yellow' },
    { value: '#FFB6C1', label: 'Pink' },
    { value: '#90EE90', label: 'Green' },
    { value: '#87CEEB', label: 'Blue' },
    { value: '#FFD700', label: 'Gold' },
    { value: '#FFA07A', label: 'Orange' },
  ]
  return (
    <div className="w-96 bg-white dark:bg-[#141624] border-l dark:border-gray-700 flex flex-col h-full">
      <div className="sticky top-0 bg-white dark:bg-[#141624] border-b dark:border-gray-700 px-4 py-3 z-10">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <BiMessageSquareDetail size={24} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Комментарии
            </h2>
            {!isLoading && comments && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({comments.length})
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <IoCloseOutline size={24} />
          </button>
        </div>

        {isAuthenticated ? (
          <div className="flex gap-2">
            <button
              onClick={() => {
                onCommentTypeChange('personal')
                setShowGroupDropdown(false)
              }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                commentType === 'personal'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Личные
            </button>
            <div className="flex-1 relative" ref={dropdownRef}>
              <button
                onClick={() => {
                  if (commentType === 'group' && readingGroupId) {
                    setShowGroupDropdown(!showGroupDropdown)
                  } else {
                    setShowGroupDropdown(!showGroupDropdown)
                  }
                }}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  commentType === 'group'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <HiUserGroup size={16} />
                <span>Групповые</span>
                <IoChevronDown size={14} />
              </button>

              {showGroupDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                  {userGroupsLoading ? (
                    <div className="flex justify-center items-center p-4">
                      <SmallSpinner />
                    </div>
                  ) : userGroups && userGroups.length > 0 ? (
                    <div className="py-1">
                      {userGroups.map((group) => (
                        <button
                          key={group.id}
                          onClick={() => {
                            onSelectGroup(group)
                            setShowGroupDropdown(false)
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                            selectedGroup?.id === group.id
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {group.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                      Вы не являетесь участником ни одной группы
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-2 text-sm text-gray-500 dark:text-gray-400">
            Войдите, чтобы просматривать и добавлять комментарии
          </div>
        )}
      </div>

      {showCommentForm && (
        <div className="px-4 py-4 bg-white dark:bg-[#141624] border-b dark:border-gray-700">
          <div className="bg-white dark:bg-[#1F2136] rounded-lg border border-gray-300 dark:border-gray-600">
            <div className="px-4 py-3 border-b dark:border-gray-700">
              <h3 className="text-md font-semibold text-gray-800 dark:text-white">
                {editingComment ? 'Редактировать комментарий' : `Добавить ${commentType === 'personal' ? 'личный комментарий' : 'групповой комментарий'}`}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              {formError && (
                <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
                  <p className="text-xs text-red-800 dark:text-red-300">
                    {formError}
                  </p>
                </div>
              )}

              {selectedText && !editingComment && (
                <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Выделенный текст:
                  </p>
                  <p className="text-xs text-gray-800 dark:text-gray-200 italic line-clamp-3">
                    "{selectedText}"
                  </p>
                </div>
              )}

              <div className="mb-3">
                <label
                  htmlFor="comment"
                  className="block text-s font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Ваш комментарий
                </label>
                <textarea
                  id="comment"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 resize-none text-sm"
                  rows="3"
                  placeholder="Напишите ваш комментарий здесь..."
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Цвет выделения
                </label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setHighlightColor(color.value)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
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

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={onCancelComment}
                  className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  disabled={isSubmitting}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={isSubmitting || !commentText.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <SmallSpinner />
                      <span>Сохранение...</span>
                    </>
                  ) : (
                    <span>{editingComment ? 'Обновить' : 'Добавить'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4" ref={commentsListRef}>
        {isLoading && (
          <div className="flex justify-center items-center h-32">
            <SmallSpinner />
          </div>
        )}

        {error && !isLoading && (
          <div className="text-center py-8">
            <p className="text-red-500 dark:text-red-400 mb-2">
              Не удалось загрузить комментарии.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
          </div>
        )}

        {!isLoading && !error && comments && comments.length === 0 && !showCommentForm && (
          <div className="text-center py-12">
            <BiMessageSquareDetail
              size={48}
              className="mx-auto text-gray-300 dark:text-gray-600 mb-3"
            />
            <p className="text-gray-500 dark:text-gray-400 mb-1">
              Ещё нет {' '}
              {commentType === 'personal' ? 'личных заметок' : 'групповых комментариев'}{''}
              .
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {commentType === 'personal'
                ? 'Выберите текст и оставьте комментарий для.'
                : 'Выберите текст и оставьте комментарий, чтобы начать обсуждение.'}
            </p>
          </div>
        )}

        {!isLoading && !error && comments && comments.length > 0 && (
          <div>
            {comments.map((comment) => (
              <div key={comment.id} ref={(el) => commentRefs.current[comment.id] = el}>
                <CommentCard
                  comment={comment}
                  currentUser={currentUser}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onJumpTo={onJumpTo}
                  isActive={activeCommentId === comment.id}
                  isGroupComment={commentType === 'group'}
                  bookSlug={bookSlug}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {!isLoading && !error && comments && comments.length > 0 && (
        <div className="border-t dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-[#0F1117]">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {commentType === 'personal'
              ? 'Ваши личные комментарии - видны только вам.'
              : 'Комментарии группы - видны всем участникам выбранной группы.'}
          </p>
        </div>
      )}
    </div>
  )
}

export default CommentsSidebar
