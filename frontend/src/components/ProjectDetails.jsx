import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL, projectAPI } from "../utils/api";
import "./Management.css";

function ProjectDetails({ projectId, onClose, onProjectUpdate }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    end_date: ""
  });
  const [members, setMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberData, setNewMemberData] = useState({
    user_id: "",
    role: "member"
  });

  const loadAvailableUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/`, {
        headers: {
          "Authorization": `Token ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        const users = await response.json();
        setAvailableUsers(users);
      }
    } catch (err) {
      console.error("Error loading users:", err);
    }
  }, []);

  const loadProjectDetails = useCallback(async () => {
    if (!projectId || projectId === 'undefined' || projectId === undefined) {
      setError("No project ID provided");
      return;
    }
    
    try {
      setLoading(true);
      const projectData = await projectAPI.getById(projectId);
      setProject(projectData);
      setFormData({
        name: projectData.name,
        description: projectData.description || "",
        end_date: projectData.end_date ? projectData.end_date.split('T')[0] : ""
      });
      
      // Load project members
      if (projectData.members) {
        setMembers(projectData.members);
      }
      
      // Load all users for adding new members
      await loadAvailableUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loadAvailableUsers, projectId]);

  // Load project details
  useEffect(() => {
    if (projectId && projectId !== 'undefined' && projectId !== undefined) {
      loadProjectDetails();
    }
  }, [loadProjectDetails, projectId]);

  const handleSave = async () => {
    if (!projectId || projectId === 'undefined' || projectId === undefined) {
      setError("No project ID provided");
      return;
    }
    
    try {
      await projectAPI.update(projectId, formData);
      setEditing(false);
      await loadProjectDetails();
      onProjectUpdate();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: project.name,
      description: project.description || "",
      end_date: project.end_date ? project.end_date.split('T')[0] : ""
    });
    setEditing(false);
  };

  const handleAddMember = async () => {
    if (!projectId || projectId === 'undefined' || projectId === undefined) {
      setError("No project ID provided");
      return;
    }
    
    try {
      await projectAPI.update(projectId, {
        ...formData,
        team_member_ids: [...members.map(m => m.user_id), newMemberData.user_id],
        manager_ids: [
          ...members.filter(m => m.role === 'manager').map(m => m.user_id),
          ...(newMemberData.role === 'manager' ? [newMemberData.user_id] : [])
        ]
      });
      
      setShowAddMember(false);
      setNewMemberData({ user_id: "", role: "member" });
      await loadProjectDetails();
    } catch (err) {
      // Handle specific validation errors
      if (err.message.includes("already enrolled in other projects")) {
        setError("This user is already assigned to another project. Each user can only be in one project at a time.");
      } else {
        setError(err.message);
      }
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!projectId || projectId === 'undefined' || projectId === undefined) {
      setError("No project ID provided");
      return;
    }
    
    if (!window.confirm("Are you sure you want to remove this member from the project?")) {
      return;
    }
    
    try {
      const updatedMembers = members.filter(m => m.id !== memberId);
      await projectAPI.update(projectId, {
        ...formData,
        team_member_ids: updatedMembers.map(m => m.user_id),
        manager_ids: updatedMembers.filter(m => m.role === 'manager').map(m => m.user_id)
      });
      
      await loadProjectDetails();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    if (!projectId || projectId === 'undefined' || projectId === undefined) {
      setError("No project ID provided");
      return;
    }
    
    try {
      const updatedMembers = members.map(m => 
        m.id === memberId ? { ...m, role: newRole } : m
      );
      
      await projectAPI.update(projectId, {
        ...formData,
        team_member_ids: updatedMembers.map(m => m.user_id),
        manager_ids: updatedMembers.filter(m => m.role === 'manager').map(m => m.user_id)
      });
      
      await loadProjectDetails();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!projectId || projectId === 'undefined' || projectId === undefined) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="error-message">
            <p>No project selected</p>
            <button onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading-spinner"></div>
          <p>Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content project-details">
        <div className="modal-header">
          <h2>Project Details</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        <div className="project-details-content">
          {/* Project Information Section */}
          <div className="project-info-section">
            <div className="section-header">
              <h3>Project Information</h3>
              {!editing && (
                <button 
                  className="btn btn-secondary"
                  onClick={() => setEditing(true)}
                >
                  Edit Project
                </button>
              )}
            </div>

            <div className="project-fields">
              <div className="field-group">
                <label>Project Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="form-input"
                  />
                ) : (
                  <div className="field-value">{project.name}</div>
                )}
              </div>

              <div className="field-group">
                <label>Description</label>
                {editing ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="form-textarea"
                    rows="3"
                  />
                ) : (
                  <div className="field-value">{project.description || "No description provided"}</div>
                )}
              </div>

              <div className="field-group">
                <label>End Date</label>
                {editing ? (
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="form-input"
                  />
                ) : (
                  <div className="field-value">
                    {project.end_date ? new Date(project.end_date).toLocaleDateString() : "No end date set"}
                  </div>
                )}
              </div>

              <div className="field-group">
                <label>Created</label>
                <div className="field-value">
                  {new Date(project.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            {editing && (
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSave}>
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {/* Project Members Section */}
          <div className="members-section">
            <div className="section-header">
              <h3>Project Members</h3>
              <button 
                className="btn btn-primary"
                onClick={() => setShowAddMember(true)}
              >
                Add Member
              </button>
            </div>

            <div className="members-list">
              {members.length === 0 ? (
                <p className="no-members">No members assigned to this project.</p>
              ) : (
                members.map((member) => (
                  <div key={member.id} className="member-card">
                    <div className="member-info">
                      <div className="member-avatar">
                        <img 
                          src={member.profile_picture || "/default-avatar.svg"} 
                          alt={member.username}
                        />
                      </div>
                      <div className="member-details">
                        <div className="member-name">{member.username}</div>
                        <div className="member-email">{member.email}</div>
                      </div>
                    </div>
                    <div className="member-actions">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="role-select"
                      >
                        <option value="member">Member</option>
                        <option value="manager">Manager</option>
                      </select>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemoveMember(member.id)}
                        title="Remove member"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add Member Modal */}
          {showAddMember && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>Add Member to Project</h3>
                  <button className="close-btn" onClick={() => setShowAddMember(false)}>×</button>
                </div>
                <div className="form-group">
                  <label>Select User</label>
                  <select
                    value={newMemberData.user_id}
                    onChange={(e) => setNewMemberData({...newMemberData, user_id: e.target.value})}
                    className="form-input"
                  >
                    <option value="">Choose a user...</option>
                    {availableUsers
                      .filter(user => !members.some(m => m.user_id === user.id))
                      .map(user => (
                        <option key={user.id} value={user.id}>
                          {user.username} ({user.email})
                        </option>
                      ))
                    }
                  </select>
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={newMemberData.role}
                    onChange={(e) => setNewMemberData({...newMemberData, role: e.target.value})}
                    className="form-input"
                  >
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setShowAddMember(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleAddMember}
                    disabled={!newMemberData.user_id}
                  >
                    Add Member
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectDetails;
