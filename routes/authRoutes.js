const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// 🔹 Register
router.post("/register", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  const checkUserQuery = "SELECT * FROM users WHERE email = ?";
  db.query(checkUserQuery, [email], (err, results) => {
    if (results.length > 0) {
      return res.status(400).json({ message: "User already exists!" });
    }

    const insertUserQuery = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
    db.query(insertUserQuery, [username, email, password], (err, result) => {
      if (err) return res.status(500).json({ message: "Database error!" });
      res.status(201).json({ message: "User registered successfully!" });
    });
  });
});

// 🔹 Login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required!" });

  const checkUserQuery = "SELECT * FROM users WHERE email = ?";
  db.query(checkUserQuery, [email], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error!" });

    if (results.length === 0) {
      return res.status(400).json({ message: "User not found!" });
    }
    if (results[0].password !== password) {
      return res.status(401).json({ message: "Incorrect password!" });
  }
  

    const user = results[0];

    // 🔹 Token Generate
    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );

    res.status(200).json({
      message: "Login successful!",
      accessToken,
      refreshToken,
      user: { id: user.id, username: user.username, email: user.email },
    });
  });
});

// 🔹 Protected Route
router.get("/profile", verifyToken, (req, res) => {
  const userId = req.user.id;
  const getUserQuery = "SELECT id, username, email FROM users WHERE id = ?";

  db.query(getUserQuery, [userId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ message: "User not found!" });
    }
    res.status(200).json({ user: results[0] });
  });
});

// 🔹 Refresh Token
router.post("/refresh", (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: "Refresh token missing!" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const accessToken = jwt.sign(
      { id: decoded.id, email: decoded.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({ accessToken });
  } catch (err) {
    res.status(403).json({ message: "Invalid refresh token!" });
  }
});

module.exports = router;
