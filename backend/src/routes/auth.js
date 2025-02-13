const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');

// 注册路由
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 创建新用户
    const user = new User({ username, password });
    await user.save();

    // 生成 JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: user._id,
        username: user.username
      }
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 登录路由
router.post('/login', async (req, res) => {
  try {
    console.log('收到登录请求...');
    const { username, password } = req.body;

    // 查找用户
    console.log('查找用户:', username);
    const user = await User.findOne({ username });
    if (!user) {
      console.log('用户不存在:', username);
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 验证密码
    console.log('验证用户密码...');
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      console.log('密码验证失败');
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    console.log('密码验证成功');

    // 生成 JWT token
    console.log('生成JWT token...');
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET环境变量未设置');
      throw new Error('服务器配置错误：JWT_SECRET未设置');
    }
    let token;
    try {
      token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: '24h'
      });
      console.log('JWT token生成成功');
    } catch (jwtError) {
      console.error('JWT token生成失败:', jwtError);
      throw new Error('Token生成失败');
    }

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user._id,
        username: user.username
      }
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

module.exports = router;