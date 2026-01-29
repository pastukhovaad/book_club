import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ReactReader } from 'react-reader';
import { useQuery } from '@tanstack/react-query';
import { getBook, getBookChaptersList, getUsername } from '@/services/apiBook';

import SmallSpinner from '@/ui_components/SmallSpinner';
import CommentButton from '@/ui_components/CommentButton';
import CommentForm from '@/ui_components/CommentForm';
import CommentsSidebar from '@/ui_components/CommentsSidebar';
import TableOfContents from '@/ui_components/TableOfContents';

import useBookComments from '@/hooks/useBookComments';
import useEpubReader from '@/hooks/useEpubReader';
import useTextSelection from '@/hooks/useTextSelection';
import useHighlights from '@/hooks/useHighlights';

import { toast } from 'react-toastify';
import { IoHomeOutline } from 'react-icons/io5';
import { FiChevronLeft, FiChevronRight, FiList } from 'react-icons/fi';
import { AiOutlinePlus, AiOutlineMinus } from 'react-icons/ai';
import { BiMessageSquareDetail } from 'react-icons/bi';

const EpubReaderPage = () => {
  const { slug } = useParams();
  const [showCommentsSidebar, setShowCommentsSidebar] = useState(true);
  const prevSidebarVisibilityRef = useRef(true);

  // Check if user has a token (basic auth check)
  const hasToken = !!localStorage.getItem('access');

  // Fetch book data
  const {
    data: book,
    isLoading: bookLoading,
    error: bookError,
  } = useQuery({
    queryKey: ['book', slug],
    queryFn: () => getBook(slug),
  });

  // Fetch chapters list
  const { data: chaptersData } = useQuery({
    queryKey: ['bookChapters', slug],
    queryFn: () => getBookChaptersList(slug),
    enabled: !!book && book.content_type === 'epub',
  });

  // Fetch current user (only if has token)
  const { data: userData, error: userError } = useQuery({
    queryKey: ['username'],
    queryFn: getUsername,
    enabled: hasToken,
    retry: false,
  });

  // Show warning if user data fails to load (only if has token)
  useEffect(() => {
    if (hasToken && userError) {
      toast.warn('Could not load user data. Some features may be limited.');
    }
  }, [hasToken, userError]);

  // Custom hooks
  const {
    location,
    setLocation,
    fontSize,
    showToc,
    rendition,
    tocFromEpub,
    increaseFontSize,
    decreaseFontSize,
    goToPrevPage,
    goToNextPage,
    handleChapterClick,
    handleJumpToLocation,
    toggleToc,
    handleGetRendition,
    handleTocChanged,
    setShowToc,
  } = useEpubReader();

  const {
    comments,
    commentsLoading,
    commentsError,
    commentType,
    selectedGroup,
    editingComment,
    showCommentForm,
    readingGroupId,
    userGroups,
    userGroupsLoading,
    isSubmitting,
    isAuthenticated: isAuth,
    handleSubmitComment,
    handleEditComment,
    handleDeleteComment,
    handleOpenCommentForm,
    handleCloseCommentForm,
    handleSelectGroup,
    handleCommentTypeChange,
  } = useBookComments(slug, hasToken);

  const {
    showCommentButton,
    commentButtonPosition,
    selectedTextData,
    clearSelection,
  } = useTextSelection(rendition);

  // Handle highlight click - scroll to comment in sidebar
  const handleHighlightClick = useCallback(() => {
    setShowCommentsSidebar(true);
  }, []);

  const { activeCommentId } = useHighlights(rendition, comments, handleHighlightClick);

  // Log highlights state for debugging
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('EpubReaderPage: Rendition ready, comments count:', comments?.length || 0);
    }
  }, [rendition, comments]);

  // Handle sidebar visibility changes - resize reader
  useEffect(() => {
    if (rendition && import.meta.env.DEV) {
      console.log('Sidebar visibility changed, resizing reader');
    }
    
    // Only resize if visibility actually changed (not on initial render)
    if (rendition && prevSidebarVisibilityRef.current !== showCommentsSidebar) {
      // Small delay to let CSS transitions complete
      setTimeout(() => {
        rendition.resize();
      }, 300);
    }
    
    // Update ref for next comparison
    prevSidebarVisibilityRef.current = showCommentsSidebar;
  }, [showCommentsSidebar, rendition]);

  // Wrapper for submit that clears selection after success
  const onSubmitComment = useCallback(
    (formData) => {
      handleSubmitComment(formData, selectedTextData, clearSelection);
    },
    [handleSubmitComment, selectedTextData, clearSelection]
  );

  // Loading state
  if (bookLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <SmallSpinner />
      </div>
    );
  }

  // Error states
  if (bookError || !book) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">Error loading book</p>
      </div>
    );
  }

  if (book.content_type !== 'epub') {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">This book is not in EPUB format</p>
      </div>
    );
  }

  if (!book.epub_file) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">EPUB file not found</p>
      </div>
    );
  }

  const epubUrl = book.epub_file.startsWith('http')
    ? book.epub_file
    : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${book.epub_file}`;

  return (
    <div className="flex flex-col h-screen bg-[#FFFFFF] dark:bg-[#181A2A] text-[#181A2A] dark:text-[#FFFFFF]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#FFFFFF] dark:bg-[#141624] border-b border-[#E8E8EA] dark:border-[#242535]">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-[#3B3C4A] dark:text-[#BABABF] hover:text-[#4B6BFB] dark:hover:text-[#4B6BFB]"
            >
              <IoHomeOutline size={24} />
            </Link>
            <h1 className="text-xl font-semibold text-[#181A2A] dark:text-[#FFFFFF] truncate max-w-md">
              {book.title}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Font size controls */}
            <div className="flex items-center gap-2 border border-[#E8E8EA] dark:border-[#242535] rounded-lg px-3 py-1 bg-[#FFFFFF] dark:bg-[#1F2136]">
              <button
                onClick={decreaseFontSize}
                className="text-[#3B3C4A] dark:text-[#BABABF] hover:text-[#4B6BFB] dark:hover:text-[#4B6BFB]"
                title="Decrease font size"
              >
                <AiOutlineMinus size={18} />
              </button>
              <span className="text-sm text-[#3B3C4A] dark:text-[#BABABF] min-w-[3rem] text-center">
                {fontSize}%
              </span>
              <button
                onClick={increaseFontSize}
                className="text-[#3B3C4A] dark:text-[#BABABF] hover:text-[#4B6BFB] dark:hover:text-[#4B6BFB]"
                title="Increase font size"
              >
                <AiOutlinePlus size={18} />
              </button>
            </div>

            {/* Comments toggle */}
            <button
              onClick={() => setShowCommentsSidebar((prev) => !prev)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showCommentsSidebar
                  ? 'bg-[#4B6BFB] text-white hover:bg-[#3554D1]'
                  : 'bg-[#F6F6F7] dark:bg-[#1F2136] text-[#3B3C4A] dark:text-[#BABABF] hover:bg-[#E8E8EA] dark:hover:bg-[#242535]'
              }`}
              title="Toggle comments"
            >
              <BiMessageSquareDetail size={20} />
              <span className="max-sm:hidden">Comments</span>
              {comments && comments.length > 0 && (
                <span className="bg-[#FFFFFF] dark:bg-[#181A2A] text-[#4B6BFB] text-xs font-semibold px-2 py-0.5 rounded-full border border-[#E8E8EA] dark:border-[#242535]">
                  {comments.length}
                </span>
              )}
            </button>

            {/* TOC toggle */}
            <button
              onClick={toggleToc}
              className="flex items-center gap-2 px-4 py-2 bg-[#4B6BFB] text-white rounded-lg hover:bg-[#3554D1] dark:hover:bg-[#3554D1] transition-colors"
            >
              <FiList size={20} />
              <span className="max-sm:hidden">Chapters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reader Container */}
        <div className="flex-1 relative flex overflow-hidden">
        {/* Reader */}
        <div className="flex-1 overflow-hidden min-h-0">
          <ReactReader
            url={epubUrl}
            location={location}
            locationChanged={setLocation}
            getRendition={handleGetRendition}
            epubOptions={{
              flow: 'paginated',
              manager: 'default',
            }}
            tocChanged={handleTocChanged}
            showToc={false}
            styles={{
              container: {
                height: '100%',
                overflow: 'hidden',
              },
            }}
          />
        </div>

        {/* Comments Sidebar */}
        {showCommentsSidebar && (
          <CommentsSidebar
            comments={comments}
            currentUser={userData?.username}
            isLoading={commentsLoading}
            error={commentsError?.message}
            onClose={() => setShowCommentsSidebar(false)}
            onEdit={handleEditComment}
            onDelete={handleDeleteComment}
            onJumpTo={handleJumpToLocation}
            activeCommentId={activeCommentId}
            commentType={commentType}
            onCommentTypeChange={handleCommentTypeChange}
            readingGroupId={readingGroupId}
            userGroups={userGroups}
            userGroupsLoading={userGroupsLoading}
            onSelectGroup={handleSelectGroup}
            selectedGroup={selectedGroup}
            bookSlug={slug}
            isAuthenticated={isAuth}
          />
        )}

        {/* Table of Contents Sidebar */}
        <TableOfContents
          tocItems={tocFromEpub}
          chaptersData={chaptersData}
          onChapterClick={handleChapterClick}
          onClose={() => setShowToc(false)}
          isOpen={showToc}
        />

        {/* Navigation buttons */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
          <button
            onClick={goToPrevPage}
            className="bg-[#FFFFFF] dark:bg-[#1F2136] border border-[#E8E8EA] dark:border-[#242535] shadow-md rounded-full p-3 hover:bg-[#F6F6F7] dark:hover:bg-[#242535] transition-colors"
            title="Previous page"
          >
            <FiChevronLeft size={24} className="text-[#3B3C4A] dark:text-[#BABABF]" />
          </button>
          <button
            onClick={goToNextPage}
            className="bg-[#FFFFFF] dark:bg-[#1F2136] border border-[#E8E8EA] dark:border-[#242535] shadow-md rounded-full p-3 hover:bg-[#F6F6F7] dark:hover:bg-[#242535] transition-colors"
            title="Next page"
          >
            <FiChevronRight size={24} className="text-[#3B3C4A] dark:text-[#BABABF]" />
          </button>
        </div>
      </div>

      {/* Chapter info */}
      {chaptersData && (
        <div className="px-6 py-2 bg-[#F6F6F7] dark:bg-[#141624] border-t border-[#E8E8EA] dark:border-[#242535]">
          <p className="text-sm text-[#3B3C4A] dark:text-[#BABABF] text-center">
            {chaptersData.chapters?.length || 0} chapters available
          </p>
        </div>
      )}

      {/* Floating Comment Button (only for authenticated users) */}
      {isAuth && (
        <CommentButton
          position={commentButtonPosition}
          onClick={handleOpenCommentForm}
          visible={showCommentButton}
        />
      )}

      {/* Comment Form Modal (only for authenticated users) */}
      {isAuth && showCommentForm && (
        <CommentForm
          selectedText={editingComment ? null : selectedTextData?.text}
          onSubmit={onSubmitComment}
          onCancel={handleCloseCommentForm}
          initialComment={editingComment?.comment_text || ''}
          isEditing={!!editingComment}
          isSubmitting={isSubmitting}
          commentType={commentType}
        />
      )}
    </div>
  );
};

export default EpubReaderPage;
