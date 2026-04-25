const express = require("express");

const Card = require("../models/Card");
const Column = require("../models/Column");
const Org = require("../models/Org");
const Board = require("../models/Board");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

async function ensureBoardMember(boardId, userId) {
  const board = await Board.findById(boardId);
  if (!board) return null;

  const org = await Org.findOne({
    _id: board.org,
    members: userId,
  });

  return org ? board : null;
}

async function normalizeColumnOrders(columnId) {
  const cards = await Card.find({
    column: columnId,
    archived: false,
  }).sort({ order: 1, createdAt: 1 });

  await Promise.all(
    cards.map((card, index) => {
      if (card.order === index) return Promise.resolve(card);
      card.order = index;
      return card.save();
    }),
  );
}

router.post("/", async (req, res) => {
  try {
    const { title, columnId, column, boardId, board, order } = req.body;

    const cardTitle = title?.trim();
    const targetColumnId = columnId || column;
    const targetBoardId = boardId || board;

    if (!cardTitle) {
      return res.status(400).json({ message: "Card title is required" });
    }

    if (!targetColumnId) {
      return res.status(400).json({ message: "Column id is required" });
    }

    const targetColumn = await Column.findById(targetColumnId);
    if (!targetColumn) {
      return res.status(404).json({ message: "Column not found" });
    }

    if (
      targetBoardId &&
      targetColumn.board.toString() !== targetBoardId.toString()
    ) {
      return res.status(400).json({
        message: "Column does not belong to the provided board",
      });
    }

    const accessibleBoard = await ensureBoardMember(
      targetColumn.board,
      req.user.id,
    );

    if (!accessibleBoard) {
      return res.status(403).json({
        message: "You do not have access to this board",
      });
    }

    const nextOrder =
      typeof order === "number"
        ? order
        : await Card.countDocuments({
            column: targetColumn._id,
            archived: false,
          });

    const card = await Card.create({
      title: cardTitle,
      column: targetColumn._id,
      board: targetColumn.board,
      order: nextOrder,
    });

    await normalizeColumnOrders(targetColumn._id);

    const createdCard = await Card.findById(card._id);

    return res.status(201).json({ card: createdCard });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create card",
      error: error.message,
    });
  }
});

router.patch("/:id/move", async (req, res) => {
  try {
    const { columnId, column, order } = req.body;
    const destinationColumnId = columnId || column;

    if (!destinationColumnId) {
      return res
        .status(400)
        .json({ message: "Destination column id is required" });
    }

    if (typeof order !== "number") {
      return res.status(400).json({ message: "Destination order is required" });
    }

    const card = await Card.findOne({
      _id: req.params.id,
      archived: false,
    });

    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    const destinationColumn = await Column.findById(destinationColumnId);

    if (!destinationColumn) {
      return res.status(404).json({ message: "Destination column not found" });
    }

    if (card.board.toString() !== destinationColumn.board.toString()) {
      return res.status(400).json({
        message: "Cards can only be moved within the same board",
      });
    }

    const accessibleBoard = await ensureBoardMember(card.board, req.user.id);

    if (!accessibleBoard) {
      return res.status(403).json({
        message: "You do not have access to this board",
      });
    }

    const sourceColumnId = card.column.toString();
    const targetColumnId = destinationColumn._id.toString();
    const targetOrder = Math.max(0, order);

    if (sourceColumnId === targetColumnId) {
      const cards = await Card.find({
        column: sourceColumnId,
        archived: false,
      }).sort({ order: 1, createdAt: 1 });

      const currentIndex = cards.findIndex(
        (item) => item._id.toString() === card._id.toString(),
      );

      if (currentIndex === -1) {
        return res
          .status(404)
          .json({ message: "Card not found in source column" });
      }

      const [movedCard] = cards.splice(currentIndex, 1);
      const boundedOrder = Math.min(targetOrder, cards.length);

      cards.splice(boundedOrder, 0, movedCard);

      await Promise.all(
        cards.map((item, index) =>
          Card.updateOne(
            { _id: item._id },
            {
              $set: {
                column: destinationColumn._id,
                order: index,
              },
            },
          ),
        ),
      );
    } else {
      const sourceCards = await Card.find({
        column: sourceColumnId,
        archived: false,
        _id: { $ne: card._id },
      }).sort({ order: 1, createdAt: 1 });

      const destinationCards = await Card.find({
        column: destinationColumn._id,
        archived: false,
      }).sort({ order: 1, createdAt: 1 });

      const boundedOrder = Math.min(targetOrder, destinationCards.length);
      destinationCards.splice(boundedOrder, 0, card);

      await Promise.all([
        ...sourceCards.map((item, index) =>
          Card.updateOne(
            { _id: item._id },
            {
              $set: {
                order: index,
              },
            },
          ),
        ),
        ...destinationCards.map((item, index) =>
          Card.updateOne(
            { _id: item._id },
            {
              $set: {
                column: destinationColumn._id,
                order: index,
              },
            },
          ),
        ),
      ]);
    }

    const updatedCard = await Card.findById(card._id);

    return res.status(200).json({ card: updatedCard });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to move card",
      error: error.message,
    });
  }
});

router.patch("/:id/archive", async (req, res) => {
  try {
    const card = await Card.findOne({
      _id: req.params.id,
      archived: false,
    });

    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    const accessibleBoard = await ensureBoardMember(card.board, req.user.id);

    if (!accessibleBoard) {
      return res.status(403).json({
        message: "You do not have access to this board",
      });
    }

    card.archived = true;
    await card.save();

    await normalizeColumnOrders(card.column);

    return res.status(200).json({ card });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to archive card",
      error: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    const accessibleBoard = await ensureBoardMember(card.board, req.user.id);

    if (!accessibleBoard) {
      return res.status(403).json({
        message: "You do not have access to this board",
      });
    }

    const columnId = card.column;

    await card.deleteOne();
    await normalizeColumnOrders(columnId);

    return res.status(200).json({
      message: "Card deleted successfully",
      cardId: req.params.id,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete card",
      error: error.message,
    });
  }
});

module.exports = router;
