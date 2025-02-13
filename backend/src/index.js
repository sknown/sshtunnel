require('dotenv').config();

// 检查关键环境变量
console.log('正在检查环境变量配置...');
const requiredEnvVars = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/sshtunnel',
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET
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
if (!process.env.JWT_SECRET) {
  console.error('错误：JWT_SECRET环境变量未设置，服务器无法启动');
  process.exit(1);
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const tunnelRoutes = require('./routes/tunnels');

const app = express();

// 中间件配置
app.use(cors());
app.use(express.json());

// 数据库连接配置
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sshtunnel';
    console.log('尝试连接数据库:', mongoURI);
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      retryReads: true
    });
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    // 5秒后重试连接
    setTimeout(connectDB, 5000);
  }
};

// 初始连接数据库
connectDB();

// 监听数据库连接事件
mongoose.connection.on('disconnected', () => {
  console.log('数据库连接断开，尝试重新连接...');
  connectDB();
});

// 路由配置
app.use('/api/auth', authRoutes);
app.use('/api/tunnels', tunnelRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器错误' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});