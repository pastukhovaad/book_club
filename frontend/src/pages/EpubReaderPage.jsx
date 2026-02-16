import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ReactReader } from 'react-reader'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBook, getBookChaptersList, getUsername, getReadingProgress, updateReadingProgress } from '@/services'
import { resolveMediaUrl } from '@/api'

import SmallSpinner from '@/ui_components/SmallSpinner'
import CommentButton from '@/ui_components/CommentButton'
import CommentsSidebar from '@/ui_components/CommentsSidebar'
import TableOfContents from '@/ui_components/TableOfContents'

import useBookComments from '@/hooks/useBookComments'
import useEpubReader from '@/hooks/useEpubReader'
import useTextSelection from '@/hooks/useTextSelection'
import useHighlights from '@/hooks/useHighlights'
import { useTheme } from '@/context/ThemeContext'

import { toast } from 'react-toastify'
import { IoHomeOutline } from 'react-icons/io5'
import { FiChevronLeft, FiChevronRight, FiList } from 'react-icons/fi'
import { AiOutlinePlus, AiOutlineMinus } from 'react-icons/ai'
import { BiMessageSquareDetail } from 'react-icons/bi'
import { FiCheckCircle } from 'react-icons/fi'
import { HiMoon, HiSun } from 'react-icons/hi'

