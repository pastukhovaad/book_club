import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getBook,
  getUsername,
  getReadingProgress,
  updateReadingProgress,
} from '@/services/apiBook'
import SmallSpinner from '@/ui_components/SmallSpinner'
import CommentButton from '@/ui_components/CommentButton'
import CommentForm from '@/ui_components/CommentForm'
import CommentsSidebar from '@/ui_components/CommentsSidebar'
import useBookComments from '@/hooks/useBookComments'
import EpubReaderPage from './EpubReaderPage'

import { IoHomeOutline } from 'react-icons/io5'
import { AiOutlinePlus, AiOutlineMinus } from 'react-icons/ai'
import { BiMessageSquareDetail } from 'react-icons/bi'
import { FiCheckCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

const BookPagesPage = ({ isAuthenticated }) => {
  const { slug } = useParams()
  const queryClient = useQueryClient()
  const textRef = useRef(null)

  const hasToken = !!localStorage.getItem('access')
  const isAuth = typeof isAuthenticated === 'boolean' ? isAuthenticated : hasToken

  const [showCommentsSidebar, setShowCommentsSidebar] = useState(true)
  const [fontSize, setFontSize] = useState(100)
  const [currentPage, setCurrentPage] = useState(1)
  const [showCommentButton, setShowCommentButton] = useState(false)
  const [commentButtonPosition, setCommentButtonPosition] = useState({ x: 0, y: 0 })
  const [selectedTextData, setSelectedTextData] = useState(null)

  const {
    data: book,
    isLoading: bookLoading,
    error: bookError,
  } = useQuery({
    queryKey: ['book', slug],
    queryFn: () => getBook(slug),
  })

  const { data: userData } = useQuery({
    queryKey: ['username'],
    queryFn: getUsername,
    enabled: isAuth,
    retry: false,
  })

  const { data: readingProgressData } = useQuery({
    queryKey: ['readingProgress', slug],
    queryFn: () => getReadingProgress(slug),
    enabled: isAuth && !!book,
    retry: false,
  })

  const updateProgressMutation = useMutation({
    mutationFn: (data) => updateReadingProgress(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['readingProgress', slug])
      queryClient.invalidateQueries(['myQuests'])
    },
  })

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
    handleSubmitComment,
    handleEditComment,
    handleDeleteComment,
    handleOpenCommentForm,
    handleCloseCommentForm,
    handleSelectGroup,
    handleCommentTypeChange,
  } = useBookComments(slug, isAuth)

  useEffect(() => {
    if (readingProgressData?.current_page && readingProgressData.current_page > 1) {
      setCurrentPage(readingProgressData.current_page)
    }
  }, [readingProgressData])

  const { totalPages, currentText } = useMemo(() => {
    if (!book?.content) {
      return { totalPages: 1, currentText: '' }
    }

    const linesPerPage = 18
    const symbolsPerLine = 75

    const wrappedLines = book.content.split('\n').flatMap((paragraph) => {
      if (!paragraph.trim()) return ['']
      const words = paragraph.split(' ')
      const result = []
      let currentLine = ''
      words.forEach((word) => {
        if (currentLine.length + word.length + 1 > symbolsPerLine) {
          result.push(currentLine)
          currentLine = word
        } else {
          currentLine += (currentLine.length ? ' ' : '') + word
        }
      })
      if (currentLine) result.push(currentLine)
      return result
    })

    const pages = Math.max(1, Math.ceil(wrappedLines.length / linesPerPage))
    const pageLines = wrappedLines.slice(
      (currentPage - 1) * linesPerPage,
      currentPage * linesPerPage,
    )

    return {
      totalPages: pages,
      currentText: pageLines.join('\n').replace(/\n{2,}/g, '\n'),
    }
  }, [book?.content, currentPage])

  const highlightedContent = useMemo(() => {
    if (!currentText || !comments || comments.length === 0) return currentText

    const toRgba = (color, alpha = 0.35) => {
      if (!color) return `rgba(255, 255, 0, ${alpha})`
      if (color.startsWith('rgba')) return color
      if (color.startsWith('rgb')) {
        return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`)
      }
      if (color.startsWith('#') && color.length === 7) {
        const r = parseInt(color.slice(1, 3), 16)
        const g = parseInt(color.slice(3, 5), 16)
        const b = parseInt(color.slice(5, 7), 16)
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
      }
      return `rgba(255, 255, 0, ${alpha})`
    }

    const matches = []

    comments.forEach((comment) => {
      const selected = comment?.selected_text
      if (!selected) return

      let startIndex = 0
      while (startIndex < currentText.length) {
        const idx = currentText.indexOf(selected, startIndex)
        if (idx === -1) break
        matches.push({
          start: idx,
          end: idx + selected.length,
          color: comment.highlight_color || '#FFFF00',
          id: comment.id,
        })
        startIndex = idx + selected.length
      }
    })

    if (matches.length === 0) return currentText

    matches.sort((a, b) => a.start - b.start)

    const filtered = []
    let lastEnd = 0
    matches.forEach((match) => {
      if (match.start >= lastEnd) {
        filtered.push(match)
        lastEnd = match.end
      }
    })

    const result = []
    let cursor = 0
    filtered.forEach((match, index) => {
      if (cursor < match.start) {
        result.push(currentText.slice(cursor, match.start))
      }
      result.push(
        <mark
          key={`${match.id}-${index}`}
          className="px-0.5"
          style={{ backgroundColor: toRgba(match.color) }}
        >
          {currentText.slice(match.start, match.end)}
        </mark>
      )
      cursor = match.end
    })

    if (cursor < currentText.length) {
      result.push(currentText.slice(cursor))
    }

    return result
  }, [currentText, comments])

  useEffect(() => {
    if (!isAuth || !book?.content) return

    const timer = setTimeout(() => {
      updateProgressMutation.mutate({
        current_page: currentPage,
        total_pages: totalPages,
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [currentPage, totalPages, book?.content, isAuth, updateProgressMutation])

  const clearSelection = useCallback(() => {
    setSelectedTextData(null)
    setShowCommentButton(false)
    const selection = window.getSelection()
    if (selection) selection.removeAllRanges()
  }, [])

  const handleMouseUp = useCallback(() => {
    if (!isAuth) return

    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      setShowCommentButton(false)
      return
    }

    const text = selection.toString().trim()
    if (!text) return

    const range = selection.getRangeAt(0)
    if (textRef.current && !textRef.current.contains(range.commonAncestorContainer)) {
      return
    }

    const rect = range.getBoundingClientRect()
    setCommentButtonPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + window.scrollY,
    })

    setSelectedTextData({
      cfiRange: null,
      text,
    })
    setShowCommentButton(true)
  }, [isAuth])

  const onSubmitComment = useCallback(
    (formData) => {
      handleSubmitComment(formData, selectedTextData, clearSelection)
    },
    [handleSubmitComment, selectedTextData, clearSelection],
  )

  if (bookLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <SmallSpinner />
      </div>
    )
  }

  if (bookError || !book) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">Error loading book</p>
      </div>
    )
  }

  if (book.content_type === 'epub') {
    return <EpubReaderPage />
  }

  if (!book.content) {
    return (
      <div className="padding-dx max-container py-9">
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <p className="text-xl text-gray-600 dark:text-gray-400">
            This book has no content available.
          </p>
          <Link to={`/books/${slug}`} className="mt-4 text-blue-600 hover:underline">
            Back to book details
          </Link>
        </div>
      </div>
    )
  }

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
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-[#181A2A] dark:text-[#FFFFFF] truncate max-w-md">
                {book.title}
              </h1>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#E8E8EA] dark:bg-[#242535] text-[#3B3C4A] dark:text-[#BABABF]">
                Текстовый файл
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Font size controls */}
            <div className="flex items-center gap-2 border border-[#E8E8EA] dark:border-[#242535] rounded-lg px-3 py-1 bg-[#FFFFFF] dark:bg-[#1F2136]">
              <button
                onClick={() => setFontSize((prev) => Math.max(80, prev - 10))}
                className="text-[#3B3C4A] dark:text-[#BABABF] hover:text-[#4B6BFB] dark:hover:text-[#4B6BFB]"
                title="Decrease font size"
              >
                <AiOutlineMinus size={18} />
              </button>
              <span className="text-sm text-[#3B3C4A] dark:text-[#BABABF] min-w-[3rem] text-center">
                {fontSize}%
              </span>
              <button
                onClick={() => setFontSize((prev) => Math.min(160, prev + 10))}
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

            {/* Completed indicator */}
            {readingProgressData?.is_completed && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg border border-green-300 dark:border-green-700">
                <FiCheckCircle size={20} />
                <span className="max-sm:hidden font-medium">Прочитано</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reader Container */}
      <div className="flex-1 relative flex overflow-hidden">
        <div className="flex-1 overflow-hidden min-h-0">
          <div
            className="h-full overflow-y-auto px-6 py-6"
            onMouseUp={handleMouseUp}
          >
            <pre
              ref={textRef}
              className="whitespace-pre-wrap leading-relaxed text-[#181A2A] dark:text-[#FFFFFF]"
              style={{
                fontSize: `${fontSize}%`,
                columnCount: 2,
                columnGap: '2.5rem',
                columnFill: 'auto',
                height: '100%',
              }}
            >
              {highlightedContent}
            </pre>
          </div>
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
            onJumpTo={() => {}}
            activeCommentId={null}
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

        {/* Navigation buttons */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="bg-[#FFFFFF] dark:bg-[#1F2136] border border-[#E8E8EA] dark:border-[#242535] shadow-md rounded-full p-3 hover:bg-[#F6F6F7] dark:hover:bg-[#242535] transition-colors disabled:opacity-50"
            title="Предыдущая страница"
          >
            <FiChevronLeft size={24} className="text-[#3B3C4A] dark:text-[#BABABF]" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="bg-[#FFFFFF] dark:bg-[#1F2136] border border-[#E8E8EA] dark:border-[#242535] shadow-md rounded-full p-3 hover:bg-[#F6F6F7] dark:hover:bg-[#242535] transition-colors disabled:opacity-50"
            title="Следующая страница"
          >
            <FiChevronRight size={24} className="text-[#3B3C4A] dark:text-[#BABABF]" />
          </button>
        </div>
      </div>

      <CommentButton
        position={commentButtonPosition}
        onClick={() => {
          handleOpenCommentForm()
          setShowCommentButton(false)
        }}
        visible={showCommentButton && isAuth}
      />

      {showCommentForm && (
        <CommentForm
          selectedText={selectedTextData?.text || editingComment?.selected_text}
          onSubmit={onSubmitComment}
          onCancel={handleCloseCommentForm}
          initialComment={editingComment?.comment_text || ''}
          isEditing={!!editingComment}
          isSubmitting={isSubmitting}
          commentType={commentType}
        />
      )}
    </div>
  )
}

export default BookPagesPage
