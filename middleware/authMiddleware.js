const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (!token) return res.status(401).json({ message: "No token provided" });

    // Handle standard Bearer prefix if present
    if (token.startsWith('Bearer ')) {
      token = token.substring(7);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};