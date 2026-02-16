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
} from '@/services'

export const useBookComments = (slug, isAuthenticated = true) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const [commentType, setCommentType] = useState('personal')
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [editingComment, setEditingComment] = useState(null)
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [formError, setFormError] = useState(null)

  const readingGroupId = searchParams.get('reading_group_id')

  const { data: userGroups, isLoading: userGroupsLoading } = useQuery({
    queryKey: ['userReadingGroups'],
    queryFn: getUserReadingGroups,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  useEffect(() => {
    if (readingGroupId && userGroups) {
      const group = userGroups.find((g) => g.id === parseInt(readingGroupId))
      if (group) {
        setSelectedGroup(group)
        setCommentType('group')
      }
    }
  }, [readingGroupId, userGroups])

  const {
    data: comments,
    isLoading: commentsLoading,
    error: commentsError,
  } = useQuery({
    queryKey: ['bookComments', slug, commentType, readingGroupId],
    queryFn: () => {
      const groupId = commentType === 'personal' ? null : readingGroupId
      return getBookComments(slug, groupId).then((data) => {
        return data
      })
    },
    enabled:
      isAuthenticated &&
      !!slug &&
      (commentType === 'personal' || !!readingGroupId),
    staleTime: 1000 * 60,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const [onCreateSuccess, setOnCreateSuccess] = useState(null)

  const createCommentMutation = useMutation({
    mutationFn: (data) => createBookComment(slug, data),
    onMutate: async (newComment) => {
      await queryClient.cancelQueries({
        queryKey: ['bookComments', slug, commentType, readingGroupId],
      })

      const previousComments = queryClient.getQueryData([
        'bookComments',
        slug,
        commentType,
        readingGroupId,
      ])

      const userData = queryClient.getQueryData(['username'])

      queryClient.setQueryData(
        ['bookComments', slug, commentType, readingGroupId],
        (old) => {
          const existing = Array.isArray(old) ? old : []
          const tempComment = {
            ...newComment,
            id: `temp-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user: userData || { username: 'current_user' },
            book: slug,
            parent_comment: null,
            replies_count: 0,
          }
          return [tempComment, ...existing]
        },
      )

      return { previousComments }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['bookComments', slug, commentType, readingGroupId],
        (oldData) => {
          const existing = Array.isArray(oldData) ? oldData : []
          const withoutTemp = existing.filter((c) => !c.id.toString().startsWith('temp-'))
          return [data, ...withoutTemp]
        },
      )
      setShowCommentForm(false)
      setFormError(null)
      if (onCreateSuccess) {
        onCreateSuccess()
        setOnCreateSuccess(null)
      }
    },
    onError: (err, newComment, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(
          ['bookComments', slug, commentType, readingGroupId],
          context.previousComments,
        )
      }
      console.error('Failed to create comment:', err)
      const errorMessage = err.message || 'Ошибка при создании комментария'
      setFormError(errorMessage)
      toast.error(errorMessage)
    },
  })

  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, data }) =>
      updateBookComment(slug, commentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['bookComments', slug, commentType, readingGroupId],
      })
      setShowCommentForm(false)
      setEditingComment(null)
      setFormError(null)
    },
    onError: (err) => {
      const errorMessage = err.message || 'Ошибка при обновлении комментария'
      setFormError(errorMessage)
      toast.error(errorMessage)
    },
  })

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

      const commentData = {
        cfi_range: selectedTextData.cfiRange,
        selected_text: selectedTextData.text,
        ...formData,
      }

      if (commentType === 'group' && readingGroupId) {
        commentData.reading_group = parseInt(readingGroupId)
      }

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
    setFormError(null)
  }

  const handleCloseCommentForm = () => {
    setShowCommentForm(false)
    setEditingComment(null)
    setFormError(null)
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
    formError,

    isSubmitting:
      createCommentMutation.isPending || updateCommentMutation.isPending,

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
