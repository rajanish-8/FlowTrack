import { useState, useEffect, useCallback } from "react";
import { taskAPI, aiAPI } from "../utils/api";
import { startVoiceRecognition, isSpeechSupported } from "../utils/speech";
import "./Management.css";
import "./AIComponents.css";

function TaskManagement({ userRole, projects, selectedProject, onTaskUpdate, onClose, editingTaskId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "low",
    project: "",
    assigned_to: "",
    estimated_hours: 0,
    recurrence: "none",
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSubtasks, setAiSubtasks] = useState([]);
  const [aiStatusMessage, setAiStatusMessage] = useState("");
  const [isListeningTitle, setIsListeningTitle] = useState(false);

  const handleVoiceTitle = () => {
    if (isListeningTitle) return;
    setIsListeningTitle(true);
    startVoiceRecognition({
      onResult: (text) => {
        setFormData((prev) => ({ ...prev, title: text }));
      },
      onError: (err) => {
        console.warn("Speech error:", err);
        setIsListeningTitle(false);
      },
      onEnd: () => {
        setIsListeningTitle(false);
      },
    });
  };

  const handleAIEnhance = async () => {
    if (!formData.title?.trim()) return;
    try {
      setAiLoading(true);
      setAiStatusMessage("✨ Enhancing task with AI...");
      const res = await aiAPI.enhanceTask({
        title: formData.title,
        description: formData.description,
        project_id: formData.project,
      });
      setFormData((prev) => ({
        ...prev,
        title: res.enhanced_title || prev.title,
        description: res.description || prev.description,
        priority: res.suggested_priority || prev.priority,
      }));
      setAiStatusMessage(`Enhanced with ${res.ai_powered_by}!`);
      setTimeout(() => setAiStatusMessage(""), 3500);
    } catch {
      setAiStatusMessage("⚠️ Could not enhance task with AI.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIBreakdown = async () => {
    if (!formData.title?.trim()) return;
    try {
      setAiLoading(true);
      setAiStatusMessage("🪄 Generating subtasks with AI...");
      const res = await aiAPI.breakdownTask({
        title: formData.title,
        description: formData.description,
      });
      setAiSubtasks(res.subtasks || []);
      setAiStatusMessage(`Decomposed into ${res.subtasks?.length || 0} subtasks!`);
    } catch {
      setAiStatusMessage("⚠️ Could not decompose task with AI.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddAllSubtasks = async () => {
    if (!aiSubtasks.length || !formData.project) return;
    try {
      setAiLoading(true);
      const members = getProjectMembers(formData.project);
      const defaultAssignee = members[0]?.id || "";
      for (const st of aiSubtasks) {
        await taskAPI.create({
          title: st.title.slice(0, 50),
          description: `Auto-generated subtask for: ${formData.title}`,
          priority: st.priority || "medium",
          project: formData.project,
          assigned_to: formData.assigned_to || defaultAssignee,
        });
      }
      setAiSubtasks([]);
      setShowCreateForm(false);
      resetForm();
      await loadTasks();
      onTaskUpdate();
    } catch (err) {
      setError("Failed to create subtasks: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
  }, []);

  // Auto-open create form if no tasks exist (for better UX)
  useEffect(() => {
    if (!loading && tasks.length === 0 && (userRole === 'owner' || userRole === 'manager')) {
      setShowCreateForm(true);
    }
  }, [loading, tasks.length, userRole]);

  // Get project members for assignment dropdown
  const getProjectMembers = useCallback((projectId) => {
    if (!projectId || projectId === 'undefined' || projectId === undefined) {
      return [];
    }
    const project = projects.find(p => String(p.id) === String(projectId));
    return project ? project.members || [] : [];
  }, [projects]);

  // Initialize form with selected project
  useEffect(() => {
    if (selectedProject) {
      setFormData(prev => ({
        ...prev,
        project: selectedProject.id.toString()
      }));
    }
  }, [selectedProject]);

  useEffect(() => {
    if (!formData.project) return;
    const members = getProjectMembers(formData.project);
    if (members.length > 0 && !formData.assigned_to) {
      setFormData((prev) => ({ ...prev, assigned_to: members[0].id.toString() }));
    }
  }, [formData.project, formData.assigned_to, getProjectMembers]);

  // Handle editing task from card click
  useEffect(() => {
    if (editingTaskId) {
      const task = tasks.find(t => t.id === editingTaskId);
      if (task) {
        openEditForm(task);
      }
    }
  }, [editingTaskId, tasks]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await taskAPI.getAll();
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await taskAPI.create(formData);
      setShowCreateForm(false);
      resetForm();
      await loadTasks();
      onTaskUpdate(); // Refresh the main board
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    try {
      await taskAPI.update(selectedTask.id, formData);
      setShowEditForm(false);
      setSelectedTask(null);
      resetForm();
      await loadTasks();
      onTaskUpdate(); // Refresh the main board
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      return;
    }
    
    try {
      await taskAPI.delete(taskId);
      await loadTasks();
      onTaskUpdate(); // Refresh the main board
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      due_date: "",
      priority: "low",
      project: selectedProject ? selectedProject.id.toString() : "",
      assigned_to: "",
      estimated_hours: 0,
      recurrence: "none",
    });
  };

  const openEditForm = (task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      due_date: task.due_date ? task.due_date.split('T')[0] : "",
      priority: task.priority || "low",
      project: task.project,
      assigned_to: task.assigned_to ? task.assigned_to.id : "",
      estimated_hours: task.estimated_hours || 0,
      recurrence: task.recurrence || "none",
    });
    setShowEditForm(true);
  };

  const selectedProjectMembers = getProjectMembers(formData.project);

  // Check if user can edit/delete task (owner or project manager)
  const canEditTask = () => {
    if (userRole === 'owner') return true;
    if (userRole === 'manager') return true;
    return false;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "No due date";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Get status display name
  const getStatusDisplay = (status) => {
    const statusMap = {
      "to do": "To Do",
      "in progress": "In Progress",
      "review": "Review",
      "done": "Done"
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading-spinner"></div>
          <p>Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content task-management">
        <div className="modal-header">
          <h2>Task Management</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        <div className="task-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
            style={{
              fontSize: tasks.length === 0 ? '18px' : '14px',
              padding: tasks.length === 0 ? '12px 24px' : '8px 16px',
              fontWeight: tasks.length === 0 ? '600' : '500'
            }}
          >
            {tasks.length === 0 ? 'Create Your First Task' : 'Create New Task'}
          </button>
        </div>

        <div className="tasks-list">
          <h3>Tasks</h3>
          {tasks.length === 0 ? (
            <div className="no-tasks">
              <p>No tasks found in this project.</p>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                Click "Create Your First Task" above to get started!
              </p>
            </div>
          ) : (
            <div className="task-cards">
              {tasks.map((task) => (
                <div key={task.id} className="task-card">
                  <div className="task-info">
                    <h4>{task.title}</h4>
                    <p className="task-description">
                      {task.description || "No description provided"}
                    </p>
                    <div className="task-meta">
                      <span className="task-status">{getStatusDisplay(task.status)}</span>
                      <span className="task-priority">{task.priority}</span>
                      <span className="task-due-date">{formatDate(task.due_date)}</span>
                      {task.assigned_to && (
                        <span className="task-assignee">
                          Assigned to: {task.assigned_to.username}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="task-actions">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => openEditForm(task)}
                      disabled={!canEditTask(task)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleDeleteTask(task.id)}
                      disabled={!canEditTask(task)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Task Form */}
        {showCreateForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Create New Task</h3>
                <button className="close-btn" onClick={() => setShowCreateForm(false)}>×</button>
              </div>
              <form onSubmit={handleCreateTask} className="task-form">
                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <label htmlFor="title" style={{ margin: 0 }}>Task Title *</label>
                    {isSpeechSupported() && (
                      <button
                        type="button"
                        onClick={handleVoiceTitle}
                        style={{
                          background: isListeningTitle ? "#ef4444" : "var(--brand, #4f46e5)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "9999px",
                          padding: "2px 8px",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          transition: "all 0.15s ease",
                        }}
                        title="Click to speak task title"
                      >
                        🎙️ {isListeningTitle ? "Listening..." : "Dictate Title"}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. Build authentication flow"
                    required
                  />
                </div>

                <div className="ai-action-btn-group">
                  <button
                    type="button"
                    className="ai-btn-enhance"
                    onClick={handleAIEnhance}
                    disabled={aiLoading || !formData.title.trim()}
                    title="Generate detailed description, acceptance checklist, and optimal priority"
                  >
                    ✨ AI Auto-Fill & Enhance
                  </button>
                  <button
                    type="button"
                    className="ai-btn-breakdown"
                    onClick={handleAIBreakdown}
                    disabled={aiLoading || !formData.title.trim()}
                    title="Decompose into 3-5 subtasks with automatic creation"
                  >
                    🪄 AI Breakdown into Subtasks
                  </button>
                </div>
                {aiStatusMessage && (
                  <p className="form-hint" style={{ color: "#7c3aed", fontWeight: 600, margin: "-6px 0 10px 0" }}>
                    {aiStatusMessage}
                  </p>
                )}

                {aiSubtasks.length > 0 && (
                  <div
                    className="ai-subtasks-box"
                    style={{
                      background: "#fdf2f8",
                      padding: "12px 16px",
                      borderRadius: "14px",
                      border: "1px solid #fbcfe8",
                      marginBottom: "16px",
                    }}
                  >
                    <h5 style={{ margin: "0 0 8px 0", color: "#be185d", fontSize: "0.9rem" }}>
                      ✨ AI Generated {aiSubtasks.length} Actionable Subtasks:
                    </h5>
                    <ul style={{ margin: "0 0 10px 0", paddingLeft: "18px", fontSize: "0.84rem", color: "#334155" }}>
                      {aiSubtasks.map((st, i) => (
                        <li key={i} style={{ marginBottom: "4px" }}>
                          <strong>{st.title}</strong> — <em>Priority: {st.priority} ({st.estimated_hours}h)</em>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="btn primary"
                      style={{ fontSize: "0.82rem", padding: "6px 14px", background: "#db2777" }}
                      onClick={handleAddAllSubtasks}
                      disabled={aiLoading}
                    >
                      🚀 Add All {aiSubtasks.length} Subtasks to Board Now
                    </button>
                  </div>
                )}
                
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="project">Project *</label>
                  <select
                    id="project"
                    value={formData.project}
                    onChange={(e) => setFormData({...formData, project: e.target.value, assigned_to: ""})}
                    required
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="assigned_to">Assign To *</label>
                  <select
                    id="assigned_to"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                    disabled={!formData.project || selectedProjectMembers.length === 0}
                    required
                  >
                    <option value="">
                      {!formData.project ? "Select a project first" : selectedProjectMembers.length === 0 ? "No project members available" : "Select assignee"}
                    </option>
                    {selectedProjectMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.username} ({member.role})
                      </option>
                    ))}
                  </select>
                  {formData.project && selectedProjectMembers.length === 0 && (
                    <p className="form-hint">Add members to this project before creating tasks.</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="due_date">Due Date</label>
                  <input
                    type="date"
                    id="due_date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div className="form-group">
                    <label htmlFor="estimated_hours">Est. Hours (taskcoach)</label>
                    <input
                      type="number"
                      id="estimated_hours"
                      step="0.5"
                      min="0"
                      value={formData.estimated_hours || 0}
                      onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="recurrence">Recurrence (django-todo)</label>
                    <select
                      id="recurrence"
                      value={formData.recurrence || "none"}
                      onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                    >
                      <option value="none">None</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="weekdays">Weekdays</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={!formData.project || !formData.assigned_to}>
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Task Form */}
        {showEditForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Edit Task</h3>
                <button className="close-btn" onClick={() => setShowEditForm(false)}>×</button>
              </div>
              <form onSubmit={handleEditTask} className="task-form">
                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <label htmlFor="edit_title" style={{ margin: 0 }}>Task Title *</label>
                    {isSpeechSupported() && (
                      <button
                        type="button"
                        onClick={handleVoiceTitle}
                        style={{
                          background: isListeningTitle ? "#ef4444" : "var(--brand, #4f46e5)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "9999px",
                          padding: "2px 8px",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          transition: "all 0.15s ease",
                        }}
                        title="Click to speak task title"
                      >
                        🎙️ {isListeningTitle ? "Listening..." : "Dictate Title"}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    id="edit_title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit_description">Description</label>
                  <textarea
                    id="edit_description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit_project">Project *</label>
                  <select
                    id="edit_project"
                    value={formData.project}
                    onChange={(e) => setFormData({...formData, project: e.target.value})}
                    required
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit_assigned_to">Assign To *</label>
                  <select
                    id="edit_assigned_to"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                    disabled={!formData.project || selectedProjectMembers.length === 0}
                    required
                  >
                    <option value="">
                      {!formData.project ? "Select a project first" : selectedProjectMembers.length === 0 ? "No project members available" : "Select assignee"}
                    </option>
                    {selectedProjectMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.username} ({member.role})
                      </option>
                    ))}
                  </select>
                  {formData.project && selectedProjectMembers.length === 0 && (
                    <p className="form-hint">Add members to this project before assigning tasks.</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit_priority">Priority</label>
                  <select
                    id="edit_priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit_due_date">Due Date</label>
                  <input
                    type="date"
                    id="edit_due_date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div className="form-group">
                    <label htmlFor="edit_estimated_hours">Est. Hours (taskcoach)</label>
                    <input
                      type="number"
                      id="edit_estimated_hours"
                      step="0.5"
                      min="0"
                      value={formData.estimated_hours || 0}
                      onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit_recurrence">Recurrence (django-todo)</label>
                    <select
                      id="edit_recurrence"
                      value={formData.recurrence || "none"}
                      onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                    >
                      <option value="none">None</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="weekdays">Weekdays</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={!formData.project || !formData.assigned_to}>
                    Update Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskManagement;
