import { useState } from "react";
import defaultAvatar from "../assets/default-avatar.svg";

function RoadmapView({ projects = [], selectedProject, tasks = [], onViewTask }) {
  const [filterPriority, setFilterPriority] = useState("all");

  const displayTasks = tasks.filter((t) => {
    if (filterPriority === "all") return true;
    return String(t.priority_level || "").toLowerCase() === filterPriority;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Done":
        return { bg: "#10b981", text: "#fff", border: "#059669", label: "Completed" };
      case "In Progress":
        return { bg: "#ffae19", text: "#000", border: "#d97706", label: "Active" };
      case "Review":
        return { bg: "#a855f7", text: "#fff", border: "#7e22ce", label: "Review" };
      default:
        return { bg: "#00d2ff", text: "#000", border: "#0284c7", label: "Planned" };
    }
  };

  // Timeline columns (Sprints / Weeks)
  const sprints = [
    { id: "w1", title: "Week 1", subtitle: "Sprint Foundation", range: "Nov 1 – Nov 7" },
    { id: "w2", title: "Week 2", subtitle: "Core Engine", range: "Nov 8 – Nov 14" },
    { id: "w3", title: "Week 3", subtitle: "Features & AI", range: "Nov 15 – Nov 21", isCurrent: true },
    { id: "w4", title: "Week 4", subtitle: "Optimization", range: "Nov 22 – Nov 28" },
    { id: "w5", title: "Sprint 2", subtitle: "Production Launch", range: "Dec 1 – Dec 15" },
  ];

  // Helper to place task along timeline
  const getTaskSprintIndex = (task, idx) => {
    if (!task.due_date) return idx % sprints.length;
    try {
      const due = new Date(task.due_date);
      const day = due.getDate();
      const month = due.getMonth(); // 10 is Nov, 11 is Dec
      if (month === 10) {
        if (day <= 7) return 0;
        if (day <= 14) return 1;
        if (day <= 21) return 2;
        return 3;
      }
      return 4;
    } catch {
      return idx % sprints.length;
    }
  };

  const doneCount = tasks.filter((t) => t.status === "Done").length;
  const inProgressCount = tasks.filter((t) => t.status === "In Progress").length;
  const totalTasks = tasks.length || 1;
  const progressPercent = Math.round((doneCount / totalTasks) * 100);

  return (
    <div style={{ padding: "0 4px", marginTop: "12px", animation: "fade-in 0.25s ease-out" }}>
      {/* Roadmap Hero Header */}
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
              Strategic Timeline
            </span>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Sprint Q4 • {selectedProject?.name || "Active Workspace"}
            </span>
          </div>
          <h1 style={{ fontSize: "2.1rem", fontWeight: 900, margin: "4px 0" }}>
            <span className="cosmic-outline-text" style={{ marginRight: "10px" }}>MILESTONE</span>
            <span className="shimmer-headline gradient-text">ROADMAP</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: 0 }}>
            Visual Gantt timeline and sprint velocity milestones across active epics.
          </p>
        </div>

        {/* Sprint Velocity Stats Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            background: "rgba(0, 0, 0, 0.2)",
            padding: "12px 20px",
            borderRadius: "16px",
            border: "1px solid var(--border)",
          }}
        >
          <div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Sprint Progress
            </div>
            <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#00d2ff" }}>
              {progressPercent}%
            </div>
          </div>
          <div style={{ width: "90px" }}>
            <div style={{ height: "6px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "9999px", overflow: "hidden" }}>
              <div style={{ width: `${progressPercent}%`, height: "100%", background: "linear-gradient(90deg, #ffae19 0%, #00d2ff 100%)" }} />
            </div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "4px", textAlign: "right" }}>
              {doneCount}/{tasks.length} Done
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className="clay-card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 18px",
          borderRadius: "14px",
          background: "var(--panel)",
          border: "1px solid var(--border)",
          marginBottom: "18px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Priority Filter:
          </span>
          {["all", "high", "medium", "low"].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              style={{
                background: filterPriority === p ? "#00d2ff" : "transparent",
                color: filterPriority === p ? "#000" : "var(--text)",
                border: `1px solid ${filterPriority === p ? "#00d2ff" : "var(--border)"}`,
                borderRadius: "9999px",
                padding: "3px 12px",
                fontSize: "0.76rem",
                fontWeight: 700,
                cursor: "pointer",
                textTransform: "capitalize",
                transition: "all 0.15s ease",
              }}
            >
              {p}
            </button>
          ))}
        </div>

        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
          Showing {displayTasks.length} task milestones
        </div>
      </div>

      {/* Visual Gantt Timeline Grid */}
      <div
        className="clay-card spotlight-card"
        style={{
          borderRadius: "18px",
          background: "var(--panel)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-soft)",
          overflowX: "auto",
          padding: "20px",
        }}
      >
        {/* Timeline Sprint Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "240px repeat(5, minmax(140px, 1fr))",
            borderBottom: "1px solid var(--border)",
            paddingBottom: "12px",
            marginBottom: "16px",
            minWidth: "850px",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: "0.82rem", color: "var(--text)", textTransform: "uppercase" }}>
            Task Milestone
          </div>
          {sprints.map((s) => (
            <div
              key={s.id}
              style={{
                textAlign: "center",
                padding: "0 6px",
                borderLeft: "1px dashed rgba(255, 255, 255, 0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                <span style={{ fontWeight: 800, fontSize: "0.82rem", color: s.isCurrent ? "#00d2ff" : "var(--text)" }}>
                  {s.title}
                </span>
                {s.isCurrent && (
                  <span style={{ fontSize: "0.6rem", background: "#00d2ff", color: "#000", fontWeight: 800, padding: "1px 4px", borderRadius: "4px" }}>
                    NOW
                  </span>
                )}
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{s.range}</div>
            </div>
          ))}
        </div>

        {/* Task Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: "850px" }}>
          {displayTasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: "0.88rem" }}>
              No tasks match this filter.
            </div>
          ) : (
            displayTasks.map((task, idx) => {
              const sprintIndex = getTaskSprintIndex(task, idx);
              const status = getStatusColor(task.status);

              return (
                <div
                  key={task.id}
                  onClick={() => onViewTask && onViewTask(task.id)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "240px repeat(5, minmax(140px, 1fr))",
                    alignItems: "center",
                    padding: "8px 10px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0, 210, 255, 0.05)";
                    e.currentTarget.style.borderColor = "rgba(0, 210, 255, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.05)";
                  }}
                >
                  {/* Task Meta Left */}
                  <div style={{ paddingRight: "12px" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.84rem", color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {task.title}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                      <span
                        style={{
                          fontSize: "0.66rem",
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: "4px",
                          background: status.bg,
                          color: status.text,
                        }}
                      >
                        {status.label}
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No deadline"}
                      </span>
                    </div>
                  </div>

                  {/* Gantt Milestone Bar across Sprints */}
                  {sprints.map((s, colIdx) => (
                    <div
                      key={s.id}
                      style={{
                        padding: "0 4px",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        borderLeft: "1px dashed rgba(255, 255, 255, 0.06)",
                      }}
                    >
                      {colIdx === sprintIndex && (
                        <div
                          style={{
                            width: "100%",
                            height: "26px",
                            borderRadius: "8px",
                            background: `linear-gradient(90deg, ${status.bg} 0%, rgba(0, 210, 255, 0.6) 100%)`,
                            border: `1px solid ${status.border}`,
                            boxShadow: `0 2px 10px ${status.bg}44`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0 8px",
                            color: status.text,
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            animation: "slide-left 0.2s ease-out",
                          }}
                          title={`Due: ${task.due_date || "Ongoing"}`}
                        >
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {task.status}
                          </span>
                          <span>✓</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default RoadmapView;
