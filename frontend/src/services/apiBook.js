import api from '@/api'

export async function getBooks(page, amount) {
  try {
    const response = await api.get(`book_list/${amount}/?page=${page}`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function getBook(slug) {
  try {
    const response = await api.get(`books/${slug}`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function getNotification(id) {
  try {
    const response = await api.get(`get_notification/${id}`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}


export async function createNotification(data) {
  try {
    const response = await api.post('create_notification/', data)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}


export async function getBookPage(slug) {
  // REM
  try {
    const response = await api.get(`books/${slug}/page`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function getBookChapter(slug, chapterId) {
  try {
    const response = await api.get(`books/${slug}/chapters/${chapterId}/`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function getBookChaptersList(slug) {
  try {
    const response = await api.get(`books/${slug}/chapters/`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

// export async function getReadingGroups(page) {  // REM - older
//   try {
//     const response = await api.get(`group_list?page=${page}`);
//     return response.data;
//   } catch (err) {
//     throw new Error(err.message);
//   }
// }

export async function getReadingGroups(page, amount) {
  // REM
  try {
    const response = await api.get(`group_list/${amount}/?page=${page}`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function getNotifications(page, amount) {
  // REM
  try {
    const response = await api.get(`notifications/${amount}/?page=${page}`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}


export async function getUserToReadingGroupStates(id) {
  // REM
  try {
    const response = await api.get(`user_to_reading_group_state_list/${id}/`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function getUserReadingGroups() {
  try {
    const response = await api.get('user_reading_groups/')
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}


export async function getReadingGroup(slug) {
  try {
    const response = await api.get(`groups/${slug}`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function registerUser(data) {
  try {
    const response = await api.post('register_user/', data)
    return response.data
  } catch (err) {
    console.log(err)
    if (err.status == 400) {
      throw new Error('Username already exists')
    }
    throw new Error(err)
  }
}

export async function signin(data) {
  try {
    const response = await api.post('token/', data)
    return response.data
  } catch (err) {
    if (err.status === 401) {
      throw new Error('Invalid Credentials')
    }

    throw new Error(err)
  }
}

export async function getUsername() {
  try {
    const response = await api.get('get_username')
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function createBook(data) {
  try {
    const response = await api.post('create_book/', data)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function createReadingGroup(data) {
  try {
    const response = await api.post('create_group/', data)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function updateBook(data, id) {
  try {
    const response = await api.put(`update_book/${id}/`, data)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.message || 'Failed to update book')
    }

    throw new Error(err.message)
  }
}

export async function updateReadingGroup(data, id) {
  try {
    const response = await api.put(`update_group/${id}/`, data)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.message || 'Failed to update group')
    }

    throw new Error(err.message)
  }
}

export async function deleteBook(id) {
  try {
    const response = await api.post(`delete_book/${id}/`)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.message || 'Failed to delete book')
    }

    throw new Error(err.message)
  }
}

export async function deleteNotification(id) {
  try {
    const response = await api.post(`delete_notification/${id}/`)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.message || 'Failed to delete notification')
    }

    throw new Error(err.message)
  }
}

export async function deleteReadingGroup(id) {
  try {
    const response = await api.post(`delete_group/${id}/`)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.message || 'Failed to delete group')
    }

    throw new Error(err.message)
  }
}

export async function getUserInfo(username) {
  try {
    const response = await api.get(`get_userinfo/${username}`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function updateProfile(data) {
  try {
    const response = await api.put(`update_user/`, data)
    return response.data
  } catch (err) {
    console.log(err)
    if (err.response) {
      throw new Error(
        err?.response?.data.username[0] || 'Failed to update profile'
      )
    }

    throw new Error(err.message)
  }
}

export async function addUserToGroup(id) {
  try {
    const response = await api.put(`group/${id}/add_user/`)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(
        err.response?.data?.message || 'Failed to add user to group'
      )
    }

    throw new Error(err.message)
  }
}

export async function removeUserFromGroup(id) {
  try {
    const response = await api.put(`group/${id}/remove_user/`)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(
        err.response?.data?.message || 'Failed to remove user from group'
      )
    }

    throw new Error(err.message)
  }
}


export async function confirmUserToGroup(groupId, userId) {
  try {
    const response = await api.put(`group/${groupId}/confirm_user/${userId}/`)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(
        err.response?.data?.message || 'Failed to confirm user to group'
      )
    }

    throw new Error(err.message)
  }
}

// Book Comments API Functions

export async function getBookComments(slug, readingGroupId = null) {
  try {
    // If readingGroupId is provided, fetch group comments; otherwise, fetch personal comments
    const params = readingGroupId ? `?reading_group_id=${readingGroupId}` : ''
    const response = await api.get(`books/${slug}/comments/${params}`)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(
        err.response?.data?.error || 'Failed to fetch comments'
      )
    }
    throw new Error(err.message)
  }
}

export async function createBookComment(slug, data) {
  try {
    const response = await api.post(`books/${slug}/comments/create/`, data)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(
        err.response?.data?.error || 'Failed to create comment'
      )
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
      throw new Error(
        err.response?.data?.error || 'Failed to fetch comment'
      )
    }
    throw new Error(err.message)
  }
}

export async function updateBookComment(slug, commentId, data) {
  try {
    const response = await api.put(
      `books/${slug}/comments/${commentId}/update/`,
      data
    )
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(
        err.response?.data?.error || 'Failed to update comment'
      )
    }
    throw new Error(err.message)
  }
}

export async function deleteBookComment(slug, commentId) {
  try {
    const response = await api.delete(
      `books/${slug}/comments/${commentId}/delete/`
    )
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(
        err.response?.data?.error || 'Failed to delete comment'
      )
    }
    throw new Error(err.message)
  }
}

// Comment Replies API Functions

export async function getCommentReplies(slug, commentId) {
  try {
    const response = await api.get(
      `books/${slug}/comments/${commentId}/replies/`
    )
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(
        err.response?.data?.error || 'Failed to fetch replies'
      )
    }
    throw new Error(err.message)
  }
}

export async function createCommentReply(slug, commentId, data) {
  try {
    const response = await api.post(
      `books/${slug}/comments/${commentId}/replies/create/`,
      data
    )
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(
        err.response?.data?.error || 'Failed to create reply'
      )
    }
    throw new Error(err.message)
  }
}

export async function updateCommentReply(slug, commentId, replyId, data) {
  try {
    const response = await api.put(
      `books/${slug}/comments/${commentId}/replies/${replyId}/update/`,
      data
    )
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(
        err.response?.data?.error || 'Failed to update reply'
      )
    }
    throw new Error(err.message)
  }
}

export async function deleteCommentReply(slug, commentId, replyId) {
  try {
    const response = await api.delete(
      `books/${slug}/comments/${commentId}/replies/${replyId}/delete/`
    )
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(
        err.response?.data?.error || 'Failed to delete reply'
      )
    }
    throw new Error(err.message)
  }
}