import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import {
  getBookComments,
  createBookComment,
  updateBookComment,
  deleteBookComment,
  getUserReadingGroups,
} from '@/services/apiBook'

export const useBookComments = (slug, isAuthenticated = true) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const [commentType, setCommentType] = useState('personal')
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [editingComment, setEditingComment] = useState(null)
  const [showCommentForm, setShowCommentForm] = useState(false)

  const readingGroupId = searchParams.get('reading_group_id')

  // Fetch user's reading groups (only if authenticated)
  const { data: userGroups, isLoading: userGroupsLoading } = useQuery({
    queryKey: ['userReadingGroups'],
    queryFn: getUserReadingGroups,
    enabled: isAuthenticated,
  })

  // Set initial selected group from URL
  useEffect(() => {
    if (readingGroupId && userGroups) {
      const group = userGroups.find((g) => g.id === parseInt(readingGroupId))
      if (group) {
        setSelectedGroup(group)
        setCommentType('group')
      }
    }
  }, [readingGroupId, userGroups])

  // Fetch comments
  const {
    data: comments,
    isLoading: commentsLoading,
    error: commentsError,
  } = useQuery({
    queryKey: ['bookComments', slug, commentType, readingGroupId],
    queryFn: () => {
      const groupId = commentType === 'personal' ? null : readingGroupId
      return getBookComments(slug, groupId).then((data) => {
        if (import.meta.env.DEV) {
          console.log('Comments loaded:', data)
          if (data && data.length > 0) {
            console.log('First comment CFI:', data[0].cfi_range)
          }
        }
        return data
      })
    },
    enabled:
      isAuthenticated &&
      !!slug &&
      (commentType === 'personal' || !!readingGroupId),
  })

  // Callback to run after successful comment creation
  const [onCreateSuccess, setOnCreateSuccess] = useState(null)

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: (data) => createBookComment(slug, data),
    onSuccess: (data) => {
      if (import.meta.env.DEV) {
        console.log('Comment created successfully:', data)
      }
      queryClient.invalidateQueries({
        queryKey: ['bookComments', slug, commentType, readingGroupId],
      })
      setShowCommentForm(false)
      if (onCreateSuccess) {
        onCreateSuccess()
        setOnCreateSuccess(null)
      }
    },
    onError: (err) => {
      if (import.meta.env.DEV) {
        console.error('Failed to create comment:', err)
      }
      toast.error(err.message || 'Ошибка при создании комментария')
    },
  })

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, data }) =>
      updateBookComment(slug, commentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['bookComments', slug, commentType, readingGroupId],
      })
      setShowCommentForm(false)
      setEditingComment(null)
    },
    onError: (err) => {
      toast.error(err.message || 'Ошибка при обновлении комментария')
    },
  })

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => deleteBookComment(slug, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['bookComments', slug, commentType, readingGroupId],
      })
    },
    onError: (err) => {
      toast.error(err.message || 'Ошибка при удалении комментария')
    },
  })

  const handleSubmitComment = (formData, selectedTextData, onSuccess) => {
    if (editingComment) {
      updateCommentMutation.mutate({
        commentId: editingComment.id,
        data: formData,
      })
    } else {
      if (!selectedTextData) {
        if (import.meta.env.DEV) {
          console.warn('handleSubmitComment: No selectedTextData provided')
        }
        return
      }

      if (import.meta.env.DEV) {
        console.log('Creating comment with selectedTextData:', selectedTextData)
        console.log('CFI Range:', selectedTextData.cfiRange)
      }

      const commentData = {
        cfi_range: selectedTextData.cfiRange,
        selected_text: selectedTextData.text,
        ...formData,
      }

      if (import.meta.env.DEV) {
        console.log('Comment data to send:', commentData)
      }

      if (commentType === 'group' && readingGroupId) {
        commentData.reading_group = parseInt(readingGroupId)
      }

      // Store callback to run after success
      if (onSuccess) {
        setOnCreateSuccess(() => onSuccess)
      }

      createCommentMutation.mutate(commentData)
    }
  }

  const handleEditComment = (comment) => {
    setEditingComment(comment)
    setShowCommentForm(true)
  }

  const handleDeleteComment = (commentId) => {
    deleteCommentMutation.mutate(commentId)
  }

  const handleOpenCommentForm = () => {
    setShowCommentForm(true)
  }

  const handleCloseCommentForm = () => {
    setShowCommentForm(false)
    setEditingComment(null)
  }

  const handleSelectGroup = (group) => {
    setSelectedGroup(group)
    setCommentType('group')

    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.set('reading_group_id', group.id.toString())
    setSearchParams(newSearchParams)
  }

  const handleCommentTypeChange = (type) => {
    setCommentType(type)

    if (type === 'personal') {
      setSelectedGroup(null)
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.delete('reading_group_id')
      setSearchParams(newSearchParams)
    }
  }

  return {
    // State
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
    isAuthenticated,

    // Mutation states
    isSubmitting:
      createCommentMutation.isPending || updateCommentMutation.isPending,

    // Handlers
    handleSubmitComment,
    handleEditComment,
    handleDeleteComment,
    handleOpenCommentForm,
    handleCloseCommentForm,
    handleSelectGroup,
    handleCommentTypeChange,
  }
}

export default useBookComments
