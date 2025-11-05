export const authenticateAdmin = (req, res, next) => {
  const { username, password } = req.body;

  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
};

export const verifyAdminSession = (req, res, next) => {
  const adminToken = req.headers['x-admin-token'];
  
  // Simple token verification (in production, use JWT)
  if (adminToken === Buffer.from(`${process.env.ADMIN_USERNAME}:${process.env.ADMIN_PASSWORD}`).toString('base64')) {
    next();
  } else {
    res.status(403).json({ error: 'Unauthorized access' });
  }
};
