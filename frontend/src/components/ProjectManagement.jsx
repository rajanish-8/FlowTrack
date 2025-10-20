import { useState, useEffect } from "react";
import { projectAPI } from "../utils/api";
import ProjectDetails from "./ProjectDetails";
import "./Management.css";

function ProjectManagement({ userRole, onProjectUpdate, onClose }) {
  const [projects, setProjects] = useState([]);
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
      const data = await projectAPI.getAll();
      setProjects(data);
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
      // Handle specific validation errors
      if (err.message.includes("already enrolled in other projects")) {
        setError("One or more selected users are already assigned to other projects. Each user can only be in one project at a time.");
      } else {
        setError(err.message);
      }
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
      // Handle specific validation errors
      if (err.message.includes("already enrolled in other projects")) {
        setError("One or more selected users are already assigned to other projects. Each user can only be in one project at a time.");
      } else {
        setError(err.message);
      }
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
      team_member_ids: project.members ? project.members.map(m => m.id) : [],
      manager_ids: project.members ? project.members.filter(m => m.role === 'manager').map(m => m.id) : []
    });
    setShowEditForm(true);
  };

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

  // Check if user can create projects (super admin only)
  const canCreateProject = userRole === 'super_admin';
  
  // Check if user can edit/delete project (super admin or project manager)
  const canEditProject = (project) => {
    return userRole === 'super_admin' || 
           (project.members && project.members.some(m => m.role === 'manager' && m.user_id === userRole));
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
