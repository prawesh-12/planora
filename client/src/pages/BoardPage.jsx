import { DragDropContext } from "@hello-pangea/dnd";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { archiveCard, createCard, getBoard, moveCard } from "../api";
import CreateTaskModal from "../components/CreateTaskModal";
import KanbanColumn from "../components/KanbanColumn";
import Navbar from "../components/Navbar";
import TaskCard from "../components/TaskCard";

function BoardPage() {
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingTask, setCreatingTask] = useState(false);
  const [archivingCardId, setArchivingCardId] = useState("");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBoard() {
      try {
        setLoading(true);
        setError("");

        const res = await getBoard(id);

        setBoard(res.data.board);
        setColumns(res.data.columns || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load board");
      } finally {
        setLoading(false);
      }
    }

    loadBoard();
  }, [id]);

  const getDefaultTaskColumn = () => {
    return (
      columns.find((column) => column.name?.toLowerCase() === "up next") ||
      columns[0]
    );
  };

  const handleCreateTask = async ({ title }) => {
    const targetColumn = getDefaultTaskColumn();

    if (!targetColumn) {
      setError("Create a column before adding tasks.");
      return;
    }

    try {
      setCreatingTask(true);
      setError("");

      const res = await createCard({
        title,
        columnId: targetColumn._id,
        boardId: board?._id || id,
      });

      const createdCard = res.data.card;

      setColumns((currentColumns) =>
        currentColumns.map((column) =>
          column._id === targetColumn._id
            ? {
              ...column,
              cards: [...(column.cards || []), createdCard],
            }
            : column,
        ),
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create task");
    } finally {
      setCreatingTask(false);
    }
  };

  const handleArchiveCard = async (card) => {
    try {
      setArchivingCardId(card._id);
      setError("");

      await archiveCard(card._id);

      setColumns((currentColumns) =>
        currentColumns.map((column) => ({
          ...column,
          cards: (column.cards || []).filter(
            (columnCard) => columnCard._id !== card._id,
          ),
        })),
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to archive task");
    } finally {
      setArchivingCardId("");
    }
  };

  const handleDragEnd = async (result) => {
    const { draggableId, source, destination } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const previousColumns = columns;
    const nextColumns = columns.map((column) => ({
      ...column,
      cards: [...(column.cards || [])],
    }));

    const sourceColumn = nextColumns.find(
      (column) => column._id === source.droppableId,
    );
    const destinationColumn = nextColumns.find(
      (column) => column._id === destination.droppableId,
    );

    if (!sourceColumn || !destinationColumn) return;

    const [draggedCard] = sourceColumn.cards.splice(source.index, 1);

    if (!draggedCard) return;

    destinationColumn.cards.splice(destination.index, 0, {
      ...draggedCard,
      column: destination.droppableId,
      order: destination.index,
    });

    setColumns(nextColumns);

    try {
      await moveCard(draggableId, {
        columnId: destination.droppableId,
        order: destination.index,
      });
    } catch (err) {
      setColumns(previousColumns);
      setError(err.response?.data?.message || "Failed to move task");
    }
  };

  const isDoneColumn = (column) => column.name?.toLowerCase() === "done";

  return (
    <div className="app-shell">
      <Navbar />

      <main className="page page--wide">
        <div className="page-header">
          <div>
            <h1>{board?.name || "Board"}</h1>
          </div>

          <button
            type="button"
            onClick={() => setIsTaskModalOpen(true)}
            disabled={loading || creatingTask || columns.length === 0}
          >
            {creatingTask ? "Creating..." : "Create New Task"}
          </button>
        </div>

        {error && <p className="alert alert--error">{error}</p>}

        {loading ? (
          <section className="empty-state">
            <h2>Loading board...</h2>
            <p>Fetching columns and tasks.</p>
          </section>
        ) : columns.length === 0 ? (
          <section className="empty-state">
            <h2>No columns yet</h2>
            <p>Create columns before adding tasks to this board.</p>
          </section>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <section className="kanban-board" aria-label="Kanban board columns">
              {columns.map((column) => (
                <KanbanColumn key={column._id} column={column}>
                  {column.cards?.length > 0 ? (
                    column.cards.map((card, index) => (
                      <TaskCard
                        key={card._id}
                        card={card}
                        index={index}
                        showArchive={isDoneColumn(column)}
                        isArchiving={archivingCardId === card._id}
                        onArchive={
                          archivingCardId === card._id
                            ? undefined
                            : handleArchiveCard
                        }
                      />
                    ))
                  ) : (
                    <div className="kanban-column__empty">
                      <p>No tasks yet</p>
                    </div>
                  )}
                </KanbanColumn>
              ))}
            </section>
          </DragDropContext>
        )}

        <CreateTaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onCreate={handleCreateTask}
        />
      </main>
    </div>
  );
}

export default BoardPage;
