// API utility functions for FlowTrack
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
