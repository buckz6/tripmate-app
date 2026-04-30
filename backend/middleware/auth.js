const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token)
    return res.status(401).json({ error: 'Access denied. No token provided.', code: 'NO_TOKEN' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ error: 'Token has expired.', code: 'TOKEN_EXPIRED' });
    res.status(401).json({ error: 'Invalid token.', code: 'TOKEN_INVALID' });
  }
};
