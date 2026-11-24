import { useState, useEffect } from "react";
import { organizationAPI, projectAPI, clientAPI } from "../utils/api";
import ProjectDetails from "./ProjectDetails";
import "./Management.css";

function ProjectManagement({ userRole, onProjectUpdate, onClose }) {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [organizationMembers, setOrganizationMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    end_date: "",
    client: null,
    team_member_ids: [],
    manager_ids: []
  });

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const [data, members, clientsList] = await Promise.all([
        projectAPI.getAll(),
        organizationAPI.getMembers().catch(() => []),
        clientAPI.getAll().catch(() => []),
      ]);
      setProjects(data);
      setOrganizationMembers(members);
      setClients(clientsList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await projectAPI.create(formData);
      setShowCreateForm(false);
      resetForm();
      await loadProjects();
      onProjectUpdate(); // Refresh the main board
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditProject = async (e) => {
    e.preventDefault();
    try {
      await projectAPI.update(selectedProject.id, formData);
      setShowEditForm(false);
      setSelectedProject(null);
      resetForm();
      await loadProjects();
      onProjectUpdate(); // Refresh the main board
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return;
    }
    
    try {
      await projectAPI.delete(projectId);
      await loadProjects();
      onProjectUpdate(); // Refresh the main board
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      end_date: "",
      client: null,
      team_member_ids: [],
      manager_ids: []
    });
  };

  const openEditForm = (project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      end_date: project.end_date ? project.end_date.split('T')[0] : "",
      client: project.client || null,
      team_member_ids: project.members ? project.members.map(m => m.user_id) : [],
      manager_ids: project.members ? project.members.filter(m => m.role === 'manager').map(m => m.user_id) : []
    });
    setShowEditForm(true);
  };

  const toggleProjectMember = (userId) => {
    const normalizedId = Number(userId);
    setFormData((prev) => {
      const isSelected = prev.team_member_ids.includes(normalizedId);
      return {
        ...prev,
        team_member_ids: isSelected
          ? prev.team_member_ids.filter((id) => id !== normalizedId)
          : [...prev.team_member_ids, normalizedId],
        manager_ids: isSelected
          ? prev.manager_ids.filter((id) => id !== normalizedId)
          : prev.manager_ids,
      };
    });
  };

  const setProjectRole = (userId, role) => {
    const normalizedId = Number(userId);
    setFormData((prev) => ({
      ...prev,
      team_member_ids: prev.team_member_ids.includes(normalizedId)
        ? prev.team_member_ids
        : [...prev.team_member_ids, normalizedId],
      manager_ids: role === "manager"
        ? [...new Set([...prev.manager_ids, normalizedId])]
        : prev.manager_ids.filter((id) => id !== normalizedId),
    }));
  };

  const renderMemberSelector = () => (
    <div className="form-group">
      <label>Project Members</label>
      <div className="member-picker">
        {organizationMembers.length === 0 ? (
          <p className="picker-empty">Add organization members first, then assign them to projects.</p>
        ) : (
          organizationMembers.map((member) => {
            const selected = member.role === "owner" || formData.team_member_ids.includes(member.user_id);
            const projectRole = formData.manager_ids.includes(member.user_id) ? "manager" : "member";
            return (
              <div className="member-picker-row" key={member.user_id}>
                <label className="member-check">
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={member.role === "owner"}
                    onChange={() => toggleProjectMember(member.user_id)}
                  />
                  <span>
                    <strong>{member.username}</strong>
                    <small>{member.email}</small>
                  </span>
                </label>
                <select
                  value={member.role === "owner" ? "manager" : projectRole}
                  disabled={member.role === "owner" || !selected}
                  onChange={(event) => setProjectRole(member.user_id, event.target.value)}
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            );
          })
        )}
      </div>
      <p className="form-hint">The Organization Owner is added as a project manager automatically.</p>
    </div>
  );

  const openProjectDetails = (project) => {
    if (!project || !project.id || project.id === 'undefined' || project.id === undefined) {
      setError("Invalid project data");
      return;
    }
    setSelectedProject(project);
    setShowProjectDetails(true);
  };

  const handleCloseProjectDetails = () => {
    setShowProjectDetails(false);
    setSelectedProject(null);
  };

  const handleProjectUpdate = async () => {
    await loadProjects();
    onProjectUpdate(); // Call the parent's update function
  };

  // Check if user can create projects (organization owner only)
  const canCreateProject = userRole === 'owner';
  
  // Check if user can edit/delete project (owner or project manager)
  const canEditProject = (project) => {
    return userRole === 'owner' || 
           (project.members && project.members.some(m => m.role === 'manager'));
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading-spinner"></div>
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content project-management">
        <div className="modal-header">
          <h2>Project Management</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        <div className="project-actions">
          {canCreateProject && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              Create New Project
            </button>
          )}
        </div>

        <div className="projects-list">
          <h3>Projects</h3>
          {projects.length === 0 ? (
            <p className="no-projects">No projects found.</p>
          ) : (
            <div className="project-cards">
              {projects.map((project) => (
                <div key={project.id} className="project-card">
                  <div className="project-info">
                    <h4>{project.name}</h4>
                    <p className="project-description">
                      {project.description || "No description provided"}
                    </p>
                    <div className="project-meta">
                      {project.client_name && (
                        <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--brand)", background: "rgba(37,99,235,0.1)", padding: "2px 8px", borderRadius: "6px" }}>
                          🏢 {project.client_name}
                        </span>
                      )}
                      <span className="project-members">
                        {project.members ? project.members.length : 0} members
                      </span>
                      {project.end_date && (
                        <span className="project-end-date">
                          Due: {new Date(project.end_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="project-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={() => openProjectDetails(project)}
                    >
                      View Details
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => openEditForm(project)}
                      disabled={!canEditProject(project)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleDeleteProject(project.id)}
                      disabled={!canEditProject(project)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Project Form */}
        {showCreateForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Create New Project</h3>
                <button className="close-btn" onClick={() => setShowCreateForm(false)}>×</button>
              </div>
              <form onSubmit={handleCreateProject} className="project-form">
                <div className="form-group">
                  <label htmlFor="name">Project Name *</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                
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
                  <label htmlFor="end_date">End Date</label>
                  <input
                    type="date"
                    id="end_date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="client">Client Account (Mini-CRM)</label>
                  <select
                    id="client"
                    value={formData.client || ""}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value ? Number(e.target.value) : null })}
                  >
                    <option value="">No Client (Internal Project)</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {renderMemberSelector()}
                
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Project Form */}
        {showEditForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Edit Project</h3>
                <button className="close-btn" onClick={() => setShowEditForm(false)}>×</button>
              </div>
              <form onSubmit={handleEditProject} className="project-form">
                <div className="form-group">
                  <label htmlFor="edit_name">Project Name *</label>
                  <input
                    type="text"
                    id="edit_name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                  <label htmlFor="edit_end_date">End Date</label>
                  <input
                    type="date"
                    id="edit_end_date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit_client">Client Account (Mini-CRM)</label>
                  <select
                    id="edit_client"
                    value={formData.client || ""}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value ? Number(e.target.value) : null })}
                  >
                    <option value="">No Client (Internal Project)</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {renderMemberSelector()}
                
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Project Details Modal */}
        {showProjectDetails && selectedProject && (
          <ProjectDetails
            projectId={selectedProject.id}
            onClose={handleCloseProjectDetails}
            onProjectUpdate={handleProjectUpdate}
          />
        )}
      </div>
    </div>
  );
}

export default ProjectManagement;
