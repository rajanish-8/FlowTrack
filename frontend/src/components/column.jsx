import TaskCard from "./taskcard"
import { Droppable } from "@hello-pangea/dnd"

function Column({column_name, tasks, userRole, onEditTask, onDeleteTask, current_user_id}){
  const statusClass = column_name.toLowerCase().replace(/\s+/g, "-");

  return(
    <div className={`column column-${statusClass}`}>
      <div className="column-header">
        <h3>{column_name}</h3>
        <span className="column-count">{tasks.length}</span>
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
                userRole={userRole}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
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
    </div>
  )
}

export default Column
