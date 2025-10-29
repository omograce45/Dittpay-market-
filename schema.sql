-- Make sure you're using the same database
USE ditpay_db;

-- Create users table for the second website
CREATE TABLE IF NOT EXISTS users_website2 (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fullname VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  state VARCHAR(50) NOT NULL,
  gender ENUM('Male','Female') NOT NULL,
  reason TEXT,
  password VARCHAR(255) NOT NULL,
  terms_accepted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Add a sample record for testing
INSERT INTO users_website2 (fullname, username, email, state, gender, reason, password)
VALUES (
  'Jane Smith',
  'janesmith',
  'jane@example.com',
  'Abuja',
  'Female',
  'Joining the new platform for business opportunities',
  'hashed_password_here'
);
