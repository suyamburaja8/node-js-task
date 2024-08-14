const SECRET_KEY = 'Admin@321';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (authHeader && authHeader === `Bearer ${SECRET_KEY}`) {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: Invalid or missing token' });
  }
};

module.exports = authMiddleware;
