import { useState } from "react";

function ProjectDropdown({ projects, userRole, selectedProject, onProjectChange }) {
  const [isOpen, setIsOpen] = useState(false);

  // Only show dropdown for super admins
  if (userRole !== 'super_admin') {
    return null;
  }

  const handleProjectSelect = (project) => {
    onProjectChange(project);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (!selectedProject) {
      return projects.length > 0 ? projects[0].name : "Select Project";
    }
    return selectedProject.name;
  };

  return (
    <div className="project-dropdown">
      <button 
        className="project-dropdown-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="project-dropdown-text">{getDisplayText()}</span>
        <span className={`project-dropdown-arrow ${isOpen ? 'open' : ''}`}>
          ▼
        </span>
      </button>
      
      {isOpen && (
        <div className="project-dropdown-menu">
          {projects.map((project) => (
            <div 
              key={project.id}
              className="project-dropdown-item"
              onClick={() => handleProjectSelect(project)}
            >
              {project.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectDropdown;
