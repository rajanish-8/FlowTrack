import Column from "../components/column"
import { useState, useEffect, useCallback } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import ProjectDropdown from "../components/ProjectDropdown";
import TaskManagement from "../components/TaskManagement";
import AISprintSummaryModal from "../components/AISprintSummaryModal";
import ProjectAnalyticsModal from "../components/ProjectAnalyticsModal";
import ExecutiveReportModal from "../components/ExecutiveReportModal";
import TaskDetailModal from "../components/TaskDetailModal";
import ActivityFeedDrawer from "../components/ActivityFeedDrawer";
import CalendarView from "../components/CalendarView";
import TableView from "../components/TableView";
import EisenhowerMatrixView from "../components/EisenhowerMatrixView";
import KeyboardShortcutsModal from "../components/KeyboardShortcutsModal";
import { triggerConfetti } from "../utils/confetti";
import { taskAPI } from "../utils/api";
import { startVoiceRecognition, isSpeechSupported } from "../utils/speech";

const columnMapping = {
  "to do": "To Do",
  "in progress": "In Progress",
  "review": "Review",
  "done": "Done",
};

const columns = ["To Do", "In Progress", "Review", "Done"];

function ColumnContainer({ allProjects, displayProjects, userData, userRole, selectedProject, onProjectChange, onProjectManagement, onTaskManagement, onRefreshBoard, onOrganizationMembers, externalDetailTaskId, onClearExternalDetailTaskId, viewMode = "board", onViewChange }){
  // Transform backend data to frontend format
  const [tasks, setTasks] = useState([]);
  const [currentView, setCurrentView] = useState(viewMode || "board"); // "board" | "calendar" | "table" | "matrix"

  useEffect(() => {
    if (viewMode && viewMode !== currentView) {
      setCurrentView(viewMode);
    }
  }, [viewMode]);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showTaskManagement, setShowTaskManagement] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [showAISummary, setShowAISummary] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showExecutiveReport, setShowExecutiveReport] = useState(false);
  const [showActivityFeed, setShowActivityFeed] = useState(false);
  const [detailTaskId, setDetailTaskId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);

  useEffect(() => {
    if (externalDetailTaskId) {
      setDetailTaskId(externalDetailTaskId);
      if (onClearExternalDetailTaskId) onClearExternalDetailTaskId();
    }
  }, [externalDetailTaskId]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === "b") {
        setCurrentView("board");
      } else if (key === "m") {
        setCurrentView("calendar");
      } else if (key === "t") {
        setCurrentView("table");
      } else if (key === "e") {
        setCurrentView("matrix");
      } else if (key === "c") {
        e.preventDefault();
        setShowTaskManagement(true);
      } else if (key === "f" || key === "/") {
        e.preventDefault();
        const searchInput = document.getElementById("flowtrack-board-search");
        if (searchInput) searchInput.focus();
      } else if (e.key === "?") {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      } else if (e.key === "Escape") {
        setShowShortcutsModal(false);
        setDetailTaskId(null);
        setShowAISummary(false);
        setShowAnalytics(false);
        setShowExecutiveReport(false);
        setShowActivityFeed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleQuickAddTask = async (columnName, title) => {
    const projId = selectedProject?.id || allProjects?.[0]?.id;
    if (!projId) {
      alert("Please select a project first.");
      return;
    }
    const backendStatus = Object.keys(columnMapping).find(
      key => columnMapping[key] === columnName
    ) || "to do";

    try {
      const created = await taskAPI.create({
        title,
        project: projId,
        assigned_to: userData?.id,
        status: backendStatus,
        priority: "medium",
      });

      const formattedTask = {
        id: created.id,
        title: created.title,
        description: created.description || "",
        due_date: created.due_date,
        priority_level: created.priority || "Medium",
        user_profile_picture: userData?.profile_picture || null,
        user_username: userData?.username || "You",
        assigned_user_id: userData?.id,
        status: columnName,
        project_id: projId,
        checklist: [],
        estimated_hours: 0,
        total_time_minutes: 0,
        recurrence: "none",
        resolution: "",
        blocked_reason: "",
        tags: [],
      };

      setTasks((prev) => [...prev, formattedTask]);
      if (columnName === "Done") {
        triggerConfetti();
      }
      if (onRefreshBoard) onRefreshBoard();
    } catch (err) {
      console.error("Failed to quick-add task:", err);
      alert("Failed to create task: " + err.message);
    }
  };

  const handleAdvanceTask = async (taskId, targetStage) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (userRole !== 'owner' && userRole !== 'manager' && task.assigned_user_id !== userData?.id) {
      alert("You can only move tasks assigned to you.");
      return;
    }

    const backendStatus = Object.keys(columnMapping).find(
      key => columnMapping[key] === targetStage
    ) || "to do";

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStage } : t))
    );

    if (targetStage === "Done") {
      triggerConfetti();
    }

    try {
      await taskAPI.update(taskId, { status: backendStatus });
      if (onRefreshBoard) onRefreshBoard();
    } catch (err) {
      console.error("Failed to advance task:", err);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t))
      );
    }
  };

  const handleVoiceSearch = () => {
    if (isVoiceSearching) return;
    setIsVoiceSearching(true);
    startVoiceRecognition({
      onResult: (text) => {
        setSearchQuery(text);
      },
      onError: (err) => {
        console.warn("Voice search error:", err);
        setIsVoiceSearching(false);
      },
      onEnd: () => {
        setIsVoiceSearching(false);
      },
    });
  };
  const selectedProjectName = selectedProject?.name || allProjects?.[0]?.name || "Workspace";
  const roleLabel = {
    owner: "Organization Owner",
    manager: "Manager",
    member: "Member",
  }[userRole] || "Member";
  const doneCount = tasks.filter((task) => task.status === "Done").length;
  const inProgressCount = tasks.filter((task) => task.status === "In Progress").length;
  const reviewCount = tasks.filter((task) => task.status === "Review").length;
  const completionRate = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  useEffect(() => {
    if (displayProjects && displayProjects.length > 0) {
      // Flatten all tasks from display projects and transform to frontend format
      const allTasks = displayProjects.flatMap(project => 
        project.tasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description || "",
          due_date: task.due_date,
          priority_level: task.priority || "Low", // Backend has priority field
          user_profile_picture: task.assigned_to?.profile_picture || null,
          user_username: task.assigned_to?.username || "Unassigned", // Add username
          assigned_user_id: task.assigned_to?.user_id || null, // Add assigned user ID
          status: columnMapping[task.status] || "To Do", // Map backend status to frontend display
          project_id: project.id,
          checklist: task.checklist || [],
          estimated_hours: task.estimated_hours || 0,
          total_time_minutes: task.total_time_minutes || 0,
          recurrence: task.recurrence || "none",
          resolution: task.resolution || "",
          blocked_reason: task.blocked_reason || "",
          tags: Array.isArray(task.tags) ? task.tags : [],
        }))
      );
      setTasks(allTasks);
    } else {
      setTasks([]);
    }
  }, [displayProjects]);

  const onDrag = useCallback(async (result) => {
    const { destination, draggableId, source } = result || {};
    if (!destination) {
      return;  
    }

    // Don't update if dropped in the same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    // Find the task being moved
    const task = tasks.find(t => t.id === Number(draggableId) || t.id === draggableId);
    if (!task) {
      console.error("Task not found");
      return;
    }

    // Check if user has permission to move this task
    // Owners and managers can move any task, members can only move tasks assigned to them
    if (userRole !== 'owner' && userRole !== 'manager') {
      // For regular members, check if the task is assigned to them
      if (task.assigned_user_id !== userData?.id) {
        alert("You can only move tasks that are assigned to you.");
        return;
      }
    }

    // Update local state immediately for better UX
    setTasks((prev) =>
      prev.map((task) =>
        task.id === Number(draggableId) || task.id === draggableId
          ? { ...task, status: destination.droppableId }
          : task
      )
    );

    if (destination.droppableId === "Done" && source.droppableId !== "Done") {
      triggerConfetti();
    }

    // Update task status in the backend
    try {
      const backendStatus = Object.keys(columnMapping).find(
        key => columnMapping[key] === destination.droppableId
      );
      
      await taskAPI.update(task.id, { status: backendStatus });
      console.log(`Task ${draggableId} moved to ${destination.droppableId}`);
    } catch (error) {
      console.error("Error updating task status:", error);
      // Revert the local state change on error
      setTasks((prev) =>
        prev.map((task) =>
          task.id === Number(draggableId) || task.id === draggableId
            ? { ...task, status: source.droppableId }
            : task
        )
      );
    }
  }, [tasks, userRole, userData]);

  // Handle task edit
  const handleEditTask = (taskId) => {
    setEditingTaskId(taskId);
    setShowTaskManagement(true);
  };

  // Handle task delete
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      return;
    }
    
    try {
      await taskAPI.delete(taskId);
      // Remove task from local state
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task. Please try again.");
    }
  };

  // Handle task management modal close
  const handleCloseTaskManagement = () => {
    setShowTaskManagement(false);
    setEditingTaskId(null);
  };

  // Handle task update from management modal
  const handleTaskUpdate = () => {
    // Refresh tasks by reloading the component data
    window.location.reload();
  };

  // Show message if no projects or tasks
  if (!allProjects || allProjects.length === 0) {
    return (
      <div className="column-container">
        <div className="board-hero">
          <div>
            <span className="eyebrow">Workspace</span>
            <h1 className="board-title">Task Board</h1>
          </div>
        </div>
        <div className="no-projects-message">
          <h3>No projects found</h3>
          <p>
            {userRole === "owner"
              ? "Create your first project to start organizing organization work."
              : "You don't have access to any projects yet. Ask your Organization Owner or Manager to add you to a project."}
          </p>
          {userRole === "owner" && (
            <button className="btn btn-primary" onClick={onProjectManagement}>
              Create First Project
            </button>
          )}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="column-container">
        <div className="board-hero">
          <div className="board-copy">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--brand)",
                background: "rgba(37, 99, 235, 0.08)",
                padding: "2px 8px",
                borderRadius: "6px",
              }}>
                {roleLabel} Workspace
              </span>
            </div>
            <h1 className="board-title" style={{ fontSize: "1.85rem", fontWeight: 800, letterSpacing: "-0.025em", margin: "2px 0 6px 0", color: "var(--text)" }}>
              {selectedProjectName}
            </h1>
            <p className="board-subtitle" style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-muted)", fontWeight: 400 }}>
              Plan, assign, and track work across your team.
            </p>
          </div>
          <div className="board-actions">
            <div className="project-info">
              {allProjects.length > 0 && (
                <div className="project-display">
                  {userRole === 'owner' ? (
                    <ProjectDropdown 
                      projects={allProjects}
                      userRole={userRole}
                      selectedProject={selectedProject}
                      onProjectChange={onProjectChange}
                    />
                  ) : (
                    <div className="project-name">
                      {allProjects.length === 1 ? allProjects[0].name : `${allProjects.length} Projects`}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Management Actions */}
            <div className="management-actions">
              <button 
                className="btn btn-ai-insights"
                onClick={() => setShowAISummary(true)}
                title="View AI Sprint Insights"
              >
                ✨ AI Insights
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowAnalytics(true)}
                title="View Visual Analytics & Export Data"
                style={{ fontWeight: 600 }}
              >
                📊 Analytics
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowExecutiveReport(true)}
                title="Generate Printable Executive PDF Report"
                style={{ fontWeight: 600 }}
              >
                📄 Report PDF
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowActivityFeed(true)}
                title="View Real-Time Team Activity Log"
                style={{ fontWeight: 600 }}
              >
                📜 Activity
              </button>
              {userRole === 'owner' && (
                <button
                  className="btn btn-secondary"
                  onClick={onOrganizationMembers}
                  title="Manage Organization Members"
                >
                  Members
                </button>
              )}
              {userRole === 'owner' && (
                <button 
                  className="btn btn-primary"
                  onClick={onProjectManagement}
                  title="Manage Projects"
                >
                  Projects
                </button>
              )}
              {(userRole === 'owner' || userRole === 'manager') && (
                <button 
                  className="btn btn-secondary"
                  onClick={onTaskManagement}
                  title="Manage Tasks"
                >
                  Tasks
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="board-stats">
          <div className="stat-panel">
            <span className="stat-label">Projects shown</span>
            <strong>{displayProjects.length}</strong>
          </div>
          <div className="stat-panel">
            <span className="stat-label">Total tasks</span>
            <strong>0</strong>
          </div>
          <div className="stat-panel">
            <span className="stat-label">Complete</span>
            <strong>0%</strong>
          </div>
        </div>
        <div className="no-tasks-message">
          <h3>No tasks found</h3>
          <p>There are no tasks in your projects yet.</p>
          {(userRole === 'owner' || userRole === 'manager') && (
            <div style={{ marginTop: '20px' }}>
              <button 
                className="btn btn-primary"
                onClick={onTaskManagement}
                style={{ fontSize: '16px', padding: '12px 24px' }}
              >
                Create Your First Task
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const availableTags = Array.from(new Set(tasks.flatMap(t => Array.isArray(t.tags) ? t.tags : [])));

  const filteredTasks = tasks.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title?.toLowerCase().includes(q);
      const matchUser = t.user_username?.toLowerCase().includes(q);
      if (!matchTitle && !matchUser) return false;
    }
    if (priorityFilter !== "all") {
      if (t.priority_level?.toLowerCase() !== priorityFilter.toLowerCase()) return false;
    }
    if (urgencyFilter !== "all" && t.due_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(t.due_date);
      due.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      if (urgencyFilter === "overdue") return diffDays < 0 && t.status !== "Done";
      if (urgencyFilter === "week") return diffDays >= 0 && diffDays <= 7 && t.status !== "Done";
    }
    if (tagFilter !== "all") {
      const taskTags = Array.isArray(t.tags) ? t.tags.map(tag => tag.toLowerCase()) : [];
      if (!taskTags.includes(tagFilter.toLowerCase())) return false;
    }
    return true;
  });

  return(
    <DragDropContext onDragEnd={onDrag}>
      <div className="column-container">
        <div className="board-hero">
          <div className="board-copy">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--brand)",
                background: "rgba(37, 99, 235, 0.08)",
                padding: "2px 8px",
                borderRadius: "6px",
              }}>
                {roleLabel} Workspace
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>•</span>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 500 }}>
                {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
              </span>
            </div>
            <h1 className="board-title" style={{ fontSize: "1.85rem", fontWeight: 800, letterSpacing: "-0.025em", margin: "2px 0 6px 0", color: "var(--text)" }}>
              {selectedProjectName}
            </h1>
            <p className="board-subtitle" style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-muted)", fontWeight: 400 }}>
              Plan, assign, and track work across your team.
            </p>
          </div>
          <div className="board-actions">
            <div className="project-info">
              {allProjects.length > 0 && (
                <div className="project-display">
                  {userRole === 'owner' ? (
                    <ProjectDropdown 
                      projects={allProjects}
                      userRole={userRole}
                      selectedProject={selectedProject}
                      onProjectChange={onProjectChange}
                    />
                  ) : (
                    <div className="project-name">
                      {allProjects.length === 1 ? allProjects[0].name : `${allProjects.length} Projects`}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Management Actions */}
            <div className="management-actions">
              <button 
                className="btn btn-ai-insights"
                onClick={() => setShowAISummary(true)}
                title="View AI Sprint Insights"
              >
                ✨ AI Insights
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowAnalytics(true)}
                title="View Visual Analytics & Export Data"
                style={{ fontWeight: 600 }}
              >
                📊 Analytics
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowExecutiveReport(true)}
                title="Generate Printable Executive PDF Report"
                style={{ fontWeight: 600 }}
              >
                📄 Report PDF
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowActivityFeed(true)}
                title="View Real-Time Team Activity Log"
                style={{ fontWeight: 600 }}
              >
                📜 Activity
              </button>
              {userRole === 'owner' && (
                <button
                  className="btn btn-secondary"
                  onClick={onOrganizationMembers}
                  title="Manage Organization Members"
                >
                  Members
                </button>
              )}
              {userRole === 'owner' && (
                <button 
                  className="btn btn-primary"
                  onClick={onProjectManagement}
                  title="Manage Projects"
                >
                  Projects
                </button>
              )}
              {(userRole === 'owner' || userRole === 'manager') && (
                <button 
                  className="btn btn-secondary"
                  onClick={onTaskManagement}
                  title="Manage Tasks"
                >
                  Tasks
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="board-stats">
          <div className="stat-panel" style={{ borderTop: "3px solid var(--brand)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="stat-label">Total tasks</span>
              <span style={{ fontSize: "1.1rem" }}>📁</span>
            </div>
            <strong style={{ fontSize: "28px", color: "var(--text)" }}>{tasks.length}</strong>
          </div>
          <div className="stat-panel" style={{ borderTop: "3px solid var(--warning)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="stat-label">In progress</span>
              <span style={{ fontSize: "1.1rem" }}>⚡</span>
            </div>
            <strong className="stat-val-progress" style={{ fontSize: "28px" }}>{inProgressCount}</strong>
          </div>
          <div className="stat-panel" style={{ borderTop: "3px solid var(--violet)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="stat-label">In review</span>
              <span style={{ fontSize: "1.1rem" }}>👀</span>
            </div>
            <strong className="stat-val-review" style={{ fontSize: "28px" }}>{reviewCount}</strong>
          </div>
          <div className="stat-panel stat-progress" style={{ borderTop: "3px solid var(--accent)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="stat-label">Complete</span>
              <span style={{ fontSize: "1.1rem" }}>🎯</span>
            </div>
            <strong className="stat-val-complete" style={{ fontSize: "28px" }}>{completionRate}%</strong>
            <span className="progress-track">
              <span style={{ width: `${completionRate}%`, background: "linear-gradient(90deg, #ffae19 0%, #00d2ff 100%)" }} />
            </span>
          </div>
        </div>

        {/* View Switcher & Power-User Controls */}
        <div
          className="view-switcher-bar"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              background: "var(--panel)",
              padding: "4px",
              borderRadius: "14px",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-soft)",
            }}
          >
            {[
              { id: "board", label: "📌 Kanban Board", keyBadge: "B" },
              { id: "calendar", label: "📅 Calendar", keyBadge: "M" },
              { id: "table", label: "📋 Table List", keyBadge: "T" },
              { id: "matrix", label: "🎯 Eisenhower 2x2", keyBadge: "E" },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  setCurrentView(v.id);
                  if (onViewChange) onViewChange(v.id);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "10px",
                  border: "none",
                  background: currentView === v.id ? "#6366f1" : "transparent",
                  color: currentView === v.id ? "#fff" : "var(--text)",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{v.label}</span>
                <span
                  style={{
                    fontSize: "0.68rem",
                    opacity: currentView === v.id ? 0.9 : 0.5,
                    background: currentView === v.id ? "rgba(255,255,255,0.25)" : "var(--border)",
                    padding: "1px 5px",
                    borderRadius: "4px",
                    fontFamily: "monospace",
                  }}
                >
                  {v.keyBadge}
                </span>
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => setShowShortcutsModal(true)}
              style={{
                padding: "6px 12px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                background: "var(--panel)",
                color: "var(--text)",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                boxShadow: "var(--shadow-soft)",
              }}
              title="View Keyboard Shortcuts (Press ?)"
            >
              ⌨️ Shortcuts{" "}
              <kbd
                style={{
                  fontSize: "0.7rem",
                  opacity: 0.7,
                  padding: "1px 5px",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                }}
              >
                ?
              </kbd>
            </button>
          </div>
        </div>

        {/* Search & Multi-Filter Toolbar */}
        <div
          className="board-filter-bar clay-card"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "12px 18px",
            marginBottom: "20px",
            borderRadius: "16px",
            background: "var(--panel)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          {/* Search Box */}
          <div style={{ position: "relative", flex: "1 1 260px", maxWidth: "380px" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
              🔍
            </span>
            <input
              id="flowtrack-board-search"
              type="text"
              placeholder="Search tasks by title or assignee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 65px 8px 36px",
                borderRadius: "9999px",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: "0.86rem",
                outline: "none",
              }}
            />
            <div style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: "2px" }}>
              {isSpeechSupported() && (
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  style={{
                    background: isVoiceSearching ? "#ef4444" : "transparent",
                    color: isVoiceSearching ? "#fff" : "var(--text-muted)",
                    border: "none",
                    borderRadius: "50%",
                    width: "26px",
                    height: "26px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.85rem",
                    transition: "all 0.15s ease",
                  }}
                  title={isVoiceSearching ? "Listening... Speak now" : "Voice search (Speak to filter)"}
                >
                  🎙️
                </button>
              )}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    fontSize: "1rem",
                    padding: 0,
                    lineHeight: 1,
                  }}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Priority:
            </span>
            {["all", "high", "medium", "low"].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                style={{
                  background: priorityFilter === p ? "var(--brand)" : "var(--bg)",
                  color: priorityFilter === p ? "#fff" : "var(--text)",
                  border: `1px solid ${priorityFilter === p ? "var(--brand)" : "var(--border)"}`,
                  borderRadius: "9999px",
                  padding: "4px 12px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  textTransform: "capitalize",
                  transition: "all 0.15s",
                }}
              >
                {p}
              </button>
            ))}

            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginLeft: "6px" }}>
              Deadline:
            </span>
            {[
              { id: "all", label: "All" },
              { id: "overdue", label: "⚠️ Overdue" },
              { id: "week", label: "📅 Due This Week" },
            ].map((u) => (
              <button
                key={u.id}
                onClick={() => setUrgencyFilter(u.id)}
                style={{
                  background: urgencyFilter === u.id ? "var(--brand)" : "var(--bg)",
                  color: urgencyFilter === u.id ? "#fff" : "var(--text)",
                  border: `1px solid ${urgencyFilter === u.id ? "var(--brand)" : "var(--border)"}`,
                  borderRadius: "9999px",
                  padding: "4px 12px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {u.label}
              </button>
            ))}

            {availableTags.length > 0 && (
              <>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginLeft: "6px" }}>
                  Tag:
                </span>
                {["all", ...availableTags.slice(0, 6)].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setTagFilter(tag)}
                    style={{
                      background: tagFilter === tag ? "var(--brand)" : "var(--bg)",
                      color: tagFilter === tag ? "#fff" : "var(--text)",
                      border: `1px solid ${tagFilter === tag ? "var(--brand)" : "var(--border)"}`,
                      borderRadius: "9999px",
                      padding: "4px 10px",
                      fontSize: "0.76rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {tag === "all" ? "All Tags" : tag}
                  </button>
                ))}
              </>
            )}

            {(searchQuery || priorityFilter !== "all" || urgencyFilter !== "all" || tagFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setPriorityFilter("all");
                  setUrgencyFilter("all");
                  setTagFilter("all");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ef4444",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "underline",
                  marginLeft: "4px",
                }}
              >
                Reset ({filteredTasks.length}/{tasks.length})
              </button>
            )}
          </div>
        </div>

        {currentView === "board" && (
          <div className="columns-wrapper">
            {columns.map((ColName, index) => (
              <Column 
                key={index} 
                column_name={ColName} 
                tasks={filteredTasks.filter((task) => task.status === ColName)}
                userRole={userRole}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onViewDetails={(taskId) => setDetailTaskId(taskId)}
                onAdvanceTask={handleAdvanceTask}
                onQuickAddTask={handleQuickAddTask}
                current_user_id={userData?.id}
              />
            ))}
          </div>
        )}

        {currentView === "calendar" && (
          <CalendarView
            tasks={filteredTasks}
            onViewDetails={(taskId) => setDetailTaskId(taskId)}
            onTaskManagement={onTaskManagement}
            userRole={userRole}
          />
        )}

        {currentView === "table" && (
          <TableView
            tasks={filteredTasks}
            onViewDetails={(taskId) => setDetailTaskId(taskId)}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onAdvanceTask={handleAdvanceTask}
            userRole={userRole}
          />
        )}

        {currentView === "matrix" && (
          <EisenhowerMatrixView
            tasks={filteredTasks}
            onViewDetails={(taskId) => setDetailTaskId(taskId)}
            onAdvanceTask={handleAdvanceTask}
          />
        )}
      </div>
      
      {/* Task Management Modal */}
      {showTaskManagement && (
        <TaskManagement
          userRole={userRole}
          projects={allProjects}
          selectedProject={selectedProject}
          onTaskUpdate={handleTaskUpdate}
          onClose={handleCloseTaskManagement}
          editingTaskId={editingTaskId}
        />
      )}

      {/* AI Sprint Summary Modal */}
      {showAISummary && (
        <AISprintSummaryModal
          project={selectedProject || allProjects?.[0]}
          onClose={() => setShowAISummary(false)}
        />
      )}

      {/* Visual Analytics & Export Hub Modal */}
      {showAnalytics && (
        <ProjectAnalyticsModal
          project={selectedProject || allProjects?.[0]}
          tasks={tasks}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {/* Executive PDF Report Modal */}
      {showExecutiveReport && (
        <ExecutiveReportModal
          project={selectedProject || allProjects?.[0]}
          tasks={tasks}
          currentUser={userData}
          userRole={userRole}
          onClose={() => setShowExecutiveReport(false)}
        />
      )}

      {/* Task Detail, Interactive Checklist & Discussion Modal */}
      {detailTaskId && (
        <TaskDetailModal
          task={tasks.find((t) => t.id === detailTaskId) || { id: detailTaskId, title: "Task Details", checklist: [] }}
          onClose={() => setDetailTaskId(null)}
          onTaskUpdated={(updatedChecklist) => {
            if (updatedChecklist && Array.isArray(updatedChecklist)) {
              setTasks((prev) =>
                prev.map((t) => (t.id === detailTaskId ? { ...t, checklist: updatedChecklist } : t))
              );
            }
            if (onRefreshBoard) onRefreshBoard();
          }}
          userRole={userRole}
          currentUserId={userData?.id}
        />
      )}

      {/* Live Activity Audit Trail Drawer */}
      {showActivityFeed && (
        <ActivityFeedDrawer
          projectId={selectedProject?.id || allProjects?.[0]?.id}
          isOpen={showActivityFeed}
          onClose={() => setShowActivityFeed(false)}
        />
      )}

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      {showShortcutsModal && (
        <KeyboardShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}
    </DragDropContext>
  )
}

export default ColumnContainer
