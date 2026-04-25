const express = require("express");

const Board = require("../models/Board");
const Org = require("../models/Org");
const Column = require("../models/Column");
const Card = require("../models/Card");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

async function userCanAccessOrg(orgId, userId) {
  return Org.exists({
    _id: orgId,
    members: userId,
  });
}

async function userCanAccessBoard(boardId, userId) {
  const board = await Board.findById(boardId);

  if (!board) {
    return null;
  }

  const canAccess = await userCanAccessOrg(board.org, userId);

  if (!canAccess) {
    return false;
  }

  return board;
}

router.post("/", async (req, res) => {
  try {
    const { name, orgId, org } = req.body;
    const targetOrgId = orgId || org;

    if (!name || !targetOrgId) {
      return res.status(400).json({
        message: "Board name and organization id are required",
      });
    }

    const canAccessOrg = await userCanAccessOrg(targetOrgId, req.user.id);

    if (!canAccessOrg) {
      return res.status(403).json({
        message: "You are not a member of this organization",
      });
    }

    const board = await Board.create({
      name,
      org: targetOrgId,
    });

    const defaultColumns = ["Up Next", "In Progress", "Testing", "Done"].map(
      (columnName, index) => ({
        name: columnName,
        board: board._id,
        order: index,
      }),
    );

    const columns = await Column.insertMany(defaultColumns);

    return res.status(201).json({
      board,
      columns,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create board",
      error: error.message,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const { orgId } = req.query;

    if (!orgId) {
      return res.status(400).json({
        message: "Organization id is required",
      });
    }

    const canAccessOrg = await userCanAccessOrg(orgId, req.user.id);

    if (!canAccessOrg) {
      return res.status(403).json({
        message: "You are not a member of this organization",
      });
    }

    const boards = await Board.find({ org: orgId }).sort({ createdAt: -1 });

    return res.status(200).json({ boards });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch boards",
      error: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const board = await userCanAccessBoard(req.params.id, req.user.id);

    if (board === false) {
      return res.status(403).json({
        message: "You are not allowed to view this board",
      });
    }

    if (!board) {
      return res.status(404).json({
        message: "Board not found",
      });
    }

    const columns = await Column.find({ board: board._id }).sort({ order: 1 });

    const cards = await Card.find({
      board: board._id,
      archived: false,
    }).sort({ order: 1 });

    const columnsWithCards = columns.map((column) => {
      const columnObject = column.toObject();

      columnObject.cards = cards
        .filter((card) => card.column.toString() === column._id.toString())
        .map((card) => card.toObject());

      return columnObject;
    });

    return res.status(200).json({
      board,
      columns: columnsWithCards,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch board",
      error: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const board = await userCanAccessBoard(req.params.id, req.user.id);

    if (board === false) {
      return res.status(403).json({
        message: "You are not allowed to delete this board",
      });
    }

    if (!board) {
      return res.status(404).json({
        message: "Board not found",
      });
    }

    await Card.deleteMany({ board: board._id });
    await Column.deleteMany({ board: board._id });
    await Board.findByIdAndDelete(board._id);

    return res.status(200).json({
      message: "Board deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete board",
      error: error.message,
    });
  }
});

module.exports = router;
