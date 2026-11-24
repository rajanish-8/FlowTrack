import { useState, useEffect } from "react";
import { activityAPI } from "../utils/api";
import "./AIComponents.css";

function ActivityFeedDrawer({ projectId, isOpen, onClose }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && projectId) {
      loadActivities();
    }
  }, [isOpen, projectId]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const res = await activityAPI.getByProjectId(projectId);
      setActivities(res);
    } catch (err) {
      console.error("Failed to load activity feed:", err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "task_created":
        return "➕";
      case "task_moved":
        return "➡️";
      case "comment_added":
        return "💬";
      case "checklist_updated":
        return "☑️";
      case "task_deleted":
        return "🗑️";
      default:
        return "📌";
    }
  };

  const formatRelativeTime = (dateString) => {
    try {
      const diff = Math.floor((new Date() - new Date(dateString)) / 1000);
      if (diff < 60) return "Just now";
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch {
      return dateString;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-modal-overlay" onClick={onClose} style={{ justifyContent: "flex-end", padding: 0 }}>
      <div
        className="clay-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "380px",
          maxWidth: "100%",
          height: "100vh",
          background: "var(--panel)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "-8px 0 24px rgba(0, 0, 0, 0.15)",
          display: "flex",
          flexDirection: "column",
          animation: "slide-left 0.25s ease-out",
          zIndex: 1060,
        }}
      >
        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel)" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.05rem", color: "var(--text)" }}>📜 Live Activity Feed</h3>
            <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>Recent team audit trail</span>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={loadActivities}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}
              title="Refresh Activity"
            >
              🔄
            </button>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.3rem", color: "var(--text-muted)" }}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
          {loading ? (
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", marginTop: "20px" }}>Loading activities...</p>
          ) : activities.length === 0 ? (
            <div style={{ textAlign: "center", marginTop: "40px", color: "var(--text-muted)" }}>
              <p style={{ fontSize: "1.5rem", margin: "0 0 8px 0" }}>⏳</p>
              <p style={{ fontSize: "0.88rem" }}>No recent activity recorded yet.</p>
            </div>
          ) : (
            activities.map((a) => (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  gap: "12px",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  fontSize: "0.84rem",
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>{getActionIcon(a.action)}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, color: "var(--text)", fontWeight: 500, lineHeight: 1.4 }}>{a.details}</p>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px", display: "inline-block" }}>
                    {formatRelativeTime(a.created_at)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ActivityFeedDrawer;
