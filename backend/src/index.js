import dotenv from 'dotenv';
dotenv.config();

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('../../package.json');

// 检查关键环境变量
console.log('正在检查环境变量配置...');
const requiredEnvVars = {
  PORT: process.env.PORT || pkg.config.dev.backendPort,
  JWT_SECRET: process.env.JWT_SECRET || 'sshtunnel-secure-jwt-secret-2024'
};

// 打印环境变量状态
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (value) {
    console.log(`✓ ${key} 已配置${key === 'MONGODB_URI' || key === 'PORT' ? `（${value}）` : ''}`);
  } else {
    console.error(`✗ ${key} 未配置`);
  }
});

// 验证必需的环境变量
if (!requiredEnvVars.JWT_SECRET) {
  console.error('错误：JWT_SECRET环境变量未设置，服务器无法启动');
  process.exit(1);
}

import express from 'express';
import cors from 'cors';
import sequelize from './database/config.js';
import authRoutes from './routes/auth.js';
import tunnelRoutes from './routes/tunnels.js';

const app = express();

// 中间件配置
app.use(cors());
app.use(express.json());

// 数据库连接配置
const connectDB = async () => {
  try {
    console.log('正在初始化数据库...');
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    process.exit(1);
  }
};

// 初始连接数据库
connectDB();

// 路由配置
app.use('/api/auth', authRoutes);
app.use('/api/tunnels', tunnelRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器错误' });
});

const PORT = process.env.PORT || pkg.config.dev.backendPort;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});