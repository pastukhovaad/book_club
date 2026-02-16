import api from '@/api'

export async function getBooks(page, amount) {
  try {
    const response = await api.get(`book_list/${amount}/?page=${page}`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function getPublicBooks(page, amount) {
  try {
    const response = await api.get(`public_books/${amount}/?page=${page}`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function getBook(slug, info_only = false) {
  try {
    const response = await api.get(`books/${slug}?info_only=${info_only}`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function searchBooksByHashtag(tag, page, amount) {
  try {
    const response = await api.get(`books/by_hashtag/?tag=${encodeURIComponent(tag)}&page=${page}&amount=${amount}`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function getRecentReadingBooks(page, amount) {
  try {
    const response = await api.get(`books/reading/recent/${amount}/?page=${page}`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function getBookPage(slug) {
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

export async function createBook(data) {
  try {
    const response = await api.post('create_book/', data)
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

export async function deleteBook(id) {
  try {
    const response = await api.delete(`delete_book/${id}/`)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.message || 'Failed to delete book')
    }

    throw new Error(err.message)
  }
}

export async function getReadingProgress(slug) {
  try {
    const response = await api.get(`books/${slug}/progress/`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function updateReadingProgress(slug, data) {
  try {
    const response = await api.put(`books/${slug}/progress/update/`, data)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.error || 'Failed to update progress')
    }
    throw new Error(err.message)
  }
}

export async function completeBook(slug) {
  try {
    const response = await api.post(`books/${slug}/complete/`)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.error || 'Failed to complete book')
    }
    throw new Error(err.message)
  }
}
