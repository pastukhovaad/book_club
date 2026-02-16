import api from '@/api'

export async function getBookComments(slug, readingGroupId = null) {
  try {
    const params = readingGroupId ? `?reading_group_id=${readingGroupId}` : ''
    const response = await api.get(`books/${slug}/comments/${params}`)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.error || 'Failed to fetch comments')
    }
    throw new Error(err.message)
  }
}

export async function createBookComment(slug, data) {
  try {
    const response = await api.post(`books/${slug}/comments/create/`, data)
    return response.data
  } catch (err) {
    if (err.response?.data) {
      const d = err.response.data
      if (typeof d === 'object' && !d.error) {
        const firstField = Object.keys(d)[0]
        if (firstField && Array.isArray(d[firstField])) {
          throw new Error(d[firstField][0])
        }
      }
      throw new Error(d.error || 'Failed to create comment')
    }
    throw new Error(err.message)
  }
}

export async function getBookComment(slug, commentId) {
  try {
    const response = await api.get(`books/${slug}/comments/${commentId}/`)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.error || 'Failed to fetch comment')
    }
    throw new Error(err.message)
  }
}

export async function updateBookComment(slug, commentId, data) {
  try {
    const response = await api.put(
      `books/${slug}/comments/${commentId}/update/`,
      data,
    )
    return response.data
  } catch (err) {
    if (err.response?.data) {
      const d = err.response.data
      if (typeof d === 'object' && !d.error) {
        const firstField = Object.keys(d)[0]
        if (firstField && Array.isArray(d[firstField])) {
          throw new Error(d[firstField][0])
        }
      }
      throw new Error(d.error || 'Failed to update comment')
    }
    throw new Error(err.message)
  }
}

export async function deleteBookComment(slug, commentId) {
  try {
    const response = await api.delete(
      `books/${slug}/comments/${commentId}/delete/`,
    )
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.error || 'Failed to delete comment')
    }
    throw new Error(err.message)
  }
}

export async function getCommentReplies(slug, commentId) {
  try {
    const response = await api.get(
      `books/${slug}/comments/${commentId}/replies/`,
    )
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.error || 'Failed to fetch replies')
    }
    throw new Error(err.message)
  }
}

export async function createCommentReply(slug, commentId, data) {
  try {
    const response = await api.post(
      `books/${slug}/comments/${commentId}/replies/create/`,
      data,
    )
    return response.data
  } catch (err) {
    if (err.response?.data) {
      const d = err.response.data
      if (typeof d === 'object' && !d.error) {
        const firstField = Object.keys(d)[0]
        if (firstField && Array.isArray(d[firstField])) {
          throw new Error(d[firstField][0])
        }
      }
      throw new Error(d.error || 'Failed to create reply')
    }
    throw new Error(err.message)
  }
}

export async function updateCommentReply(slug, commentId, replyId, data) {
  try {
    const response = await api.put(
      `books/${slug}/comments/${commentId}/replies/${replyId}/update/`,
      data,
    )
    return response.data
  } catch (err) {
    if (err.response?.data) {
      const d = err.response.data
      if (typeof d === 'object' && !d.error) {
        const firstField = Object.keys(d)[0]
        if (firstField && Array.isArray(d[firstField])) {
          throw new Error(d[firstField][0])
        }
      }
      throw new Error(d.error || 'Failed to update reply')
    }
    throw new Error(err.message)
  }
}

export async function deleteCommentReply(slug, commentId, replyId) {
  try {
    const response = await api.delete(
      `books/${slug}/comments/${commentId}/replies/${replyId}/delete/`,
    )
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.error || 'Failed to delete reply')
    }
    throw new Error(err.message)
  }
}

export async function getBookReviews(slug) {
  try {
    const response = await api.get(`books/${slug}/reviews/`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function createBookReview(slug, data) {
  try {
    const response = await api.post(`books/${slug}/reviews/create/`, data)
    return response.data
  } catch (err) {
    if (err.response?.data) {
      const d = err.response.data
      if (typeof d === 'object' && !d.message) {
        const firstField = Object.keys(d)[0]
        if (firstField && Array.isArray(d[firstField])) {
          throw new Error(d[firstField][0])
        }
      }
      throw new Error(d.message || 'Failed to create review')
    }
    throw new Error(err.message)
  }
}
