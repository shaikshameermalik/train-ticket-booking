const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg'); // PostgreSQL library
const verifyToken = require('./middleware/verifyToken'); // Import verifyToken middleware
const path = require('path'); // Import path for handling file paths

const app = express();

const JWT_SECRET = 'your_secret_key'; // Replace with a strong secret key

app.use(cors());
app.use(bodyParser.json());

// PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres', // Your PostgreSQL username
  host: 'localhost', // Hostname (use 'localhost' or IP)
  database: 'ticket_booking', // Your PostgreSQL database name
  password: 'malik', // Your PostgreSQL password
  port: 5432, // PostgreSQL default port
});

// Serve frontend build (dist folder)
app.use(express.static(path.join('D:', 'train ticket booking', 'frontend', 'dist')));

// Serve all frontend routes to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join('D:', 'train ticket booking', 'frontend', 'dist', 'index.html'));
});

// User Registration Route
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required' });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into the database
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully', userId: result.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// User Login Route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Fetch user from the database
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    res.json({ token }); // Send the token to the client
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Protected Route
app.get('/protected', verifyToken, (req, res) => {
  res.json({ message: 'Protected data accessed', user: req.user });
});

// Get Available Seats
app.get('/seats', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM seats WHERE reserved = FALSE ORDER BY row_number, seat_number');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching seats:', error);
    res.status(500).json({ message: 'Error fetching seats' });
  }
});

app.post('/book-seats', verifyToken, async (req, res) => {
  const { seatIds } = req.body; // Expecting an array of seat IDs
  const userId = req.user.userId; // User ID from JWT

  if (!seatIds || seatIds.length === 0 || seatIds.length > 7) {
    return res.status(400).json({ message: 'You can book between 1 and 7 seats at a time' });
  }

  try {
    // Check if any seat is already reserved
    const result = await pool.query(
      'SELECT * FROM seats WHERE id = ANY($1) AND reserved = TRUE',
      [seatIds]
    );

    if (result.rows.length > 0) {
      return res.status(400).json({ message: 'Some seats are already reserved' });
    }

    // Reserve the seats
    await pool.query(
      'UPDATE seats SET reserved = TRUE, reserved_by = $1 WHERE id = ANY($2)',
      [userId, seatIds]
    );

    res.status(200).json({ message: 'Seats booked successfully!' });
  } catch (error) {
    console.error('Error booking seats:', error);
    res.status(500).json({ message: 'Error booking seats' });
  }
});

// Root Route
// app.get('/', (req, res) => {
//   res.send('Server is running!');
// });

// Start the server

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});