import propTypes from "prop-types";
import { Draggable } from "@hello-pangea/dnd";
import { useState, useEffect } from "react";
import defaultAvatar from "../assets/default-avatar.svg";

const getTagColor = (tag) => {
  const t = (tag || "").toLowerCase();
  if (t.includes("bug") || t.includes("urgent") || t.includes("critical")) {
    return { bg: "rgba(239, 68, 68, 0.15)", text: "#ef4444", border: "rgba(239, 68, 68, 0.3)" };
  }
  if (t.includes("feat") || t.includes("feature")) {
    return { bg: "rgba(59, 130, 246, 0.15)", text: "#3b82f6", border: "rgba(59, 130, 246, 0.3)" };
  }
  if (t.includes("devops") || t.includes("infra")) {
    return { bg: "rgba(168, 85, 247, 0.15)", text: "#a855f7", border: "rgba(168, 85, 247, 0.3)" };
  }
  if (t.includes("design") || t.includes("ui") || t.includes("ux")) {
    return { bg: "rgba(236, 72, 153, 0.15)", text: "#ec4899", border: "rgba(236, 72, 153, 0.3)" };
  }
  if (t.includes("backend") || t.includes("api")) {
    return { bg: "rgba(16, 185, 129, 0.15)", text: "#10b981", border: "rgba(16, 185, 129, 0.3)" };
  }
  if (t.includes("frontend") || t.includes("web")) {
    return { bg: "rgba(245, 158, 11, 0.15)", text: "#f59e0b", border: "rgba(245, 158, 11, 0.3)" };
  }
  return { bg: "rgba(100, 116, 139, 0.15)", text: "#94a3b8", border: "rgba(100, 116, 139, 0.3)" };
};

const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return "0m";
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
};

