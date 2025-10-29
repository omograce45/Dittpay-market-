import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import db from './db.js'; // Make sure db.js exports your MySQL connection

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// ✅ Root route
app.get('/', (req, res) => {
  res.send('Ditpay Market Backend Running 🚀');
});

// ✅ Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('✅ Connected to MySQL database');
});

// ✅ SIGNUP ROUTE
app.post('/api/signup', async (req, res) => {
  const { fullname, username, email, state, gender, reason, password } = req.body;

  if (!fullname || !username || !email || !password || !state || !gender) {
    return res.status(400).json({ message: 'Please fill all required fields.' });
  }

  try {
    // Check if user already exists
    const checkQuery = 'SELECT id FROM users WHERE email = ? OR username = ?';
    db.query(checkQuery, [email, username], async (err, results) => {
      if (err) {
        console.error('Error checking user:', err);
        return res.status(500).json({ message: 'Server error.' });
      }

      if (results.length > 0) {
        return res.status(400).json({ message: 'User with this email or username already exists.' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      const insertQuery = `
        INSERT INTO users (fullname, username, email, state, gender, reason, password)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertQuery,
        [fullname, username, email, state, gender, reason, hashedPassword],
        (err, result) => {
          if (err) {
            console.error('Error inserting user:', err);
            return res.status(500).json({ message: 'Error creating account.' });
          }

          res.status(201).json({ message: 'Account created successfully!' });
        }
      );
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
