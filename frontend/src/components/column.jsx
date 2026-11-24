import TaskCard from "./taskcard"
import { Droppable } from "@hello-pangea/dnd"
import { useState } from "react"

function Column({column_name, tasks, userRole, onEditTask, onDeleteTask, onViewDetails, onAdvanceTask, onQuickAddTask, current_user_id}){
  const statusClass = column_name.toLowerCase().replace(/\s+/g, "-");
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (onQuickAddTask) {
      onQuickAddTask(column_name, newTitle.trim());
    }
    setNewTitle("");
    setIsAdding(false);
  };

  const getColumnIcon = (col) => {
    switch (col) {
      case "To Do": return "📋";
      case "In Progress": return "⚡";
      case "Review": return "👀";
      case "Done": return "✅";
      default: return "📌";
    }
  };

  const getColumnAccent = (col) => {
    switch (col) {
      case "To Do": return { color: "#00d2ff", bg: "rgba(0, 210, 255, 0.14)" };
      case "In Progress": return { color: "#ffae19", bg: "rgba(255, 174, 25, 0.14)" };
      case "Review": return { color: "#a855f7", bg: "rgba(168, 85, 247, 0.14)" };
      case "Done": return { color: "#10b981", bg: "rgba(16, 185, 129, 0.14)" };
      default: return { color: "#8e929e", bg: "rgba(142, 146, 158, 0.14)" };
    }
  };
  const accent = getColumnAccent(column_name);

  return(
    <div className={`column column-${statusClass}`}>
      <div className="column-header" style={{ paddingBottom: "10px", marginBottom: "8px", borderBottom: `2px solid ${accent.color}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>{getColumnIcon(column_name)}</span>
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>{column_name}</h3>
        </div>
        <span 
          className="column-count"
          style={{
            background: accent.bg,
            color: accent.color,
            border: `1px solid ${accent.color}`,
            borderRadius: "9999px",
            fontSize: "0.76rem",
            fontWeight: 800,
            padding: "2px 8px",
            minWidth: "24px",
            height: "22px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {tasks.length}
        </span>
      </div>
      
      <Droppable droppableId={column_name} type="TASK">
        {(provided, snapshot) => (
          <div 
            ref={provided.innerRef} 
            className="column-tasks"
            {...provided.droppableProps}
            style={{
              backgroundColor: snapshot.isDraggingOver ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
              transition: 'background-color 0.2s ease',
              minHeight: '200px'
            }}
          >
            {tasks.map((task, index) => (
              <TaskCard 
                key={task.id} 
                index={index} 
                {...task} 
                status={column_name}
                userRole={userRole}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onViewDetails={onViewDetails}
                onAdvanceStage={onAdvanceTask}
                current_user_id={current_user_id}
              /> 
            ))}
            {tasks.length === 0 && (
              <div className="empty-column-note">Drop tasks here</div>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Inline Zero-Friction Quick Add */}
      {(userRole === 'owner' || userRole === 'manager') && (
        <div style={{ marginTop: "10px", padding: "0 2px" }}>
          {!isAdding ? (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "transparent",
                border: "1px dashed var(--border)",
                borderRadius: "10px",
                color: "var(--text-muted)",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#6366f1";
                e.currentTarget.style.color = "#6366f1";
                e.currentTarget.style.background = "var(--panel)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span>+</span> Add card
            </button>
          ) : (
            <form
              onSubmit={handleQuickSubmit}
              style={{
                background: "var(--panel)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "8px",
                boxShadow: "var(--shadow-soft)",
              }}
            >
              <input
                type="text"
                autoFocus
                placeholder="What needs to be done? Press Enter"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsAdding(false);
                    setNewTitle("");
                  }
                }}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  fontSize: "0.85rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  color: "var(--text)",
                  outline: "none",
                  marginBottom: "6px",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setNewTitle("");
                  }}
                  style={{
                    padding: "4px 10px",
                    fontSize: "0.76rem",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  style={{
                    padding: "4px 12px",
                    fontSize: "0.76rem",
                    fontWeight: 600,
                    background: "#6366f1",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: newTitle.trim() ? "pointer" : "not-allowed",
                    opacity: newTitle.trim() ? 1 : 0.6,
                  }}
                >
                  Add
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

export default Column