function TaskCard({
  id,
  title,
  description,
  due_date,
  priority_level,
  user_profile_picture,
  user_username,
  userRole,
  onEdit,
  onDelete,
  onViewDetails,
  onAdvanceStage,
  status,
  assigned_user_id,
  current_user_id,
  checklist = [],
  isDraggable = true,
  tags = [],
  blocked_reason = "",
  total_time_minutes = 0,
  estimated_hours = 0,
  recurrence = "none",
  resolution = "",
}) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const priorityModifier = typeof priority_level === "string" ? priority_level.toLowerCase() : "";
  const hasDueDate = Boolean(due_date);
  const completedChecklist = Array.isArray(checklist) ? checklist.filter((c) => c.completed).length : 0;
  const totalChecklist = Array.isArray(checklist) ? checklist.length : 0;

  const getStageAdvance = (st) => {
    switch (st) {
      case "To Do": return { label: "▶ Start", target: "In Progress", color: "#00d2ff" };
      case "In Progress": return { label: "↗ Review", target: "Review", color: "#ffae19" };
      case "Review": return { label: "✓ Done", target: "Done", color: "#10b981" };
      case "Done": return { label: "↺ Reopen", target: "To Do", color: "#8e929e" };
      default: return null;
    }
  };
  const advanceInfo = getStageAdvance(status);

  // Calculate smart urgency badge
  const getDeadlineUrgency = (dateString) => {
    if (!dateString) return null;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(dateString);
      due.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return { label: "Overdue", type: "overdue" };
      if (diffDays === 0) return { label: "Due Today", type: "today" };
      if (diffDays === 1) return { label: "Tomorrow", type: "soon" };
      if (diffDays <= 3) return { label: `${diffDays}d left`, type: "soon" };
      return null;
    } catch {
      return null;
    }
  };
  const urgency = getDeadlineUrgency(due_date);

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  // Format due date for display
  const formatDate = (dateString) => {
    if (!dateString) return "No due date";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Check if user can edit/delete this task
  const canEdit = userRole === "owner" || userRole === "manager";

  // Check if user can drag this task
  const canDrag =
    isDraggable &&
    (userRole === "owner" || userRole === "manager" || assigned_user_id === current_user_id);

  const handleTouchStart = (e) => {
    if (isTouchDevice && canDrag) {
      e.preventDefault();
    }
  };

  return (
    <Draggable draggableId={id.toString()} type="TASK" isDragDisabled={!canDrag}>
      {(provided, snapshot) => (
        <div
          className={`div-card ${snapshot.isDragging ? "dragging" : ""} ${
            !canDrag ? "not-draggable" : ""
          } ${isTouchDevice ? "touch-device" : ""}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...(canDrag ? provided.dragHandleProps : {})}
          title={
            !canDrag
              ? "You can only move tasks assigned to you"
              : "Click to view details & discussion"
          }
          onTouchStart={handleTouchStart}
          onClick={(e) => {
            if (!e.target.closest(".task-action-btn")) {
              onViewDetails && onViewDetails(id);
            }
          }}
          style={{ cursor: "pointer", ...provided.draggableProps.style }}
        >
          {/* Card Top Row: Priority Badge, Recurrence & Action Buttons */}
          <div
            className="task-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "6px",
            }}
          >
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              {/* Priority badge */}
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  background:
                    priorityModifier === "high"
                      ? "rgba(239, 68, 68, 0.15)"
                      : priorityModifier === "medium"
                      ? "rgba(245, 158, 11, 0.15)"
                      : "rgba(16, 185, 129, 0.15)",
                  color:
                    priorityModifier === "high"
                      ? "#ef4444"
                      : priorityModifier === "medium"
                      ? "#f59e0b"
                      : "#10b981",
                  border: `1px solid ${
                    priorityModifier === "high"
                      ? "rgba(239, 68, 68, 0.3)"
                      : priorityModifier === "medium"
                      ? "rgba(245, 158, 11, 0.3)"
                      : "rgba(16, 185, 129, 0.3)"
                  }`,
                }}
              >
                {priorityModifier === "high"
                  ? "🔴 High"
                  : priorityModifier === "medium"
                  ? "🟡 Med"
                  : "🟢 Low"}
              </span>

              {/* Recurrence Pill */}
              {recurrence && recurrence !== "none" && (
                <span
                  style={{
                    fontSize: "0.66rem",
                    padding: "2px 5px",
                    borderRadius: "4px",
                    background: "rgba(99, 102, 241, 0.15)",
                    color: "#6366f1",
                    fontWeight: 700,
                  }}
                  title={`Smart Recurrence: ${recurrence}`}
                >
                  🔁 {recurrence.slice(0, 3)}
                </span>
              )}
            </div>

            {/* Action buttons on top right */}
            {canEdit && (
              <div className="task-actions" style={{ display: "flex", gap: "2px" }}>
                <button
                  type="button"
                  className="task-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit && onEdit(id);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px 5px",
                    borderRadius: "4px",
                    fontSize: "0.82rem",
                    color: "var(--text-muted)",
                    transition: "color 0.15s",
                  }}
                  title="Edit task"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  className="task-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete && onDelete(id);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px 5px",
                    borderRadius: "4px",
                    fontSize: "0.82rem",
                    color: "var(--text-muted)",
                    transition: "color 0.15s",
                  }}
                  title="Delete task"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>

          {/* Blocker Alert Banner (django-coleman) */}
          {Boolean(blocked_reason) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.35)",
                color: "#ef4444",
                borderRadius: "6px",
                padding: "2px 6px",
                fontSize: "0.68rem",
                fontWeight: 700,
                marginBottom: "6px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={`Blocked: ${blocked_reason}`}
            >
              🚫 <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{blocked_reason}</span>
            </div>
          )}

          {/* Task Title */}
          <div
            style={{
              fontWeight: 600,
              fontSize: "0.92rem",
              color: "var(--text)",
              lineHeight: 1.4,
              marginBottom: "8px",
            }}
          >
            {title}
          </div>

          {/* Tag Chips (SebinOV/Task-Management & flask-vue-todo) */}
          {tags && tags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "4px",
                marginBottom: "8px",
              }}
            >
              {tags.map((tag) => {
                const colors = getTagColor(tag);
                return (
                  <span
                    key={tag}
                    style={{
                      fontSize: "0.66rem",
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: "4px",
                      background: colors.bg,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          )}

          {/* Subtasks Progress */}
          {totalChecklist > 0 && (
            <div style={{ margin: "0 0 8px 0", fontSize: "0.74rem", color: "var(--text-muted)" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "3px",
                }}
              >
                <span>☑️ Subtasks</span>
                <strong style={{ color: "var(--text)" }}>
                  {completedChecklist}/{totalChecklist}
                </strong>
              </div>
              <div
                style={{
                  height: "4px",
                  background: "rgba(255, 255, 255, 0.08)",
                  borderRadius: "9999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${(completedChecklist / totalChecklist) * 100}%`,
                    height: "100%",
                    background: "#10b981",
                    transition: "width 0.2s ease",
                  }}
                />
              </div>
            </div>
          )}

          {/* Time Tracking Pill (taskcoach & django-coleman) */}
          {(total_time_minutes > 0 || estimated_hours > 0) && (
            <div style={{ marginBottom: "8px" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.68rem",
                  padding: "2px 7px",
                  borderRadius: "6px",
                  background: "rgba(99, 102, 241, 0.1)",
                  color: "#6366f1",
                  fontWeight: 700,
                  border: "1px solid rgba(99, 102, 241, 0.22)",
                }}
                title={`Tracked Time: ${formatDuration(total_time_minutes)} / ${estimated_hours}h estimated`}
              >
                ⏱️ {formatDuration(total_time_minutes)}
                {estimated_hours > 0 && (
                  <span style={{ opacity: 0.75 }}> / {estimated_hours}h</span>
                )}
              </span>
            </div>
          )}

          {/* Card Footer Divider & Metadata */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: "8px",
              borderTop: "1px solid var(--border)",
              marginTop: "auto",
              gap: "8px",
            }}
          >
            {/* Assignee Avatar + Name */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                minWidth: 0,
              }}
            >
              <img
                src={user_profile_picture || defaultAvatar}
                alt="Assignee"
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
                title={`Assigned to ${user_username}`}
              />
              <span
                style={{
                  fontSize: "0.76rem",
                  color: "var(--text-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user_username}
              </span>
            </div>

            {/* Due Date & Stage Advance Button */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                flexShrink: 0,
              }}
            >
              {hasDueDate && (
                <span
                  style={{
                    fontSize: "0.72rem",
                    color:
                      urgency?.type === "overdue"
                        ? "#ef4444"
                        : urgency?.type === "today"
                        ? "#f59e0b"
                        : "var(--text-muted)",
                    fontWeight: urgency ? 700 : 500,
                  }}
                  title={`Due date: ${formatDate(due_date)}`}
                >
                  {urgency?.type === "overdue"
                    ? "⚠️ Overdue"
                    : urgency?.type === "today"
                    ? "🔥 Today"
                    : formatDate(due_date)}
                </span>
              )}

              {advanceInfo && (canEdit || assigned_user_id === current_user_id) && (
                <button
                  type="button"
                  className="task-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdvanceStage && onAdvanceStage(id, advanceInfo.target);
                  }}
                  style={{
                    background: "rgba(0, 210, 255, 0.1)",
                    border: `1px solid ${advanceInfo.color}`,
                    color: advanceInfo.color,
                    borderRadius: "9999px",
                    padding: "2px 8px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px",
                    transition: "all 0.15s ease",
                  }}
                  title={`Advance to ${advanceInfo.target}`}
                >
                  {advanceInfo.label}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

TaskCard.propTypes = {
  id: propTypes.oneOfType([propTypes.string, propTypes.number]).isRequired,
  title: propTypes.string.isRequired,
  due_date: propTypes.string,
  user_profile_picture: propTypes.string,
  user_username: propTypes.string,
  priority_level: propTypes.string,
  userRole: propTypes.string,
  onEdit: propTypes.func,
  onDelete: propTypes.func,
  onViewDetails: propTypes.func,
  onAdvanceStage: propTypes.func,
  assigned_user_id: propTypes.number,
  current_user_id: propTypes.number,
  isDraggable: propTypes.bool,
  checklist: propTypes.array,
  tags: propTypes.array,
  blocked_reason: propTypes.string,
  total_time_minutes: propTypes.number,
  estimated_hours: propTypes.oneOfType([propTypes.number, propTypes.string]),
  recurrence: propTypes.string,
  resolution: propTypes.string,
  status: propTypes.string,
};

export default TaskCard;
