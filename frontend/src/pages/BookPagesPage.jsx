import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getBook,
  getUsername,
  getReadingProgress,
  updateReadingProgress,
} from '@/services'
import SmallSpinner from '@/ui_components/SmallSpinner'
import CommentButton from '@/ui_components/CommentButton'
import CommentsSidebar from '@/ui_components/CommentsSidebar'
import useBookComments from '@/hooks/useBookComments'
import useDynamicPagination from '@/hooks/useDynamicPagination'
import EpubReaderPage from './EpubReaderPage'

import { useTheme } from '@/context/ThemeContext'
import { IoHomeOutline } from 'react-icons/io5'
import { AiOutlinePlus, AiOutlineMinus } from 'react-icons/ai'
import { BiMessageSquareDetail } from 'react-icons/bi'
import { FiCheckCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { HiMoon, HiSun } from 'react-icons/hi'

const normalizeWhitespace = (str) => str.replace(/\s+/g, ' ').trim()

const findTextInContent = (content, targetText, startFrom = 0) => {
  if (!content || !targetText) return null

  const exactIndex = content.indexOf(targetText, startFrom)
  if (exactIndex !== -1) {
    return { start: exactIndex, end: exactIndex + targetText.length }
  }

  const normalizedTarget = normalizeWhitespace(targetText)
  if (!normalizedTarget) return null

  const originalPositions = []
  let inWhitespace = false

  for (let i = startFrom; i < content.length; i++) {
    const char = content[i]
    const isWs = /\s/.test(char)

    if (isWs) {
      if (!inWhitespace) {
        originalPositions.push(i)
        inWhitespace = true
      }
    } else {
      originalPositions.push(i)
      inWhitespace = false
    }
  }

  const normalizedContent = normalizeWhitespace(content.slice(startFrom))
  const normalizedIndex = normalizedContent.indexOf(normalizedTarget)

  if (normalizedIndex === -1) return null

  const originalStart = originalPositions[normalizedIndex]
  const normalizedEnd = normalizedIndex + normalizedTarget.length
  
  let originalEnd
  if (normalizedEnd >= originalPositions.length) {
    originalEnd = content.length
  } else {
    originalEnd = originalPositions[normalizedEnd]
  }

  if (originalEnd > originalStart) {
    return { start: originalStart, end: originalEnd }
  }

  return null
}

const BookPagesPage = ({ isAuthenticated }) => {
  const { slug } = useParams()
  const queryClient = useQueryClient()
  const textRef = useRef(null)
  const containerRef = useRef(null)

  const hasToken = !!localStorage.getItem('access')
  const isAuth = typeof isAuthenticated === 'boolean' ? isAuthenticated : hasToken

  const [showCommentsSidebar, setShowCommentsSidebar] = useState(true)
  const [fontSize, setFontSize] = useState(100)
  const [fontFamily, setFontFamily] = useState('serif')
  const [showCommentButton, setShowCommentButton] = useState(false)
  const [commentButtonPosition, setCommentButtonPosition] = useState({ x: 0, y: 0 })
  const [selectedTextData, setSelectedTextData] = useState(null)
  const [activeCommentId, setActiveCommentId] = useState(null)

  const { darkMode, toggleDarkMode } = useTheme()

  const {
    data: book,
    isLoading: bookLoading,
    error: bookError,
  } = useQuery({
    queryKey: ['book', slug],
    queryFn: () => getBook(slug),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const { data: userData } = useQuery({
    queryKey: ['username'],
    queryFn: getUsername,
    enabled: isAuth,
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const { data: readingProgressData } = useQuery({
    queryKey: ['readingProgress', slug],
    queryFn: () => getReadingProgress(slug),
    enabled: isAuth && !!book,
    retry: false,
    staleTime: 1000 * 60,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const updateProgressMutation = useMutation({
    mutationFn: (data) => updateReadingProgress(slug, data),
    onSuccess: (responseData) => {
      if (responseData) {
        queryClient.setQueryData(['readingProgress', slug], responseData)
      }
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
    formError,
    handleSubmitComment,
    handleEditComment,
    handleDeleteComment,
    handleOpenCommentForm,
    handleCloseCommentForm,
    handleSelectGroup,
    handleCommentTypeChange,
  } = useBookComments(slug, isAuth)

  const {
    currentPage,
    totalPages,
    characterOffset,
    currentText,
    goToPage,
    goToPrevPage,
    goToNextPage,
    restorePosition,
    debouncedRecalculate,
  } = useDynamicPagination({
    content: book?.content,
    containerRef,
    textRef,
    fontSize,
    columnCount: 2,
    columnGap: 40,
    initialCharacterOffset: 0,
  })

  const hasRestoredPosition = useRef(false)
  useEffect(() => {
    if (hasRestoredPosition.current || !readingProgressData) return

    if (readingProgressData.character_offset > 0) {
      restorePosition(readingProgressData.character_offset)
      hasRestoredPosition.current = true
    }
  }, [readingProgressData, restorePosition])

  useEffect(() => {
    const timer = setTimeout(debouncedRecalculate, 300)
    return () => clearTimeout(timer)
  }, [showCommentsSidebar, debouncedRecalculate])

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

      const match = findTextInContent(currentText, selected, 0)
      if (match) {
        matches.push({
          start: match.start,
          end: match.end,
          color: comment.highlight_color || '#FFFF00',
          id: comment.id,
        })
      }
    })

    if (matches.length === 0) return currentText

    matches.sort((a, b) => a.start - b.start)

    const segments = []
    const events = []

    matches.forEach((match) => {
      events.push({ pos: match.start, type: 'start', match })
      events.push({ pos: match.end, type: 'end', match })
    })

    events.sort((a, b) => {
      if (a.pos !== b.pos) return a.pos - b.pos
      return a.type === 'start' ? -1 : 1
    })

    let currentPos = 0
    const activeMatches = []

    events.forEach((event) => {
      if (event.pos > currentPos && activeMatches.length === 0) {
        segments.push({
          start: currentPos,
          end: event.pos,
          matches: [],
        })
      } else if (event.pos > currentPos && activeMatches.length > 0) {
        segments.push({
          start: currentPos,
          end: event.pos,
          matches: [...activeMatches],
        })
      }

      if (event.type === 'start') {
        activeMatches.push(event.match)
      } else {
        const index = activeMatches.findIndex((m) => m.id === event.match.id)
        if (index !== -1) activeMatches.splice(index, 1)
      }

      currentPos = event.pos
    })

    if (currentPos < currentText.length) {
      segments.push({
        start: currentPos,
        end: currentText.length,
        matches: [],
      })
    }

    const result = []
    segments.forEach((segment, segmentIndex) => {
      const text = currentText.slice(segment.start, segment.end)
      if (!text) return

      if (segment.matches.length === 0) {
        result.push(text)
      } else {
        const primaryMatch = segment.matches[0]
        const backgroundColor = segment.matches.length > 1
          ? toRgba(primaryMatch.color, 0.5)
          : toRgba(primaryMatch.color, 0.35)

        result.push(
          <mark
            key={`${segment.start}-${segmentIndex}`}
            className="px-0 cursor-pointer hover:opacity-80 transition-opacity"
            style={{
              backgroundColor,
              fontFamily: 'inherit',
              fontSize: 'inherit',
            }}
            onClick={(e) => {
              e.stopPropagation()
              setActiveCommentId(primaryMatch.id)
              setShowCommentsSidebar(true)
            }}
            title={segment.matches.length > 1 ? `${segment.matches.length} комментариев` : undefined}
          >
            {text}
          </mark>
        )
      }
    })

    return result
  }, [currentText, comments])

  const lastProgressRef = useRef({ charOffset: null })

  useEffect(() => {
    if (!isAuth || !book?.content) return

    const readUpTo =
      currentPage >= totalPages
        ? book.content.length
        : Math.min(characterOffset + (currentText?.length || 0), book.content.length)

    if (lastProgressRef.current.charOffset === readUpTo) return

    const timer = setTimeout(() => {
      updateProgressMutation.mutate({
        character_offset: readUpTo,
      })
      lastProgressRef.current = { charOffset: readUpTo }
    }, 2000)

    return () => clearTimeout(timer)
  }, [characterOffset, currentPage, totalPages, currentText, book?.content, isAuth, updateProgressMutation])

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

  const handleJumpToText = useCallback(
    (targetText) => {
      if (!targetText || !book?.content) return

      const match = findTextInContent(book.content, targetText, 0)
      if (match) {
        restorePosition(match.start)
      }
    },
    [book?.content, restorePosition],
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
        <p className="text-red-500">Ошибка при загрузке книги.</p>
      </div>
    )
  }

  if (book.content_type === 'epub') {
    return <EpubReaderPage />
  }

  if (!book.content) {
    return (
      <p className="text-xl text-gray-600 dark:text-gray-400">
        Ошибка при загрузке контента книги.
      </p>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-[#FFFFFF] dark:bg-[#181A2A] text-[#181A2A] dark:text-[#FFFFFF]">
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
            <div className="flex items-center gap-2 border border-[#E8E8EA] dark:border-[#242535] rounded-lg px-3 py-1 bg-[#FFFFFF] dark:bg-[#1F2136]">
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="text-sm bg-transparent text-[#3B3C4A] dark:text-[#BABABF] outline-none"
              >
                <option value="sans-serif">Sans</option>
                <option value="monospace">Mono</option>
                <option value="georgia">Georgia</option>
                <option value="times">Times</option>
              </select>
            </div>
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

            <button
              onClick={toggleDarkMode}
              className="flex items-center gap-2 px-3 py-2 border border-[#E8E8EA] dark:border-[#242535] rounded-lg bg-[#FFFFFF] dark:bg-[#1F2136] text-[#3B3C4A] dark:text-[#BABABF] hover:text-[#4B6BFB] dark:hover:text-[#4B6BFB] transition-colors"
              title={darkMode ? "Светлая тема" : "Темная тема"}
            >
              {darkMode ? <HiSun size={20} /> : <HiMoon size={20} />}
            </button>

            <button
              onClick={() => setShowCommentsSidebar((prev) => !prev)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showCommentsSidebar
                  ? 'bg-[#4B6BFB] text-white hover:bg-[#3554D1]'
                  : 'bg-[#F6F6F7] dark:bg-[#1F2136] text-[#3B3C4A] dark:text-[#BABABF] hover:bg-[#E8E8EA] dark:hover:bg-[#242535]'
              }`}
              title="Переключить комментарии"
            >
              <BiMessageSquareDetail size={20} />
              <span className="max-sm:hidden">Комментарии</span>
              {comments && comments.length > 0 && (
                <span className="bg-[#FFFFFF] dark:bg-[#181A2A] text-[#4B6BFB] text-xs font-semibold px-2 py-0.5 rounded-full border border-[#E8E8EA] dark:border-[#242535]">
                  {comments.length}
                </span>
              )}
            </button>

            {readingProgressData?.is_completed && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg border border-green-300 dark:border-green-700">
                <FiCheckCircle size={20} />
                <span className="max-sm:hidden font-medium">Прочитано</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 relative flex overflow-hidden">
        <div ref={containerRef} className="flex-1 overflow-hidden min-h-0">
          <div
            className="h-full overflow-y-auto px-6 py-6"
            onMouseUp={handleMouseUp}
          >
            <pre
              ref={textRef}
              className="whitespace-pre-wrap leading-relaxed text-[#181A2A] dark:text-[#FFFFFF]"
              style={{
                fontSize: `${fontSize}%`,
                fontFamily:
                  fontFamily === 'georgia'
                    ? 'Georgia, serif'
                    : fontFamily === 'times'
                      ? '"Times New Roman", Times, serif'
                      : fontFamily,
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

        {showCommentsSidebar && (
          <CommentsSidebar
            comments={comments}
            currentUser={userData?.username}
            isLoading={commentsLoading}
            error={commentsError?.message}
            onClose={() => setShowCommentsSidebar(false)}
            onEdit={handleEditComment}
            onDelete={handleDeleteComment}
            onJumpTo={handleJumpToText}
            activeCommentId={activeCommentId}
            onClearActiveComment={() => setActiveCommentId(null)}
            commentType={commentType}
            onCommentTypeChange={handleCommentTypeChange}
            readingGroupId={readingGroupId}
            userGroups={userGroups}
            userGroupsLoading={userGroupsLoading}
            onSelectGroup={handleSelectGroup}
            selectedGroup={selectedGroup}
            bookSlug={slug}
            isAuthenticated={isAuth}
            showCommentForm={showCommentForm}
            selectedText={selectedTextData?.text || editingComment?.selected_text}
            onSubmitComment={onSubmitComment}
            onCancelComment={handleCloseCommentForm}
            editingComment={editingComment}
            isSubmitting={isSubmitting}
            formError={formError}
          />
        )}

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            className="bg-[#FFFFFF] dark:bg-[#1F2136] border border-[#E8E8EA] dark:border-[#242535] shadow-md rounded-full p-3 hover:bg-[#F6F6F7] dark:hover:bg-[#242535] transition-colors disabled:opacity-50"
            title="Предыдущая страница"
          >
            <FiChevronLeft size={24} className="text-[#3B3C4A] dark:text-[#BABABF]" />
          </button>

          <div className="flex items-center gap-1 bg-[#FFFFFF] dark:bg-[#1F2136] border border-[#E8E8EA] dark:border-[#242535] shadow-md rounded-lg px-3 py-2">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10)
                if (!isNaN(value) && value >= 1 && value <= totalPages) {
                  goToPage(value)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.target.blur()
                }
              }}
              className="w-12 text-center bg-transparent text-[#181A2A] dark:text-[#FFFFFF] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-[#3B3C4A] dark:text-[#BABABF]">/</span>
            <span className="text-[#3B3C4A] dark:text-[#BABABF] min-w-[2rem]">{totalPages}</span>
          </div>

          <button
            onClick={goToNextPage}
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
          setShowCommentsSidebar(true)
        }}
        visible={showCommentButton && isAuth}
      />
    </div>
  )
}

export default BookPagesPage
