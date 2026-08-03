import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../layouts/header";
import ColumnContainer from "../layouts/column_container";
import ProjectManagement from "../components/ProjectManagement";
import TaskManagement from "../components/TaskManagement";
import { userAPI } from "../utils/api";

function Board() {
  const [userData, setUserData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProjectManagement, setShowProjectManagement] = useState(false);
  const [showTaskManagement, setShowTaskManagement] = useState(false);
  const navigate = useNavigate();

  // Authentication check and data fetching
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Check if user has a token
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("No token found, redirecting to login");
          navigate("/login");
          return;
        }

        // Fetch user data and projects from backend
        const data = await userAPI.getKanbanData();
        console.log("Fetched user data:", data);

        // Set user data and projects
        setUserData(data.user_details);
        setProjects(data.projects || []);

        // Auto-select first project for owners (no "All Projects" option)
        if (data.projects && data.projects.length > 0) {
          const firstProject = data.projects[0];
          if (firstProject && firstProject.id) {
            setSelectedProject(firstProject);
          }
        }

        // Fetch user role information
        const roleData = await userAPI.getRoles();
        setUserRole(roleData.highest_role);

      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err.message);
        
        // If it's a network error or server error, show error but don't redirect
        // Only redirect on authentication errors (handled above)
        if (err.message.includes("Failed to fetch")) {
          setError("Unable to connect to server. Please check your connection.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  // Handle project selection change
  const handleProjectChange = (project) => {
    setSelectedProject(project);
  };

  // Handle project management modal
  const handleProjectManagement = () => {
    setShowProjectManagement(true);
  };

  const handleCloseProjectManagement = () => {
    setShowProjectManagement(false);
  };

  // Handle task management modal
  const handleTaskManagement = () => {
    setShowTaskManagement(true);
  };

  const handleCloseTaskManagement = () => {
    setShowTaskManagement(false);
  };

  // Refresh data after project/task updates
  const handleProjectUpdate = async () => {
    try {
      const data = await userAPI.getKanbanData();
      setProjects(data.projects || []);
      if (data.projects && data.projects.length > 0) {
        const firstProject = data.projects[0];
        if (firstProject && firstProject.id) {
          setSelectedProject(firstProject);
        }
      }
    } catch (err) {
      console.error("Error refreshing projects:", err);
    }
  };

  const handleTaskUpdate = async () => {
    try {
      const data = await userAPI.getKanbanData(selectedProject?.id);
      setProjects(data.projects || []);
    } catch (err) {
      console.error("Error refreshing tasks:", err);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className='App'>
        <Header userData={userData} />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your boards...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className='App'>
        <Header userData={userData} />
        <div className="error-container">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='App'>
      <Header 
        userData={userData} 
      />
      <ColumnContainer 
        allProjects={projects}
        displayProjects={selectedProject ? [selectedProject] : (projects.length > 0 ? [projects[0]] : [])} 
        userData={userData}
        userRole={userRole}
        selectedProject={selectedProject}
        onProjectChange={handleProjectChange}
        onProjectManagement={handleProjectManagement}
        onTaskManagement={handleTaskManagement}
      />
      
      {/* Management Modals */}
      {showProjectManagement && (
        <ProjectManagement
          userRole={userRole}
          onProjectUpdate={handleProjectUpdate}
          onClose={handleCloseProjectManagement}
        />
      )}
      
      {showTaskManagement && (
        <TaskManagement
          userRole={userRole}
          projects={projects}
          onTaskUpdate={handleTaskUpdate}
          onClose={handleCloseTaskManagement}
        />
      )}
    </div>
  );
}

export default Board;



