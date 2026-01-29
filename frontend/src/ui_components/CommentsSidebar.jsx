import { useState, useRef, useEffect } from 'react';
import { IoCloseOutline, IoChevronDown } from 'react-icons/io5';
import { BiMessageSquareDetail } from 'react-icons/bi';
import { HiUserGroup } from 'react-icons/hi';
import CommentCard from './CommentCard';
import SmallSpinner from './SmallSpinner';

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
  commentType,
  onCommentTypeChange,
  readingGroupId,
  userGroups,
  userGroupsLoading,
  onSelectGroup,
  selectedGroup,
  bookSlug,
  isAuthenticated = true,
}) => {
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowGroupDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <div className="w-96 bg-white dark:bg-[#141624] border-l dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-[#141624] border-b dark:border-gray-700 px-4 py-3 z-10">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <BiMessageSquareDetail size={24} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Comments
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

        {/* Comment Type Toggle (only for authenticated users) */}
        {isAuthenticated ? (
          <div className="flex gap-2">
            <button
              onClick={() => {
                onCommentTypeChange('personal');
                setShowGroupDropdown(false);
              }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                commentType === 'personal'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Personal
            </button>
            <div className="flex-1 relative" ref={dropdownRef}>
              <button
                onClick={() => {
                  if (commentType === 'group' && readingGroupId) {
                    // If already in group mode, toggle dropdown
                    setShowGroupDropdown(!showGroupDropdown);
                  } else {
                    // If in personal mode, show dropdown to select a group
                    setShowGroupDropdown(!showGroupDropdown);
                  }
                }}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  commentType === 'group'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <HiUserGroup size={16} />
                <span>Group</span>
                <IoChevronDown size={14} />
              </button>

              {/* Group Dropdown */}
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
                            onSelectGroup(group);
                            setShowGroupDropdown(false);
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
                      You are not a member of any reading groups
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-2 text-sm text-gray-500 dark:text-gray-400">
            Sign in to view and add comments
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center h-32">
            <SmallSpinner />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-8">
            <p className="text-red-500 dark:text-red-400 mb-2">
              Failed to load comments
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {error}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && comments && comments.length === 0 && (
          <div className="text-center py-12">
            <BiMessageSquareDetail
              size={48}
              className="mx-auto text-gray-300 dark:text-gray-600 mb-3"
            />
            <p className="text-gray-500 dark:text-gray-400 mb-1">
              No {commentType === 'personal' ? 'personal notes' : 'group comments'} yet
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {commentType === 'personal'
                ? 'Select text and add a note for yourself'
                : 'Select text and add a comment to start the discussion'}
            </p>
          </div>
        )}

        {/* Comments List */}
        {!isLoading && !error && comments && comments.length > 0 && (
          <div>
            {comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                currentUser={currentUser}
                onEdit={onEdit}
                onDelete={onDelete}
                onJumpTo={onJumpTo}
                isActive={activeCommentId === comment.id}
                isGroupComment={commentType === 'group'}
                bookSlug={bookSlug}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {!isLoading && !error && comments && comments.length > 0 && (
        <div className="border-t dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-[#0F1117]">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {commentType === 'personal'
              ? 'Your personal notes - visible only to you'
              : 'Group comments - visible to all confirmed members'}
          </p>
        </div>
      )}
    </div>
  );
};

export default CommentsSidebar;
