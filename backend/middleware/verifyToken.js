const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_secret_key';  // Use your actual JWT secret key here

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  // If no token is provided
  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  // Bearer <token> format
  const tokenWithoutBearer = token.split(' ')[1];

  // Verify the token
  jwt.verify(tokenWithoutBearer, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    // Save the decoded user info to request object
    req.user = decoded;
    next(); // Proceed to the next middleware or route handler
  });
};

module.exports = verifyToken;
