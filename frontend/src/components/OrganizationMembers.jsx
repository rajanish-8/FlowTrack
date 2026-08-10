import { useEffect, useState } from "react";
import { organizationAPI } from "../utils/api";
import defaultAvatar from "../assets/default-avatar.svg";
import "./Management.css";

function OrganizationMembers({ onClose }) {
  const [members, setMembers] = useState([]);
  const [formData, setFormData] = useState({ email: "", role: "member" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await organizationAPI.getMembers();
      setMembers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const addMember = async (event) => {
    event.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);
      setError("");
      await organizationAPI.addMember(formData);
      setFormData({ email: "", role: "member" });
      await loadMembers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateRole = async (memberId, role) => {
    try {
      setError("");
      await organizationAPI.updateMember(memberId, { role });
      await loadMembers();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeMember = async (memberId) => {
    if (!window.confirm("Remove this user from the organization?")) return;
    try {
      setError("");
      await organizationAPI.removeMember(memberId);
      await loadMembers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content project-details">
        <div className="modal-header">
          <h2>Organization Members</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError("")}>Dismiss</button>
          </div>
        )}

        <form className="project-form organization-member-form" onSubmit={addMember}>
          <div className="form-group">
            <label htmlFor="member-email">Add existing user by email</label>
            <input
              id="member-email"
              type="email"
              value={formData.email}
              onChange={(event) => setFormData({ ...formData, email: event.target.value })}
              placeholder="teammate@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="member-role">Role</label>
            <select
              id="member-role"
              value={formData.role}
              onChange={(event) => setFormData({ ...formData, role: event.target.value })}
            >
              <option value="member">Member</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Adding..." : "Add Member"}
          </button>
        </form>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading members...</p>
          </div>
        ) : (
          <div className="members-list organization-members-list">
            {members.map((member) => (
              <div className="member-card" key={member.id}>
                <div className="member-info">
                  <div className="member-avatar">
                    <img src={member.profile_picture || defaultAvatar} alt={member.username} />
                  </div>
                  <div className="member-details">
                    <div className="member-name">{member.username}</div>
                    <div className="member-email">{member.email}</div>
                  </div>
                </div>
                <div className="member-actions">
                  <select
                    className="role-select"
                    value={member.role}
                    disabled={member.role === "owner"}
                    onChange={(event) => updateRole(member.id, event.target.value)}
                  >
                    <option value="owner">Owner</option>
                    <option value="manager">Manager</option>
                    <option value="member">Member</option>
                  </select>
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={member.role === "owner"}
                    onClick={() => removeMember(member.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrganizationMembers;
