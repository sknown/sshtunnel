const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    console.log('开始验证请求的认证token...');
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('请求中未找到token');
      throw new Error();
    }

    console.log('验证token的有效性...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('token验证成功，用户ID:', decoded.userId);
    req.user = { _id: decoded.userId };
    next();
  } catch (error) {
    console.log('token验证失败:', error.message);
    res.status(401).json({ message: '请先登录' });
  }
};

module.exports = auth;