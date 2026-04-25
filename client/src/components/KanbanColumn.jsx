import { Droppable } from "@hello-pangea/dnd";

function KanbanColumn({ column, children }) {
  const cards = column?.cards || [];
  const droppableId = String(column?._id || column?.id || "");

  return (
    <section className="kanban-column">
      <div className="kanban-column__header">
        <h2>{column?.name || "Untitled Column"}</h2>
        <span>{cards.length}</span>
      </div>

      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            className={`kanban-column__cards ${snapshot.isDraggingOver
              ? "kanban-column__cards--dragging-over"
              : ""
              }`}
            {...provided.droppableProps}
          >
            {children || (
              <div className="kanban-column__empty">
                <p>No tasks yet</p>
              </div>
            )}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </section>
  );
}

export default KanbanColumn;
