import { useState, useEffect } from "react";
import { organizationAPI } from "../utils/api";
import defaultAvatar from "../assets/default-avatar.svg";

function TeamDirectoryView({ userRole, currentUser, tasks = [], onViewTask }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [formData, setFormData] = useState({ email: "", role: "member" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await organizationAPI.getMembers();
      setMembers(data);
    } catch (err) {
      setError("Failed to load organization members: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!formData.email.trim() || submitting) return;
    try {
      setSubmitting(true);
      setError("");
      await organizationAPI.addMember(formData);
      setFormData({ email: "", role: "member" });
      setShowInviteForm(false);
      await loadMembers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async (memberId, role) => {
    try {
      setError("");
      await organizationAPI.updateMember(memberId, { role });
      await loadMembers();
    } catch (err) {
      setError("Could not update role: " + err.message);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "owner":
        return { label: "👑 Owner", bg: "rgba(255, 174, 25, 0.15)", color: "#ffae19", border: "rgba(255, 174, 25, 0.4)" };
      case "manager":
        return { label: "🛡️ Manager", bg: "rgba(0, 210, 255, 0.15)", color: "#00d2ff", border: "rgba(0, 210, 255, 0.4)" };
      default:
        return { label: "💻 Member", bg: "rgba(168, 85, 247, 0.15)", color: "#a855f7", border: "rgba(168, 85, 247, 0.4)" };
    }
  };

  // Calculate task counts per user
  const getUserTasks = (username, userId) => {
    return tasks.filter((t) => t.user_username === username || t.assigned_user_id === userId);
  };

  return (
    <div style={{ padding: "0 4px", marginTop: "12px", animation: "fade-in 0.25s ease-out" }}>
      {/* Hero Header */}
      <div
        className="board-hero clay-card spotlight-card"
        style={{
          borderRadius: "20px",
          padding: "24px 28px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span className="status-cosmic-pill">
              <span className="status-cosmic-dot" />
              Organization Roster
            </span>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              {members.length} Active Collaborators
            </span>
          </div>
          <h1 style={{ fontSize: "2.1rem", fontWeight: 900, margin: "4px 0" }}>
            <span className="cosmic-outline-text" style={{ marginRight: "10px" }}>TEAM</span>
            <span className="shimmer-headline gradient-text">DIRECTORY</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>
            Manage team roles, member assignments, and workload distribution in real time.
          </p>
        </div>

        {userRole === "owner" && (
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            style={{
              padding: "10px 20px",
              borderRadius: "9999px",
              background: "linear-gradient(135deg, #00d2ff 0%, #0284c7 100%)",
              color: "#000",
              fontWeight: 800,
              fontSize: "0.84rem",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0, 210, 255, 0.4)",
              transition: "transform 0.15s ease",
            }}
          >
            {showInviteForm ? "Close Form" : "➕ Invite Member"}
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: "12px 18px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#f87171", marginBottom: "16px", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {/* Invite Member Drawer Form */}
      {showInviteForm && (
        <form
          onSubmit={handleAddMember}
          className="clay-card spotlight-card"
          style={{
            padding: "20px 24px",
            borderRadius: "16px",
            background: "var(--panel)",
            border: "1px solid rgba(0, 210, 255, 0.3)",
            marginBottom: "20px",
            display: "flex",
            alignItems: "flex-end",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: "220px" }}>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>
              Collaborator Email
            </label>
            <input
              type="email"
              placeholder="e.g. teammate@flowtrack.test"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: "0.86rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ width: "160px" }}>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>
              Role Assignment
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: "0.86rem",
                outline: "none",
              }}
            >
              <option value="member">Member</option>
              <option value="manager">Manager</option>
              <option value="owner">Owner</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "9px 20px",
              borderRadius: "10px",
              background: "#00d2ff",
              color: "#000",
              fontWeight: 800,
              fontSize: "0.84rem",
              border: "none",
              cursor: submitting ? "wait" : "pointer",
            }}
          >
            {submitting ? "Inviting..." : "Send Invite"}
          </button>
        </form>
      )}

      {/* Members Bento Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "16px",
        }}
      >
        {loading ? (
          <div style={{ padding: "40px", color: "var(--text-muted)" }}>Loading roster...</div>
        ) : members.length === 0 ? (
          <div style={{ padding: "40px", color: "var(--text-muted)" }}>No members found.</div>
        ) : (
          members.map((m) => {
            const roleStyle = getRoleBadge(m.role);
            const userAssigned = getUserTasks(m.user?.username, m.user?.id);
            const userDone = userAssigned.filter((t) => t.status === "Done").length;

            return (
              <div
                key={m.id}
                className="clay-card spotlight-card"
                style={{
                  borderRadius: "16px",
                  padding: "20px",
                  background: "var(--panel)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-soft)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  transition: "transform 0.18s ease, border-color 0.18s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.borderColor = "rgba(0, 210, 255, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                {/* Header User Card */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ position: "relative" }}>
                      <img
                        src={m.user?.profile_picture || defaultAvatar}
                        alt=""
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: `2px solid ${roleStyle.color}`,
                          boxShadow: `0 0 10px ${roleStyle.color}44`,
                        }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          bottom: "1px",
                          right: "1px",
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: "#10b981",
                          border: "2px solid var(--panel)",
                        }}
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text)" }}>
                        {m.user?.username || m.user?.email}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {m.user?.email}
                      </div>
                    </div>
                  </div>

                  {userRole === "owner" && m.user?.id !== currentUser?.id ? (
                    <select
                      value={m.role}
                      onChange={(e) => handleUpdateRole(m.id, e.target.value)}
                      style={{
                        padding: "3px 8px",
                        borderRadius: "9999px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        background: roleStyle.bg,
                        color: roleStyle.color,
                        border: `1px solid ${roleStyle.border}`,
                        outline: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="member">Member</option>
                      <option value="manager">Manager</option>
                      <option value="owner">Owner</option>
                    </select>
                  ) : (
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "9999px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        background: roleStyle.bg,
                        color: roleStyle.color,
                        border: `1px solid ${roleStyle.border}`,
                      }}
                    >
                      {roleStyle.label}
                    </span>
                  )}
                </div>

                {/* Workload Metric */}
                <div style={{ background: "rgba(255, 255, 255, 0.03)", borderRadius: "10px", padding: "10px 12px", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", marginBottom: "4px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Sprint Workload</span>
                    <strong style={{ color: "var(--text)" }}>{userDone}/{userAssigned.length} Tasks Complete</strong>
                  </div>
                  <div style={{ height: "4px", background: "var(--border)", borderRadius: "9999px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: userAssigned.length > 0 ? `${(userDone / userAssigned.length) * 100}%` : "0%",
                        height: "100%",
                        background: "linear-gradient(90deg, #ffae19 0%, #00d2ff 100%)",
                      }}
                    />
                  </div>
                </div>

                {/* Assigned Task Chips */}
                {userAssigned.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {userAssigned.slice(0, 3).map((t) => (
                      <span
                        key={t.id}
                        onClick={() => onViewTask && onViewTask(t.id)}
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: "var(--bg)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                          cursor: "pointer",
                          maxWidth: "140px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={t.title}
                      >
                        📌 {t.title}
                      </span>
                    ))}
                    {userAssigned.length > 3 && (
                      <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", alignSelf: "center" }}>
                        +{userAssigned.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default TeamDirectoryView;
