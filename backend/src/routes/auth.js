import express from 'express';
const router = express.Router();
import User from '../models/user.js';
import jwt from 'jsonwebtoken';

// 注册路由
router.post('/register', async (req, res) => {
  try {
    console.log('[注册] 收到注册请求:', { username: req.body.username });

    const { username, password } = req.body;

    // 验证请求数据
    if (!username || !password) {
      console.log('[注册] 请求数据验证失败：用户名或密码为空');
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    // 检查用户名是否已存在
    console.log('[注册] 检查用户名是否存在:', username);
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      console.log('[注册] 用户名已存在:', username);
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 创建新用户
    console.log('[注册] 开始创建新用户:', username);
    const user = await User.create({ username, password });

    // 生成 JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'sshtunnel-secure-jwt-secret-2024';
    if (!JWT_SECRET) {
      throw new Error('服务器配置错误：JWT_SECRET未设置');
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: '24h'
    });

    console.log('[注册] 用户创建成功:', { userId: user.id, username: user.username });
    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('[注册] 发生错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 登录路由
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 验证密码
    const isValidPassword = await User.comparePassword(user, password);
    if (!isValidPassword) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 生成 JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'sshtunnel-secure-jwt-secret-2024';
    if (!JWT_SECRET) {
      throw new Error('服务器配置错误：JWT_SECRET未设置');
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: '24h'
    });

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('[登录] 发生错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

export default router;