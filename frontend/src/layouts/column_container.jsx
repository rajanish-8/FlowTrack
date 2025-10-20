import Column from "../components/column"
import { useState, useEffect, useCallback } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import ProjectDropdown from "../components/ProjectDropdown";
import TaskManagement from "../components/TaskManagement";
import { taskAPI } from "../utils/api";

function ColumnContainer({ allProjects, displayProjects, userData, userRole, selectedProject, onProjectChange, onProjectManagement, onTaskManagement }){
  // Define column mapping - backend uses lowercase, frontend displays capitalized
  const columnMapping = {
    "to do": "To Do",
    "in progress": "In Progress", 
    "review": "Review",
    "done": "Done"
  };
  
  const columns = ["To Do", "In Progress", "Review", "Done"];
  
  // Transform backend data to frontend format
  const [tasks, setTasks] = useState([]);
  const [showTaskManagement, setShowTaskManagement] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);

  useEffect(() => {
    if (displayProjects && displayProjects.length > 0) {
      // Flatten all tasks from display projects and transform to frontend format
      const allTasks = displayProjects.flatMap(project => 
        project.tasks.map(task => ({
          id: task.id,
          title: task.title,
          due_date: task.due_date,
          priority_level: task.priority || "Low", // Backend has priority field
          user_profile_picture: task.assigned_to?.profile_picture || null,
          user_username: task.assigned_to?.username || "Unassigned", // Add username
          assigned_user_id: task.assigned_to?.user_id || null, // Add assigned user ID
          status: columnMapping[task.status] || "To Do", // Map backend status to frontend display
          project_id: project.id
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
    // Super admins and managers can move any task, members can only move tasks assigned to them
    if (userRole !== 'super_admin' && userRole !== 'manager') {
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
        <h1 className="board-title">Task Board</h1>
        <div className="no-projects-message">
          <h3>No projects found</h3>
          <p>You don't have access to any projects yet. Contact your administrator to be added to a project.</p>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="column-container">
        <div className="board-header">
          <h1 className="board-title">Task Board</h1>
          <div className="board-actions">
            <div className="project-info">
              {allProjects.length > 0 && (
                <div className="project-display">
                  {userRole === 'super_admin' ? (
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
            
            {/* Management Actions - Always show for managers and super admins */}
            <div className="management-actions">
              {userRole === 'super_admin' && (
                <button 
                  className="btn btn-primary"
                  onClick={onProjectManagement}
                  title="Manage Projects"
                >
                  📋 Projects
                </button>
              )}
              {(userRole === 'super_admin' || userRole === 'manager') && (
                <button 
                  className="btn btn-secondary"
                  onClick={onTaskManagement}
                  title="Manage Tasks"
                >
                  ✅ Tasks
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="projects-info">
          <p>Showing tasks from {displayProjects.length} project{displayProjects.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="no-tasks-message">
          <h3>No tasks found</h3>
          <p>There are no tasks in your projects yet.</p>
          {(userRole === 'super_admin' || userRole === 'manager') && (
            <div style={{ marginTop: '20px' }}>
              <button 
                className="btn btn-primary"
                onClick={onTaskManagement}
                style={{ fontSize: '16px', padding: '12px 24px' }}
              >
                ➕ Create Your First Task
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return(
    <DragDropContext onDragEnd={onDrag}>
      <div className="column-container">
        <div className="board-header">
          <h1 className="board-title">Task Board</h1>
          <div className="board-actions">
            <div className="project-info">
              {allProjects.length > 0 && (
                <div className="project-display">
                  {userRole === 'super_admin' ? (
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
              {userRole === 'super_admin' && (
                <button 
                  className="btn btn-primary"
                  onClick={onProjectManagement}
                  title="Manage Projects"
                >
                  📋 Projects
                </button>
              )}
              {(userRole === 'super_admin' || userRole === 'manager') && (
                <button 
                  className="btn btn-secondary"
                  onClick={onTaskManagement}
                  title="Manage Tasks"
                >
                  ✅ Tasks
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="projects-info">
          <p>Showing tasks from {displayProjects.length} project{displayProjects.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="columns-wrapper">
          {columns.map((ColName, index) => (
            <Column 
              key={index} 
              column_name={ColName} 
              tasks={tasks.filter((task) => task.status === ColName)}
              userRole={userRole}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              current_user_id={userData?.id}
            />
          ))}
        </div>
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
    </DragDropContext>
  )
}

export default ColumnContainer