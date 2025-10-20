import propTypes  from "prop-types";
import { Draggable } from "@hello-pangea/dnd";
import { useState, useEffect } from "react";
import defaultAvatar from "../assets/default-avatar.svg";

function TaskCard({id, title, due_date, priority_level, user_profile_picture, user_username, userRole, onEdit, onDelete, assigned_user_id, current_user_id, isDraggable = true }){
    const [isDragging, setIsDragging] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const priorityModifier = typeof priority_level === "string" ? priority_level.toLowerCase() : "";
    const priorityClassName = `priority-level ${priorityModifier ? `priority-${priorityModifier}` : ""}`.trim();
    
    // Detect touch device
    useEffect(() => {
        setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }, []);
    
    // Format due date for display
    const formatDate = (dateString) => {
        if (!dateString) return "No due date";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
        } catch (error) {
            return dateString; // Return original if parsing fails
        }
    };

    // Check if user can edit/delete this task
    const canEdit = userRole === 'super_admin' || userRole === 'manager';
    
    // Check if user can drag this task
    const canDrag = isDraggable && (
        userRole === 'super_admin' || 
        userRole === 'manager' || 
        assigned_user_id === current_user_id
    );

    // Handle touch events for better mobile experience
    const handleTouchStart = (e) => {
        if (isTouchDevice && canDrag) {
            e.preventDefault();
        }
    };

    return (
       <Draggable 
         draggableId={id.toString()} 
         type="TASK"
         isDragDisabled={!canDrag}
       >
        { (provided, snapshot)=> 
          (
           <div 
             className={`div-card ${snapshot.isDragging ? 'dragging' : ''} ${!canDrag ? 'not-draggable' : ''} ${isTouchDevice ? 'touch-device' : ''}`}
             ref={provided.innerRef}  
             {...provided.draggableProps} 
             {...(canDrag ? provided.dragHandleProps : {})}
             title={!canDrag ? "You can only move tasks assigned to you" : ""}
             onTouchStart={handleTouchStart}
           >
            <div className="task-header">
                <span className="task-name">{title}</span>
                {canEdit && (
                  <div className="task-actions">
                    <button 
                      className="task-action-btn edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit && onEdit(id);
                      }}
                      title="Edit task"
                      aria-label="Edit task"
                    >
                      ✏️
                    </button>
                    <button 
                      className="task-action-btn delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete && onDelete(id);
                      }}
                      title="Delete task"
                      aria-label="Delete task"
                    >
                      🗑️
                    </button>
                  </div>
                )}
            </div>
            <div className="task-footer">
                <div className="assignee-info">
                    <img 
                        src={user_profile_picture || defaultAvatar} 
                        alt="Assignee" 
                        className="profile-picture"
                        title="Assigned to"
                    />
                    <span className="username">{user_username}</span>
                </div>
                <div className="task-meta">
                    <span className={priorityClassName}>{priority_level}</span>
                    <div className="due-date">{formatDate(due_date)}</div>
                </div>
            </div>
           </div>
          ) 
        }
        </Draggable>
    )
}

TaskCard.propTypes ={
    id: propTypes.oneOfType([propTypes.string, propTypes.number]).isRequired,
    title: propTypes.string.isRequired,
    due_date : propTypes.string,
    user_profile_picture : propTypes.string,
    user_username : propTypes.string,
    priority_level : propTypes.string,
    userRole: propTypes.string,
    onEdit: propTypes.func,
    onDelete: propTypes.func,
    assigned_user_id: propTypes.number,
    current_user_id: propTypes.number,
    isDraggable: propTypes.bool
}

export default TaskCard;
