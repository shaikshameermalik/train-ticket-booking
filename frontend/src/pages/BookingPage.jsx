import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BookingPage.css';

const BookingPage = () => {
  const [seats, setSeats] = useState([]); // All seats
  const [numSeats, setNumSeats] = useState(0); // Number of seats to book
  const [message, setMessage] = useState(''); // Status messages
  const [bookedSeats, setBookedSeats] = useState([]); // Seats booked in the current operation

  useEffect(() => {
    const fetchSeats = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get('http://localhost:5000/seats', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setSeats(response.data); // Load seat data
        } catch (error) {
          console.error('Error fetching seats:', error);
          setMessage('Access denied or error fetching seats');
        }
      } else {
        console.log('Token is missing');
        setMessage('Please log in to view and book seats');
      }
    };

    fetchSeats();
  }, []);

  const handleBooking = async () => {
    const token = localStorage.getItem('token');
  
    if (!numSeats || numSeats < 1 || numSeats > 7) {
      setMessage('Please enter a valid number of seats (1 to 7).');
      return;
    }
  
    console.log('Booking seats payload:', { numSeats });
  
    // Select available seats to book based on numSeats
    const availableSeatsToBook = seats
      .filter((seat) => !seat.reserved)  // Get only available seats
      .slice(0, numSeats); // Select the required number of seats
  
    if (availableSeatsToBook.length < numSeats) {
      setMessage('Not enough available seats.');
      return;
    }
  
    const seatIds = availableSeatsToBook.map((seat) => seat.id); // Get the IDs of the available seats
  
    try {
      const response = await axios.post(
        'http://localhost:5000/book-seats',
        { seatIds }, // Payload with seat IDs
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      console.log('Booking response:', response.data);
  
      if (response.data.message === 'Seats booked successfully!') {
        setBookedSeats(seatIds);
        setMessage(`Successfully booked seats: ${seatIds.join(', ')}`);
        setSeats((prevSeats) =>
          prevSeats.map((seat) =>
            seatIds.includes(seat.id) ? { ...seat, reserved: true } : seat
          )
        );
      } else {
        setMessage('Failed to book seats. Try again.');
      }
    } catch (error) {
      console.error('Error booking seats:', error);
      setMessage('Error booking seats. Please try again later.');
    }
  };
  


  return (
    <div>
      <h2>Booking Page</h2>
      {message && <p className="message">{message}</p>}
      <div className="controls">
        <input
          type="number"
          min="1"
          max="7"
          placeholder="Enter number of seats"
          value={numSeats}
          onChange={(e) => setNumSeats(Number(e.target.value))}
        />
        <button onClick={handleBooking}>Book Seats</button>
      </div>
      <div className="seats-container">
        {seats.map((seat) => (
          <div
            key={seat.id}
            className={`seat ${seat.reserved ? 'reserved' : ''} ${
              bookedSeats.includes(seat.id) ? 'booked' : ''
            }`}
          >
            {seat.row_number}-{seat.seat_number}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingPage;