const EpubReaderPage = () => {
  const { slug } = useParams()
  const [showCommentsSidebar, setShowCommentsSidebar] = useState(true)
  const prevSidebarVisibilityRef = useRef(true)
  const queryClient = useQueryClient()
  const hasLoadedPosition = useRef(false)
  const currentPercentageRef = useRef(0)
  const locationsReadyRef = useRef(false)
  
  const ignoreLocationChangeUntilRef = useRef(0)
  
  const { darkMode, toggleDarkMode } = useTheme()

  const hasToken = !!localStorage.getItem('access')

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

  const { data: chaptersData } = useQuery({
    queryKey: ['bookChapters', slug],
    queryFn: () => getBookChaptersList(slug),
    enabled: !!book && book.content_type === 'epub',
    staleTime: 1000 * 60 * 5,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const { data: userData, error: userError } = useQuery({
    queryKey: ['username'],
    queryFn: getUsername,
    enabled: hasToken,
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const { data: readingProgressData, isLoading: progressLoading } = useQuery({
    queryKey: ['readingProgress', slug],
    queryFn: () => getReadingProgress(slug),
    enabled: hasToken,
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
    onError: (err) => {
      console.error('Failed to update reading progress:', err)
    },
  })

  const progressUpdateTimerRef = useRef(null)
  const updateProgress = useCallback((newLocation) => {
    if (!hasToken) return

    if (progressUpdateTimerRef.current) {
      clearTimeout(progressUpdateTimerRef.current)
    }

    progressUpdateTimerRef.current = setTimeout(() => {
      const data = { current_cfi: newLocation }
      if (locationsReadyRef.current) {
        data.progress_percent = currentPercentageRef.current
      }

      updateProgressMutation.mutate(data)
    }, 2000)
  }, [hasToken, updateProgressMutation])

  useEffect(() => {
    if (hasToken && userError) {
      toast.warn('Ошибка при загрузке данных пользователя.')
    }
  }, [hasToken, userError])

  const {
    location,
    setLocation: setLocationOriginal,
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
  } = useEpubReader()

  useEffect(() => {
    if (!rendition) return

    const book = rendition.book
    let isSubscribed = true

    const handleRelocated = (location) => {
      if (!locationsReadyRef.current) {
        return
      }

      const percentage = (location?.end?.percentage ?? location?.start?.percentage ?? 0) * 100
      currentPercentageRef.current = Math.min(percentage, 100)

    }

    book.locations.generate(1600).then(() => {
      if (!isSubscribed) return

      locationsReadyRef.current = true

      const currentLocation = rendition.currentLocation()
      if (currentLocation) {
        const percentage = (currentLocation?.end?.percentage ?? currentLocation?.start?.percentage ?? 0) * 100
        currentPercentageRef.current = Math.min(percentage, 100)
      }
    }).catch((err) => {
      console.error('Failed to generate EPUB locations:', err)
    })

    rendition.on('relocated', handleRelocated)
    return () => {
      isSubscribed = false
      locationsReadyRef.current = false
      rendition.off('relocated', handleRelocated)
    }
  }, [rendition])

  const preciseCfiRef = useRef(null)

  useEffect(() => {
    if (!rendition) return

    const handleRelocatedForSave = (location) => {
      if (ignoreLocationChangeUntilRef.current > Date.now()) {
        return
      }
      
      const preciseCfi = location?.start?.cfi
      if (preciseCfi) {
        preciseCfiRef.current = preciseCfi
      }
    }

    rendition.on('relocated', handleRelocatedForSave)
    return () => {
      rendition.off('relocated', handleRelocatedForSave)
    }
  }, [rendition])

  const setLocation = useCallback((newLocation) => {
    if (ignoreLocationChangeUntilRef.current > Date.now()) {
      return
    }
    
    setLocationOriginal(newLocation)
    
    const cfiToSave = preciseCfiRef.current || newLocation
    updateProgress(cfiToSave)
  }, [setLocationOriginal, updateProgress])

  useEffect(() => {
    if (hasLoadedPosition.current) {
      return
    }
    
    if (readingProgressData?.current_cfi && rendition) {
      hasLoadedPosition.current = true
      
      const savedCfi = readingProgressData.current_cfi
      
      const book = rendition.book
      
      const navigateToSavedPosition = async () => {
        try {
          await book.ready
          
          ignoreLocationChangeUntilRef.current = Date.now() + 3000
          
          setLocationOriginal(savedCfi)
          
          await rendition.display(savedCfi)
          
          setTimeout(async () => {
            try {
              await rendition.display(savedCfi)

              setTimeout(() => {
                ignoreLocationChangeUntilRef.current = 0
              }, 500)
            } catch (e) {
              if (import.meta.env.DEV) {
                console.error('Re-navigation failed:', e)
              }
              ignoreLocationChangeUntilRef.current = 0
            }
          }, 500)
          
        } catch (err) {
          if (import.meta.env.DEV) {
            console.error('Failed to display saved position:', err)
          }
          ignoreLocationChangeUntilRef.current = 0
          try {
            await rendition.display(0)
          } catch (e) {
            console.error('Fallback navigation also failed:', e)
          }
        }
      }
      
      navigateToSavedPosition()
    }
  }, [readingProgressData, setLocationOriginal, rendition, progressLoading])


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
    formError,
    handleSubmitComment,
    handleEditComment,
    handleDeleteComment,
    handleOpenCommentForm,
    handleCloseCommentForm,
    handleSelectGroup,
    handleCommentTypeChange,
  } = useBookComments(slug, hasToken, userData?.username)

  const {
    showCommentButton,
    commentButtonPosition,
    selectedTextData,
    clearSelection,
  } = useTextSelection(rendition)

  const handleHighlightClick = useCallback(() => {
    setShowCommentsSidebar(true)
  }, [])

  const { activeCommentId, clearActiveComment } = useHighlights(
    rendition,
    comments,
    handleHighlightClick,
  )

  useEffect(() => {
  }, [rendition, comments])

  useEffect(() => {
    if (rendition && prevSidebarVisibilityRef.current !== showCommentsSidebar) {
      if (ignoreLocationChangeUntilRef.current > Date.now()) {
        console.log('Skipping resize during position restore')
      } else {
        setTimeout(() => {
          rendition.resize()
        }, 300)
      }
    }

    prevSidebarVisibilityRef.current = showCommentsSidebar
  }, [showCommentsSidebar, rendition])

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

  if (book.content_type !== 'epub') {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">This book is not in EPUB format</p>
      </div>
    )
  }

  if (!book.epub_file) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">EPUB file not found</p>
      </div>
    )
  }

  const epubUrl = resolveMediaUrl(book.epub_file)

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
            <h1 className="text-xl font-semibold text-[#181A2A] dark:text-[#FFFFFF] truncate max-w-md">
              {book.title}
            </h1>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#E8E8EA] dark:bg-[#242535] text-[#3B3C4A] dark:text-[#BABABF]">
              EPUB файл
            </span  >
          </div>

          <div className="flex items-center gap-4">
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
              title="Toggle comments"
            >
              <BiMessageSquareDetail size={20} />
              <span className="max-sm:hidden">Комментарии</span>
              {comments && comments.length > 0 && (
                <span className="bg-[#FFFFFF] dark:bg-[#181A2A] text-[#4B6BFB] text-xs font-semibold px-2 py-0.5 rounded-full border border-[#E8E8EA] dark:border-[#242535]">
                  {comments.length}
                </span>
              )}
            </button>

            <button
              onClick={toggleToc}
              className="flex items-center gap-2 px-4 py-2 bg-[#4B6BFB] text-white rounded-lg hover:bg-[#3554D1] dark:hover:bg-[#3554D1] transition-colors"
            >
              <FiList size={20} />
              <span className="max-sm:hidden">Главы</span>
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
            onClearActiveComment={clearActiveComment}
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
            selectedText={editingComment ? null : selectedTextData?.text}
            onSubmitComment={onSubmitComment}
            onCancelComment={handleCloseCommentForm}
            editingComment={editingComment}
            isSubmitting={isSubmitting}
            formError={formError}
          />
        )}

        <TableOfContents
          tocItems={tocFromEpub}
          chaptersData={chaptersData}
          onChapterClick={handleChapterClick}
          onClose={() => setShowToc(false)}
          isOpen={showToc}
        />

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
          <button
            onClick={goToPrevPage}
            className="bg-[#FFFFFF] dark:bg-[#1F2136] border border-[#E8E8EA] dark:border-[#242535] shadow-md rounded-full p-3 hover:bg-[#F6F6F7] dark:hover:bg-[#242535] transition-colors"
            title="Предыдущая страница"
          >
            <FiChevronLeft
              size={24}
              className="text-[#3B3C4A] dark:text-[#BABABF]"
            />
          </button>
          <button
            onClick={goToNextPage}
            className="bg-[#FFFFFF] dark:bg-[#1F2136] border border-[#E8E8EA] dark:border-[#242535] shadow-md rounded-full p-3 hover:bg-[#F6F6F7] dark:hover:bg-[#242535] transition-colors"
            title="Следующая страница"
          >
            <FiChevronRight
              size={24}
              className="text-[#3B3C4A] dark:text-[#BABABF]"
            />
          </button>
        </div>
      </div>

      {chaptersData && (
        <div className="px-6 py-2 bg-[#F6F6F7] dark:bg-[#141624] border-t border-[#E8E8EA] dark:border-[#242535]">
          <p className="text-sm text-[#3B3C4A] dark:text-[#BABABF] text-center">
            {chaptersData.chapters?.length || 0} глав(ы)
          </p>
        </div>
      )}

      {isAuth && (
        <CommentButton
          position={commentButtonPosition}
          onClick={() => {
            handleOpenCommentForm()
            setShowCommentsSidebar(true)
          }}
          visible={showCommentButton}
        />
      )}
    </div>
  )
}

export default EpubReaderPage
