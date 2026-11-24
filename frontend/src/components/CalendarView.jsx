import { useState } from "react";
import defaultAvatar from "../assets/default-avatar.svg";

function CalendarView({ tasks, onViewDetails, onTaskManagement, userRole }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDaysInMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Group tasks by day "YYYY-MM-DD"
  const tasksByDate = {};
  tasks.forEach((task) => {
    if (!task.due_date) return;
    try {
      const d = new Date(task.due_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!tasksByDate[key]) tasksByDate[key] = [];
      tasksByDate[key].push(task);
    } catch {
      // ignore invalid dates
    }
  });

  const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;

  const calendarDays = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevDaysInMonth - i,
      monthType: "prev",
      dateKey: null,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarDays.push({
      day: d,
      monthType: "current",
      dateKey: key,
      isToday: key === todayStr,
      tasks: tasksByDate[key] || [],
    });
  }

  // Next month leading days to complete full grid (multiple of 7)
  const remainingCells = 7 - (calendarDays.length % 7);
  if (remainingCells < 7) {
    for (let i = 1; i <= remainingCells; i++) {
      calendarDays.push({
        day: i,
        monthType: "next",
        dateKey: null,
      });
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return { bg: "#fee2e2", border: "#fca5a5", text: "#b91c1c" };
      case "medium":
        return { bg: "#fef3c7", border: "#fcd34d", text: "#b45309" };
      default:
        return { bg: "#dcfce7", border: "#86efac", text: "#15803d" };
    }
  };

  return (
    <div className="calendar-view-container clay-card" style={{ padding: "24px", borderRadius: "18px", background: "var(--panel)", border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)", marginTop: "12px" }}>
      {/* Calendar Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "var(--text)" }}>
            📅 {monthNames[month]} {year}
          </h2>
          <button
            onClick={handleToday}
            style={{
              padding: "4px 12px",
              borderRadius: "9999px",
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Today
          </button>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handlePrevMonth}
            style={{
              padding: "6px 14px",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
              cursor: "pointer",
              fontWeight: 600,
            }}
            title="Previous Month"
          >
            ← Prev
          </button>
          <button
            onClick={handleNextMonth}
            style={{
              padding: "6px 14px",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
              cursor: "pointer",
              fontWeight: 600,
            }}
            title="Next Month"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", marginBottom: "8px", textAlign: "center" }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} style={{ fontWeight: 700, fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", padding: "6px 0" }}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" }}>
        {calendarDays.map((cell, idx) => {
          const isCurrent = cell.monthType === "current";
          const cellTasks = cell.tasks || [];

          return (
            <div
              key={idx}
              style={{
                minHeight: "110px",
                padding: "8px",
                borderRadius: "12px",
                background: isCurrent ? (cell.isToday ? "var(--today-bg, rgba(99, 102, 241, 0.08))" : "var(--bg)") : "rgba(0, 0, 0, 0.02)",
                border: cell.isToday ? "2px solid #6366f1" : "1px solid var(--border)",
                opacity: isCurrent ? 1 : 0.4,
                display: "flex",
                flexDirection: "column",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: cell.isToday ? 800 : 600,
                    color: cell.isToday ? "#6366f1" : "var(--text)",
                    width: cell.isToday ? "24px" : "auto",
                    height: cell.isToday ? "24px" : "auto",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {cell.day}
                </span>
                {cellTasks.length > 0 && (
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", background: "var(--border)", padding: "1px 6px", borderRadius: "9999px" }}>
                    {cellTasks.length}
                  </span>
                )}
              </div>

              {/* Tasks for this day */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto", maxHeight: "110px" }}>
                {cellTasks.map((task) => {
                  const pCol = getPriorityColor(task.priority_level);
                  return (
                    <div
                      key={task.id}
                      onClick={() => onViewDetails && onViewDetails(task.id)}
                      title={`${task.title} (${task.status}) - Click to inspect`}
                      style={{
                        padding: "3px 6px",
                        borderRadius: "6px",
                        background: pCol.bg,
                        border: `1px solid ${pCol.border}`,
                        color: pCol.text,
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: pCol.text, flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{task.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarView;
