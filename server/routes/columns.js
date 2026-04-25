const express = require('express')

const Board = require('../models/Board')
const Card = require('../models/Card')
const Column = require('../models/Column')
const Org = require('../models/Org')
const { protect } = require('../middleware/auth')

const router = express.Router()

router.use(protect)

async function userCanAccessBoard(boardId, userId) {
  const board = await Board.findById(boardId)

  if (!board) {
    return { allowed: false, status: 404, message: 'Board not found' }
  }

  const org = await Org.findOne({
    _id: board.org,
    members: userId,
  })

  if (!org) {
    return {
      allowed: false,
      status: 403,
      message: 'You do not have access to this board',
    }
  }

  return { allowed: true, board, org }
}

router.post('/', async (req, res) => {
  try {
    const { name, boardId, board, order } = req.body
    const targetBoardId = boardId || board

    if (!name || !targetBoardId) {
      return res.status(400).json({
        message: 'Column name and boardId are required',
      })
    }

    const access = await userCanAccessBoard(targetBoardId, req.user.id)

    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message })
    }

    let columnOrder = order

    if (columnOrder === undefined || columnOrder === null) {
      const lastColumn = await Column.findOne({ board: targetBoardId })
        .sort({ order: -1 })
        .select('order')

      columnOrder = lastColumn ? lastColumn.order + 1 : 0
    }

    const column = await Column.create({
      name,
      board: targetBoardId,
      order: columnOrder,
    })

    res.status(201).json({ column })
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create column',
      error: error.message,
    })
  }
})

router.patch('/reorder', async (req, res) => {
  try {
    const { boardId, columns } = req.body

    if (!boardId || !Array.isArray(columns)) {
      return res.status(400).json({
        message: 'boardId and columns array are required',
      })
    }

    const access = await userCanAccessBoard(boardId, req.user.id)

    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message })
    }

    const columnIds = columns.map((column) => column.id || column._id)

    if (columnIds.some((id) => !id)) {
      return res.status(400).json({
        message: 'Every column must include an id',
      })
    }

    const existingColumnsCount = await Column.countDocuments({
      _id: { $in: columnIds },
      board: boardId,
    })

    if (existingColumnsCount !== columnIds.length) {
      return res.status(400).json({
        message: 'All reordered columns must belong to the target board',
      })
    }

    await Column.bulkWrite(
      columns.map((column, index) => ({
        updateOne: {
          filter: {
            _id: column.id || column._id,
            board: boardId,
          },
          update: {
            $set: {
              order:
                column.order === undefined || column.order === null
                  ? index
                  : column.order,
            },
          },
        },
      }))
    )

    const reorderedColumns = await Column.find({ board: boardId }).sort({
      order: 1,
      createdAt: 1,
    })

    res.status(200).json({ columns: reorderedColumns })
  } catch (error) {
    res.status(500).json({
      message: 'Failed to reorder columns',
      error: error.message,
    })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const column = await Column.findById(req.params.id)

    if (!column) {
      return res.status(404).json({ message: 'Column not found' })
    }

    const access = await userCanAccessBoard(column.board, req.user.id)

    if (!access.allowed) {
      return res.status(access.status).json({ message: access.message })
    }

    await Card.deleteMany({ column: column._id })
    await column.deleteOne()

    res.status(200).json({
      message: 'Column deleted successfully',
      columnId: req.params.id,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete column',
      error: error.message,
    })
  }
})

module.exports = router
