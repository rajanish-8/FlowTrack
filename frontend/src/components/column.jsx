import TaskCard from "./taskcard"
import { Droppable } from "@hello-pangea/dnd"

function Column({column_name, tasks, userRole, onEditTask, onDeleteTask, current_user_id}){
  return(
    <div className="column">
      <div className="column-header">
        <h3>{column_name}</h3>
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
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}

export default Column