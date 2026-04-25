import { Link } from "react-router-dom";

function BoardCard({ board }) {
  return (
    <Link className="board-card" to={`/board/${board._id}`}>
      <div className="board-card__preview" aria-hidden="true">
        <span className="board-card__bar board-card__bar--one" />
        <span className="board-card__bar board-card__bar--two" />
        <span className="board-card__bar board-card__bar--three" />
      </div>

      <div className="board-card__content">
        <h3>{board.name}</h3>
        <p className="board-card__open">
          <span className="board-card__open-dot" />
          Open board
        </p>
      </div>
    </Link>
  );
}

export default BoardCard;
