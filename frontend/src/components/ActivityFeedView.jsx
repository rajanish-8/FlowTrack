import { useState, useEffect } from "react";
import { activityAPI } from "../utils/api";

function ActivityFeedView({ projectId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("all");

  const loadActivities = async () => {
    try {
      setLoading(true);
      const res = await activityAPI.getByProjectId(projectId);
      setActivities(res || []);
    } catch (err) {
      console.error("Failed to load activity feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadActivities();
    }
  }, [projectId]);

  const getActionBadge = (action) => {
    switch (action) {
      case "task_created":
        return { label: "Created", icon: "➕", bg: "#dbeafe", color: "#1d4ed8" };
      case "task_moved":
        return { label: "Moved", icon: "➡️", bg: "#fef3c7", color: "#b45309" };
      case "comment_added":
        return { label: "Comment", icon: "💬", bg: "#f3e8ff", color: "#7e22ce" };
      case "checklist_updated":
        return { label: "Checklist", icon: "☑️", bg: "#dcfce7", color: "#15803d" };
      case "task_deleted":
        return { label: "Deleted", icon: "🗑️", bg: "#fee2e2", color: "#b91c1c" };
      default:
        return { label: "Updated", icon: "📌", bg: "var(--bg)", color: "var(--text)" };
    }
  };

  const formatTime = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  const filtered = activities.filter((act) => {
    if (filterAction === "all") return true;
    return act.action === filterAction;
  });

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "10px 16px 40px" }}>
      {/* Header */}
      <div
        className="clay-card"
        style={{
          padding: "20px 24px",
          borderRadius: "18px",
          background: "var(--panel)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-soft)",
          marginBottom: "20px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 800,
              textTransform: "uppercase",
              padding: "3px 8px",
              borderRadius: "6px",
              background: "rgba(99, 102, 241, 0.12)",
              color: "var(--brand)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
            }}
          >
            📜 AUDIT TRAIL
          </span>
          <h2 style={{ margin: "6px 0 2px", fontSize: "1.4rem", fontWeight: 800, color: "var(--text)" }}>
            Live Sprint Activity & Event Log
          </h2>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Chronological audit trail of task creations, stage advancements, and completions
          </p>
        </div>

        <button
          onClick={loadActivities}
          style={{
            padding: "8px 16px",
            borderRadius: "10px",
            background: "var(--bg)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            fontSize: "0.82rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          🔄 Refresh Log
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
        {[
          { id: "all", label: "All Events" },
          { id: "task_created", label: "➕ Creations" },
          { id: "task_moved", label: "➡️ Stage Moves" },
          { id: "checklist_updated", label: "☑️ Checklists" },
          { id: "comment_added", label: "💬 Comments" },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilterAction(btn.id)}
            style={{
              padding: "6px 14px",
              borderRadius: "9999px",
              fontSize: "0.8rem",
              fontWeight: 700,
              border: filterAction === btn.id ? "1px solid var(--brand)" : "1px solid var(--border)",
              background: filterAction === btn.id ? "var(--brand)" : "var(--panel)",
              color: filterAction === btn.id ? "#fff" : "var(--text)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Activities List */}
      <div
        className="clay-card"
        style={{
          borderRadius: "18px",
          background: "var(--panel)",
          border: "1px solid var(--border)",
          padding: "20px",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            <div className="loading-spinner" style={{ margin: "0 auto 12px" }}></div>
            Loading audit feed...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📜</div>
            <strong>No activity recorded yet for this view</strong>
            <p style={{ margin: "4px 0 0", fontSize: "0.82rem" }}>
              Move or create tasks to see real-time updates recorded here.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filtered.map((act) => {
              const badge = getActionBadge(act.action);
              return (
                <div
                  key={act.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        background: badge.bg,
                        color: badge.color,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {badge.icon} {badge.label}
                    </span>
                    <div>
                      <div style={{ fontSize: "0.86rem", fontWeight: 600, color: "var(--text)" }}>
                        {act.details || `Task action performed on #${act.task || ""}`}
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                        By <strong>{act.user_username || "User"}</strong> • {formatTime(act.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityFeedView;
