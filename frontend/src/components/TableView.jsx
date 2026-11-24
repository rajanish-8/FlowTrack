import { useState } from "react";
import defaultAvatar from "../assets/default-avatar.svg";

function TableView({ tasks, onViewDetails, onEditTask, onDeleteTask, onAdvanceTask, userRole }) {
  const [sortField, setSortField] = useState("due_date");
  const [sortOrder, setSortOrder] = useState("asc");

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    let aVal = a[sortField] || "";
    let bVal = b[sortField] || "";
    if (sortField === "priority_level") {
      const order = { high: 3, medium: 2, low: 1 };
      aVal = order[String(aVal).toLowerCase()] || 0;
      bVal = order[String(bVal).toLowerCase()] || 0;
    }
    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "Done":
        return { bg: "#dcfce7", color: "#166534", border: "#86efac" };
      case "In Progress":
        return { bg: "#fef3c7", color: "#854d0e", border: "#fde047" };
      case "Review":
        return { bg: "#f3e8ff", color: "#6b21a8", border: "#d8b4fe" };
      default:
        return { bg: "#e0e7ff", color: "#3730a3", border: "#c7d2fe" };
    }
  };

  const getNextStage = (status) => {
    switch (status) {
      case "To Do":
        return { label: "Start ▶", next: "In Progress" };
      case "In Progress":
        return { label: "Review ↗", next: "Review" };
      case "Review":
        return { label: "Done ✓", next: "Done" };
      case "Done":
        return { label: "Reopen ↺", next: "To Do" };
      default:
        return null;
    }
  };

  return (
    <div
      className="table-view-container clay-card"
      style={{
        borderRadius: "18px",
        background: "var(--panel)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-soft)",
        overflowX: "auto",
        marginTop: "12px",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.86rem" }}>
        <thead>
          <tr style={{ background: "var(--table-head-bg, rgba(0, 0, 0, 0.03))", borderBottom: "1px solid var(--border)" }}>
            <th
              onClick={() => handleSort("title")}
              style={{ padding: "14px 18px", cursor: "pointer", fontWeight: 700, color: "var(--text)" }}
            >
              Task Title {sortField === "title" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
            </th>
            <th
              onClick={() => handleSort("status")}
              style={{ padding: "14px 14px", cursor: "pointer", fontWeight: 700, color: "var(--text)" }}
            >
              Status {sortField === "status" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
            </th>
            <th
              onClick={() => handleSort("priority_level")}
              style={{ padding: "14px 14px", cursor: "pointer", fontWeight: 700, color: "var(--text)" }}
            >
              Priority {sortField === "priority_level" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
            </th>
            <th style={{ padding: "14px 14px", fontWeight: 700, color: "var(--text)" }}>Assignee</th>
            <th
              onClick={() => handleSort("due_date")}
              style={{ padding: "14px 14px", cursor: "pointer", fontWeight: 700, color: "var(--text)" }}
            >
              Due Date {sortField === "due_date" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
            </th>
            <th style={{ padding: "14px 14px", fontWeight: 700, color: "var(--text)" }}>Subtasks</th>
            <th style={{ padding: "14px 18px", textAlign: "right", fontWeight: 700, color: "var(--text)" }}>Fast Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedTasks.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                No tasks match your filters.
              </td>
            </tr>
          ) : (
            sortedTasks.map((task) => {
              const statusStyle = getStatusBadge(task.status);
              const nextStage = getNextStage(task.status);
              const totalItems = task.checklist?.length || 0;
              const completedItems = task.checklist?.filter((c) => c.completed).length || 0;

              return (
                <tr
                  key={task.id}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    transition: "background 0.15s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--row-hover, rgba(99, 102, 241, 0.04))")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  onClick={() => onViewDetails && onViewDetails(task.id)}
                >
                  <td style={{ padding: "14px 18px", fontWeight: 600, color: "var(--text)" }}>
                    {task.title}
                  </td>
                  <td style={{ padding: "14px 14px" }}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "9999px",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        border: `1px solid ${statusStyle.border}`,
                        display: "inline-block",
                      }}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 14px" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "capitalize",
                        background:
                          task.priority_level?.toLowerCase() === "high"
                            ? "#fee2e2"
                            : task.priority_level?.toLowerCase() === "medium"
                            ? "#fef3c7"
                            : "#dcfce7",
                        color:
                          task.priority_level?.toLowerCase() === "high"
                            ? "#b91c1c"
                            : task.priority_level?.toLowerCase() === "medium"
                            ? "#b45309"
                            : "#15803d",
                      }}
                    >
                      {task.priority_level || "Low"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <img
                        src={task.user_profile_picture || defaultAvatar}
                        alt=""
                        style={{ width: "22px", height: "22px", borderRadius: "50%", objectFit: "cover" }}
                      />
                      <span style={{ fontSize: "0.82rem", color: "var(--text)" }}>{task.user_username || "Unassigned"}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 14px", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ padding: "14px 14px" }}>
                    {totalItems > 0 ? (
                      <div style={{ minWidth: "90px" }}>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "3px" }}>
                          {completedItems}/{totalItems}
                        </div>
                        <div style={{ height: "4px", background: "var(--border)", borderRadius: "9999px", overflow: "hidden" }}>
                          <div style={{ width: `${(completedItems / totalItems) * 100}%`, height: "100%", background: "#10b981" }} />
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "14px 18px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                      {nextStage && (
                        <button
                          onClick={() => onAdvanceTask && onAdvanceTask(task.id, nextStage.next)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "8px",
                            border: "1px solid #c7d2fe",
                            background: "#e0e7ff",
                            color: "#4338ca",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                          title={`Move to ${nextStage.next}`}
                        >
                          {nextStage.label}
                        </button>
                      )}
                      {(userRole === "owner" || userRole === "manager") && (
                        <>
                          <button
                            onClick={() => onEditTask && onEditTask(task.id)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              border: "1px solid var(--border)",
                              background: "var(--bg)",
                              cursor: "pointer",
                              fontSize: "0.8rem",
                            }}
                            title="Edit task"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => onDeleteTask && onDeleteTask(task.id)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              border: "1px solid #fecaca",
                              background: "#fef2f2",
                              color: "#ef4444",
                              cursor: "pointer",
                              fontSize: "0.8rem",
                            }}
                            title="Delete task"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default TableView;
