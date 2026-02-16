import api from '@/api'

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
      throw new Error('Неправильный логин или пароль')
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
    if (err.response?.data) {
      const d = err.response.data
      if (typeof d === 'object') {
        const firstField = Object.keys(d)[0]
        if (firstField && Array.isArray(d[firstField])) {
          throw new Error(d[firstField][0])
        }
      }
      throw new Error('Failed to update profile')
    }

    throw new Error(err.message)
  }
}

export async function getUserBooks(username) {
  try {
    const response = await api.get(`users/${username}/books/`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function getUserStats(username) {
  try {
    const response = await api.get(`users/${username}/stats/`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}
