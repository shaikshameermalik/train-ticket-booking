const { Pool } = require('pg'); // PostgreSQL client
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ticket_booking',
  password: 'malik',
  port: 5432,
});

// Controller to book seats
const bookSeats = async (req, res) => {
  const { row_number, seat_numbers } = req.body; // Expecting row number and seat numbers to be booked

  try {
    // Check if the requested seats are available
    const { rows } = await pool.query(
      'SELECT * FROM seats WHERE row_number = $1 AND seat_number = ANY($2) AND is_booked = FALSE',
      [row_number, seat_numbers]
    );

    if (rows.length !== seat_numbers.length) {
      return res.status(400).json({ message: 'Some or all seats are already booked.' });
    }

    // Book the seats (mark them as booked)
    await pool.query(
      'UPDATE seats SET is_booked = TRUE WHERE row_number = $1 AND seat_number = ANY($2)',
      [row_number, seat_numbers]
    );

    return res.status(200).json({ message: 'Seats booked successfully!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { bookSeats };
