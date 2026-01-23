import api from "@/api";

export async function getBooks(page, amount) {
  try {
    const response = await api.get(`book_list/${amount}/?page=${page}`);
    return response.data;
  } catch (err) {
    throw new Error(err.message);
  }
}

export async function getBook(slug) {
  try {
    const response = await api.get(`books/${slug}`);
    return response.data;
  } catch (err) {
    throw new Error(err.message);
  }
}

export async function getBookPage(slug) { // REM
  try {
    const response = await api.get(`books/${slug}/page`);
    return response.data;
  } catch (err) {
    throw new Error(err.message);
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

export async function getReadingGroups(page, amount) {  // REM
  try {
    const response = await api.get(`group_list/${amount}/?page=${page}`);
    return response.data;
  } catch (err) {
    throw new Error(err.message);
  }
}

export async function getReadingGroup(slug) {
  try {
    const response = await api.get(`groups/${slug}`);
    return response.data;
  } catch (err) {
    throw new Error(err.message);
  }
}

export async function registerUser(data) {
  try {
    const response = await api.post("register_user/", data);
    return response.data;
  } catch (err) {
    console.log(err);
    if (err.status == 400) {
      throw new Error("Username already exists");
    }
    throw new Error(err);
  }
}

export async function signin(data) {
  try {
    const response = await api.post("token/", data);
    return response.data;
  } catch (err) {
    if (err.status === 401) {
      throw new Error("Invalid Credentials");
    }

    throw new Error(err);
  }
}

export async function getUsername() {
  try {
    const response = await api.get("get_username");
    return response.data;
  } catch (err) {
    throw new Error(err.message);
  }
}

export async function createBook(data) {
  try {
    const response = await api.post("create_book/", data);
    return response.data;
  } catch (err) {
    throw new Error(err.message);
  }
}

export async function createReadingGroup(data) {
  try {
    const response = await api.post("create_group/", data);
    return response.data;
  } catch (err) {
    throw new Error(err.message);
  }
}

export async function updateBook(data, id) {
  try {
    const response = await api.put(`update_book/${id}/`, data);
    return response.data;
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.message || "Failed to update book");
    }

    throw new Error(err.message);
  }
}

export async function updateReadingGroup(data, id) {
  try {
    const response = await api.put(`update_group/${id}/`, data);
    return response.data;
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.message || "Failed to update group");
    }

    throw new Error(err.message);
  }
}

export async function deleteBook(id) {
  try {
    const response = await api.post(`delete_book/${id}/`);
    return response.data;
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.message || "Failed to delete book");
    }

    throw new Error(err.message);
  }
}

export async function deleteReadingGroup(id) {
  try {
    const response = await api.post(`delete_group/${id}/`);
    return response.data;
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.message || "Failed to delete group");
    }

    throw new Error(err.message);
  }
}

export async function getUserInfo(username) {
  try {
    const response = await api.get(`get_userinfo/${username}`);
    return response.data;
  } catch (err) {
    throw new Error(err.message);
  }
}

export async function updateProfile(data) {
  try {
    const response = await api.put(`update_user/`, data);
    return response.data;
  } catch (err) {
    console.log(err)
    if (err.response) {
      throw new Error(
        err?.response?.data.username[0] || "Failed to update profile"
      );
    }

    throw new Error(err.message);
  }
}

export async function addUserToGroup(id) {
  try {
    const response = await api.put(`group/${id}/add_user/`);
    return response.data;
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.message || "Failed to add user to group");
    }

    throw new Error(err.message);
  }
}

export async function removeUserFromGroup(id) {
  try {
    const response = await api.put(`group/${id}/remove_user/`);
    return response.data;
  } catch (err) {
    if (err.response) {
      throw new Error(err.response?.data?.message || "Failed to remove user from group");
    }

    throw new Error(err.message);
  }
}