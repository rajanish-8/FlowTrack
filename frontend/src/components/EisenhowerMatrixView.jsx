import defaultAvatar from "../assets/default-avatar.svg";

function EisenhowerMatrixView({ tasks, onViewDetails, onAdvanceTask }) {
  const isUrgent = (task) => {
    if (!task.due_date) return false;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(task.due_date);
      due.setHours(0, 0, 0, 0);
      const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      return diff <= 5; // due within 5 days or overdue
    } catch {
      return false;
    }
  };

  const isImportant = (task) => {
    const p = String(task.priority_level).toLowerCase();
    return p === "high" || p === "medium";
  };

  // 4 Quadrants
  const q1 = tasks.filter((t) => isUrgent(t) && isImportant(t)); // Do First
  const q2 = tasks.filter((t) => !isUrgent(t) && isImportant(t)); // Schedule
  const q3 = tasks.filter((t) => isUrgent(t) && !isImportant(t)); // Delegate
  const q4 = tasks.filter((t) => !isUrgent(t) && !isImportant(t)); // Backlog

  const quadrants = [
    {
      id: "q1",
      title: "🔥 Q1: Do First",
      subtitle: "Urgent & Important (Immediate Action)",
      tasks: q1,
      themeColor: "#ef4444",
      bg: "rgba(239, 68, 68, 0.05)",
      border: "rgba(239, 68, 68, 0.25)",
    },
    {
      id: "q2",
      title: "📅 Q2: Schedule",
      subtitle: "Important, Not Urgent (Strategic Goals)",
      tasks: q2,
      themeColor: "#3b82f6",
      bg: "rgba(59, 130, 246, 0.05)",
      border: "rgba(59, 130, 246, 0.25)",
    },
    {
      id: "q3",
      title: "🤝 Q3: Delegate",
      subtitle: "Urgent, Not Important (Fast Turnaround)",
      tasks: q3,
      themeColor: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.05)",
      border: "rgba(245, 158, 11, 0.25)",
    },
    {
      id: "q4",
      title: "🌱 Q4: Backlog & Eliminate",
      subtitle: "Not Urgent, Not Important (Low Priority)",
      tasks: q4,
      themeColor: "#10b981",
      bg: "rgba(16, 185, 129, 0.05)",
      border: "rgba(16, 185, 129, 0.25)",
    },
  ];

  return (
    <div style={{ marginTop: "12px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "16px",
        }}
      >
        {quadrants.map((q) => (
          <div
            key={q.id}
            className="clay-card"
            style={{
              borderRadius: "16px",
              padding: "18px",
              background: q.bg,
              border: `1.5px solid ${q.border}`,
              boxShadow: "var(--shadow-soft)",
              display: "flex",
              flexDirection: "column",
              minHeight: "260px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: q.themeColor }}>
                  {q.title}
                </h3>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{q.subtitle}</span>
              </div>
              <span
                style={{
                  background: q.themeColor,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.74rem",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                }}
              >
                {q.tasks.length}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, overflowY: "auto", maxHeight: "380px" }}>
              {q.tasks.length === 0 ? (
                <div style={{ margin: "auto", textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem", fontStyle: "italic", padding: "20px" }}>
                  No tasks currently in this quadrant.
                </div>
              ) : (
                q.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onViewDetails && onViewDetails(task.id)}
                    style={{
                      background: "var(--panel)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      padding: "10px 12px",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
                      transition: "transform 0.15s, box-shadow 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.86rem", color: "var(--text)" }}>{task.title}</span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "9999px",
                          background: task.status === "Done" ? "#dcfce7" : "#e0e7ff",
                          color: task.status === "Done" ? "#166534" : "#4338ca",
                        }}
                      >
                        {task.status}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.76rem", color: "var(--text-muted)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <img
                          src={task.user_profile_picture || defaultAvatar}
                          alt=""
                          style={{ width: "16px", height: "16px", borderRadius: "50%" }}
                        />
                        <span>{task.user_username || "Unassigned"}</span>
                      </div>
                      <span>{task.due_date ? new Date(task.due_date).toLocaleDateString() : "No deadline"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EisenhowerMatrixView;
