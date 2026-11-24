// API utility functions for FlowTrack
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Authorization": `Token ${token}`,
    "Content-Type": "application/json",
  };
};

// Helper function to handle API responses
const handleApiResponse = async (response) => {
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return;
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Project API calls
export const projectAPI = {
  // Get all projects
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/projects/`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  // Get single project
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/projects/${id}/`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  // Create project
  create: async (projectData) => {
    const response = await fetch(`${API_BASE_URL}/projects/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(projectData),
    });
    return handleApiResponse(response);
  },

  // Update project
  update: async (id, projectData) => {
    const response = await fetch(`${API_BASE_URL}/projects/${id}/`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(projectData),
    });
    return handleApiResponse(response);
  },

  // Delete project
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/projects/${id}/`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },
};

// Task API calls
export const taskAPI = {
  // Get all tasks
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/tasks/`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  // Get single task
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}/`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  // Create task
  create: async (taskData) => {
    const response = await fetch(`${API_BASE_URL}/tasks/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData),
    });
    return handleApiResponse(response);
  },

  // Update task
  update: async (id, taskData) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}/`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData),
    });
    return handleApiResponse(response);
  },

  // Delete task
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}/`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },
};

// User API calls
export const userAPI = {
  // Get user roles
  getRoles: async () => {
    const response = await fetch(`${API_BASE_URL}/user-role/`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  // Get kanban board data
  getKanbanData: async (projectId = null) => {
    const url = projectId 
      ? `${API_BASE_URL}/kanban-board/?project_id=${projectId}`
      : `${API_BASE_URL}/kanban-board/`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },
};

export const organizationAPI = {
  getCurrent: async () => {
    const response = await fetch(`${API_BASE_URL}/organization/`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  create: async (organizationData) => {
    const response = await fetch(`${API_BASE_URL}/organization/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(organizationData),
    });
    return handleApiResponse(response);
  },

  getMembers: async () => {
    const response = await fetch(`${API_BASE_URL}/organization/members/`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  addMember: async (memberData) => {
    const response = await fetch(`${API_BASE_URL}/organization/members/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(memberData),
    });
    return handleApiResponse(response);
  },

  updateMember: async (membershipId, memberData) => {
    const response = await fetch(`${API_BASE_URL}/organization/members/${membershipId}/`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(memberData),
    });
    return handleApiResponse(response);
  },

  removeMember: async (membershipId) => {
    const response = await fetch(`${API_BASE_URL}/organization/members/${membershipId}/`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (response.status === 204) {
      return {};
    }
    return handleApiResponse(response);
  },
};

// AI Assistant & Intelligence API calls
export const aiAPI = {
  enhanceTask: async (data) => {
    const response = await fetch(`${API_BASE_URL}/ai/enhance-task/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleApiResponse(response);
  },

  breakdownTask: async (data) => {
    const response = await fetch(`${API_BASE_URL}/ai/breakdown-task/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleApiResponse(response);
  },

  getSprintSummary: async (projectId) => {
    const response = await fetch(`${API_BASE_URL}/ai/sprint-summary/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ project_id: projectId }),
    });
    return handleApiResponse(response);
  },

  chat: async (data) => {
    const response = await fetch(`${API_BASE_URL}/ai/chat/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleApiResponse(response);
  },

  getConfig: async () => {
    const response = await fetch(`${API_BASE_URL}/ai/config/`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  updateConfig: async (geminiKey) => {
    const response = await fetch(`${API_BASE_URL}/ai/config/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ gemini_api_key: geminiKey }),
    });
    return handleApiResponse(response);
  },
};

// Task Comments API
export const commentAPI = {
  getByTaskId: async (taskId) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/comments/`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  create: async (taskId, content) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/comments/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ content }),
    });
    return handleApiResponse(response);
  },
};

// Project Activity Audit Log API
export const activityAPI = {
  getByProjectId: async (projectId) => {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/activities/`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },
};

// Task Attachments API
export const attachmentAPI = {
  getByTaskId: async (taskId) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/attachments/`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  upload: async (taskId, file) => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/attachments/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
      },
      body: formData,
    });
    return handleApiResponse(response);
  },

  delete: async (attachmentId) => {
    const response = await fetch(`${API_BASE_URL}/attachments/${attachmentId}/`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },
};

// Mini-CRM Client API calls (inspired by django-crm & django-coleman)
export const clientAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/clients/`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/clients/${id}/`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  create: async (clientData) => {
    const response = await fetch(`${API_BASE_URL}/clients/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(clientData),
    });
    return handleApiResponse(response);
  },

  update: async (id, clientData) => {
    const response = await fetch(`${API_BASE_URL}/clients/${id}/`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(clientData),
    });
    return handleApiResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/clients/${id}/`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },
};

// Task Time Tracking API calls (inspired by taskcoach & django-coleman)
export const timeEntryAPI = {
  getByTaskId: async (taskId) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/time-entries/`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  create: async (taskId, entryData) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/time-entries/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(entryData),
    });
    return handleApiResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/time-entries/${id}/`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (response.status === 204) {
      return {};
    }
    return handleApiResponse(response);
  },
};


