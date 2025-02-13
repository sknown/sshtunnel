# SSH隧道管理系统

一个简单易用的SSH隧道管理系统，帮助你轻松管理和维护多个SSH隧道连接。通过Web界面，你可以方便地创建、编辑、启动和停止SSH隧道，无需记忆复杂的命令行参数。

## 主要功能

- 📝 创建和管理多个SSH隧道配置
- 🔐 支持密码和私钥两种认证方式
- 🚀 一键连接/断开隧道
- 👀 实时查看隧道状态
- 🛡️ 用户认证和授权
- 💻 直观的Web管理界面

## 技术栈

### 后端
- Node.js
- Express.js
- MongoDB
- SSH2
- JWT认证

### 前端
- React
- TypeScript
- Material-UI
- Vite

## 安装指南

### 环境要求
- Node.js 14+
- MongoDB 4.4+
- npm 或 yarn

### 1. 克隆项目
```bash
git clone <repository-url>
cd sshtunnel
```

### 2. 后端设置
```bash
cd backend
npm install
```

创建 `.env` 文件并配置以下环境变量：
```
MONGODB_URI=mongodb://localhost:27017/sshtunnel
PORT=3000
JWT_SECRET=your-jwt-secret
LOG_LEVEL=debug
```

启动后端服务：
```bash
npm run dev  # 开发模式
# 或
npm start    # 生产模式
```

### 3. 前端设置
```bash
cd frontend
npm install
```

启动前端开发服务器：
```bash
npm run dev
```

## 使用说明

1. 访问 `http://localhost:5173` 打开Web界面
2. 注册/登录账号
3. 在仪表盘中点击"添加新隧道"创建隧道配置
4. 填写隧道配置信息：
   - 隧道名称：为隧道取一个易识别的名字
   - 本地端口：要监听的本地端口
   - 远程主机：目标服务器地址
   - 远程端口：目标服务器端口
   - SSH主机：SSH服务器地址
   - SSH端口：SSH服务器端口（默认22）
   - SSH用户名：SSH登录用户名
   - SSH密码或私钥：选择认证方式
5. 点击"连接"按钮启动隧道
6. 可以随时通过"断开"按钮停止隧道

## 安全说明

- 所有密码都经过加密存储
- 支持私钥认证方式
- 用户数据相互隔离
- JWT token认证保护API

## 开发说明

### 项目结构
```
├── backend/          # 后端代码
│   ├── src/
│   │   ├── models/   # 数据模型
│   │   ├── routes/   # API路由
│   │   ├── services/ # 业务逻辑
│   │   └── index.js  # 入口文件
│   └── package.json
└── frontend/        # 前端代码
    ├── src/
    │   ├── pages/    # 页面组件
    │   ├── components/# UI组件
    │   └── App.tsx   # 主应用
    └── package.json
```

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

[MIT License](LICENSE)