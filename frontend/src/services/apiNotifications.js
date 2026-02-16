import api from '@/api'

export async function getNotifications(page, amount) {
  try {
    const response = await api.get(`notifications/${amount}/?page=${page}`)
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

export async function deleteNotification(id) {
  try {
    const response = await api.delete(`delete_notification/${id}/`)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(
        err.response?.data?.message || 'Failed to delete notification',
      )
    }

    throw new Error(err.message)
  }
}
