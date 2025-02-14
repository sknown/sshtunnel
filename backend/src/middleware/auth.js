import jwt from 'jsonwebtoken';

export const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'sshtunnel-secure-jwt-secret-2024';
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    res.status(401).json({ message: '请先登录' });
  }
};