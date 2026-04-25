const express = require('express')

const Org = require('../models/Org')
const User = require('../models/User')
const { protect } = require('../middleware/auth')

const router = express.Router()

router.use(protect)

router.post('/', async (req, res) => {
  try {
    const { name, description = '' } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Organization name is required' })
    }

    const org = await Org.create({
      name: name.trim(),
      description: description.trim(),
      owner: req.user.id,
      members: [req.user.id],
      invites: [],
    })

    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { orgs: org._id },
    })

    return res.status(201).json({ org })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create organization',
      error: error.message,
    })
  }
})

router.get('/', async (req, res) => {
  try {
    const orgs = await Org.find({ members: req.user.id })
      .populate('owner', 'username email')
      .sort({ createdAt: -1 })

    return res.status(200).json({ orgs })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch organizations',
      error: error.message,
    })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const org = await Org.findOne({
      _id: req.params.id,
      members: req.user.id,
    })
      .populate('owner', 'username email')
      .populate('members', 'username email')

    if (!org) {
      return res.status(404).json({ message: 'Organization not found' })
    }

    return res.status(200).json({ org })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch organization',
      error: error.message,
    })
  }
})

router.post('/:id/invite', async (req, res) => {
  try {
    const { email } = req.body

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Invite email is required' })
    }

    const org = await Org.findById(req.params.id)

    if (!org) {
      return res.status(404).json({ message: 'Organization not found' })
    }

    if (org.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can invite members' })
    }

    const normalizedEmail = email.trim().toLowerCase()

    if (!org.invites.includes(normalizedEmail)) {
      org.invites.push(normalizedEmail)
      await org.save()
    }

    const updatedOrg = await Org.findById(org._id)
      .populate('owner', 'username email')
      .populate('members', 'username email')

    return res.status(200).json({ org: updatedOrg })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to invite member',
      error: error.message,
    })
  }
})

router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const org = await Org.findById(req.params.id)

    if (!org) {
      return res.status(404).json({ message: 'Organization not found' })
    }

    if (org.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can remove members' })
    }

    if (org.owner.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Organization owner cannot be removed' })
    }

    const isMember = org.members.some(
      (memberId) => memberId.toString() === req.params.userId
    )

    if (!isMember) {
      return res.status(404).json({ message: 'User is not a member of this organization' })
    }

    org.members = org.members.filter(
      (memberId) => memberId.toString() !== req.params.userId
    )

    await org.save()

    await User.findByIdAndUpdate(req.params.userId, {
      $pull: { orgs: org._id },
    })

    const updatedOrg = await Org.findById(org._id)
      .populate('owner', 'username email')
      .populate('members', 'username email')

    return res.status(200).json({ org: updatedOrg })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to remove member',
      error: error.message,
    })
  }
})

module.exports = router
