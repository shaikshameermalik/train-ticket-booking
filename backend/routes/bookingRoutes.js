const express = require('express');
const router = express.Router();
const { bookSeats } = require('../controllers/bookingController');
const verifyToken = require('../middleware/verifyToken'); // Middleware to check JWT token

// Route to book seats
router.post('/book', verifyToken, bookSeats);

module.exports = router;
