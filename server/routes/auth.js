const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Org = require("../models/Org");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

function toSafeUser(user) {
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    orgs: user.orgs,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function acceptPendingInvitesForUser(user) {
  const orgs = await Org.find({ invites: user.email });
  const joinedOrgIds = [];

  for (const org of orgs) {
    const alreadyMember = org.members.some(
      (memberId) => memberId.toString() === user._id.toString(),
    );

    if (!alreadyMember) {
      org.members.push(user._id);
      joinedOrgIds.push(org._id);
    }

    org.invites = org.invites.filter((email) => email !== user.email);
    await org.save();
  }

  if (joinedOrgIds.length > 0) {
    await User.findByIdAndUpdate(user._id, {
      $addToSet: { orgs: { $each: joinedOrgIds } },
    });
  }
}

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email, and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedUsername = username.trim();

    const existingUser = await User.findOne({
      $or: [{ username: trimmedUsername }, { email: normalizedEmail }],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User with this username or email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: trimmedUsername,
      email: normalizedEmail,
      passwordHash,
      orgs: [],
    });

    await acceptPendingInvitesForUser(user);

    const refreshedUser = await User.findById(user._id);

    const token = signToken(user._id);

    return res.status(201).json({
      token,
      user: toSafeUser(refreshedUser || user),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to register user",
      error: error.message,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if ((!username && !email) || !password) {
      return res.status(400).json({
        message: "Username or email and password are required",
      });
    }

    const loginValue = (email || username).trim();
    const user = await User.findOne({
      $or: [{ username: loginValue }, { email: loginValue.toLowerCase() }],
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid username/email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid username/email or password",
      });
    }

    await acceptPendingInvitesForUser(user);

    const refreshedUser = await User.findById(user._id);

    const token = signToken(user._id);

    return res.status(200).json({
      token,
      user: toSafeUser(refreshedUser || user),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to login",
      error: error.message,
    });
  }
});

router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch current user",
      error: error.message,
    });
  }
});

module.exports = router;
