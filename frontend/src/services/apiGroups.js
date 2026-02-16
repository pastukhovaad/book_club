import api from '@/api'

export async function getReadingGroups(page, amount) {
  try {
    const response = await api.get(`group_list/${amount}/?page=${page}`)
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

export async function getUserCreatedGroups() {
  try {
    const response = await api.get('user_created_groups/')
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

export async function getUserToReadingGroupStates(id) {
  try {
    const response = await api.get(`user_to_reading_group_state_list/${id}/`)
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

export async function deleteReadingGroup(id) {
  try {
    const response = await api.delete(`delete_group/${id}/`)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.message || 'Failed to delete group')
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
        err.response?.data?.message || 'Failed to add user to group',
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
        err.response?.data?.message || 'Failed to remove user from group',
      )
    }

    throw new Error(err.message)
  }
}

export async function kickUserFromGroup(groupId, userId) {
  try {
    const response = await api.put(`group/${groupId}/kick_user/${userId}/`)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(
        err.response?.data?.message || 'Failed to kick user from group',
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
        err.response?.data?.message || 'Failed to confirm user to group',
      )
    }

    throw new Error(err.message)
  }
}

export async function getGroupReadingBooks(slug) {
  try {
    const response = await api.get(`groups/${slug}/books/reading/`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function getGroupPostedBooks(slug) {
  try {
    const response = await api.get(`groups/${slug}/books/posted/`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}
