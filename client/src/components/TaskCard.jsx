import { Draggable } from "@hello-pangea/dnd";

function TaskCard({
  card,
  index,
  onArchive,
  showArchive = false,
  isArchiving = false,
}) {
  if (!card) return null;

  return (
    <Draggable draggableId={card._id} index={index}>
      {(provided, snapshot) => (
        <article
          className={`task-card${snapshot.isDragging ? " task-card--dragging" : ""}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <span className="task-card__drag-handle" aria-hidden="true">
            ⠿
          </span>
          <p className="task-card__title">{card.title}</p>

          {showArchive && (
            <button
              type="button"
              className="task-card__archive"
              onClick={() => onArchive?.(card)}
              disabled={isArchiving}
            >
              {isArchiving ? "Archiving..." : "Archive"}
            </button>
          )}
        </article>
      )}
    </Draggable>
  );
}

export default TaskCard;
