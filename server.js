require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  waitForConnections: true,
  connectionLimit: 10,
});

// ✅ Test DB connection
(async () => {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS result");
    console.log("✅ Database connected. Test result:", rows[0].result);
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
})();

// JWT authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

// Health check
app.get("/", (req, res) => {
  res.json({ message: "✅ DitPay backend is running" });
});

/* ================== AUTH ================== */

// ✅ SIGNUP ROUTE
app.post("/api/signup", async (req, res) => {
  const { fullname, username, email, state, gender, reason, password } = req.body;

  if (!fullname || !username || !email || !password || !state || !gender) {
    return res.status(400).json({ message: "Please fill all required fields." });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // ✅ Check if user exists (updated table name)
    const [existing] = await conn.query(
      "SELECT id FROM users_website2 WHERE email = ? OR username = ?",
      [email, username]
    );

    if (existing.length > 0) {
      conn.release();
      return res.status(400).json({ message: "User with this email or username already exists." });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insert new user (updated table name)
    const [result] = await conn.query(
      `INSERT INTO users_website2 (fullname, username, email, state, gender, reason, password)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [fullname, username, email, state, gender, reason, hashedPassword]
    );

    conn.release();
    console.log("✅ User inserted:", result.insertId);

    return res.status(201).json({ message: "Account created successfully!" });

  } catch (error) {
    console.error("❌ SIGNUP ERROR:", error);
    if (conn) conn.release();
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
});

// ✅ LOGIN ROUTE (NEW)
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Please enter both username and password." });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // ✅ Find user by username
    const [users] = await conn.query(
      "SELECT * FROM users_website2 WHERE username = ?",
      [username]
    );

    conn.release();

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = users[0];

    // ✅ Compare password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid password." });
    }

    // ✅ Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("✅ User logged in:", user.username);

    // ✅ Send response
    res.json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
      },
    });

} catch (error) {
  console.error("❌ LOGIN ERROR DETAILS:", error);
  if (conn) conn.release();
  return res.status(500).json({ message: "Server error.", error: error.message, stack: error.stack });
  }
});

// === POST Route: Add new market post ===
app.post("/api/post", (req, res) => {
  const { title, price, category, city, seller, image, description } = req.body;

  if (!title || !price || !category || !city || !seller || !image) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = `
    INSERT INTO market_posts (title, price, category, city, seller, image, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [title, price, category, city, seller, image, description], (err) => {
    if (err) {
      console.error("Error inserting post:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(200).json({ success: true, message: "Post added successfully" });
  });
});

// === GET Route: Fetch all posts (for index page) ===
app.get("/api/posts", (req, res) => {
  db.query("SELECT * FROM market_posts ORDER BY id DESC", (err, results) => {
    if (err) {
      console.error("Error fetching posts:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
