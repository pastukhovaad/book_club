import api from '@/api'

export async function getRewardTemplates() {
  try {
    const response = await api.get('rewards/templates/')
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function createRewardTemplate(data) {
  try {
    const response = await api.post('rewards/templates/create/', data)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.error || 'Failed to create reward template')
    }
    throw new Error(err.message)
  }
}

export async function deleteRewardTemplate(templateId) {
  try {
    const response = await api.delete(`rewards/templates/${templateId}/delete/`)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.error || 'Не удалось удалить шаблон приза')
    }
    throw new Error(err.message)
  }
}

export async function getQuestTemplates() {
  try {
    const response = await api.get('quest-templates/')
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function createQuestTemplate(data) {
  try {
    const response = await api.post('quest-templates/create/', data)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.error || 'Не удалось создать шаблон задания')
    }
    throw new Error(err.message)
  }
}

export async function updateQuestTemplate(templateId, data) {
  try {
    const response = await api.put(`quest-templates/${templateId}/update/`, data)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.error || 'Не удалось обновить шаблон задания')
    }
    throw new Error(err.message)
  }
}

export async function deleteQuestTemplate(templateId) {
  try {
    const response = await api.delete(`quest-templates/${templateId}/delete/`)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.error || 'Не удалось удалить шаблон задания')
    }
    throw new Error(err.message)
  }
}

export async function getMyRewards() {
  try {
    const response = await api.get('rewards/my/')
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function getMyRewardPlacements() {
  try {
    const response = await api.get('rewards/my/placements/')
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function getUserRewards(username) {
  try {
    const response = await api.get(`rewards/user/${username}/`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}


export async function getQuests() {
  try {
    const response = await api.get('quests/')
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function getGroupQuests(slug) {
  try {
    const response = await api.get(`groups/${slug}/quests/`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function generateDailyQuests(slug) {
  try {
    const response = await api.post(`groups/${slug}/quests/generate/`)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.error || 'Failed to generate quests')
    }
    throw new Error(err.message)
  }
}

export async function createQuest(data) {
  try {
    const response = await api.post('quests/create/', data)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.error || 'Failed to create quest')
    }
    throw new Error(err.message)
  }
}

export async function getQuestProgress(questId) {
  try {
    const response = await api.get(`quests/${questId}/progress/`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function getMyQuests() {
  try {
    const response = await api.get('quests/my/')
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function generateDailyPersonalQuests() {
  try {
    const response = await api.post('quests/daily/personal/')
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.error || 'Failed to generate daily personal quests')
    }
    throw new Error(err.message)
  }
}


export async function getPrizeBoard(slug) {
  try {
    const response = await api.get(`groups/${slug}/board/`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function updatePrizeBoardSettings(slug, data) {
  try {
    const response = await api.put(`groups/${slug}/board/settings/`, data)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.error || 'Failed to update board settings')
    }
    throw new Error(err.message)
  }
}

export async function placeRewardOnBoard(slug, data) {
  try {
    const response = await api.post(`groups/${slug}/board/place/`, data)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.error || 'Failed to place reward')
    }
    throw new Error(err.message)
  }
}

export async function removeRewardFromBoard(slug, x, y) {
  try {
    const response = await api.delete(`groups/${slug}/board/remove/${x}/${y}/`)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.error || 'Failed to remove reward')
    }
    throw new Error(err.message)
  }
}

export async function getUserPrizeBoard(username) {
  try {
    const response = await api.get(`users/${username}/board/`)
    return response.data
  } catch (err) {
    throw new Error(err.message)
  }
}

export async function placeRewardOnUserBoard(username, data) {
  try {
    const response = await api.post(`users/${username}/board/place/`, data)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.error || 'Failed to place reward')
    }
    throw new Error(err.message)
  }
}

export async function removeRewardFromUserBoard(username, x, y) {
  try {
    const response = await api.delete(`users/${username}/board/remove/${x}/${y}/`)
    return response.data
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.error || 'Failed to remove reward')
    }
    throw new Error(err.message)
  }
}
