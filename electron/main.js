import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let backendProcess;

function createWindow() {
  console.log('创建主窗口');
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('开发环境：加载开发服务器地址 http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
    // 在开发环境和生产环境中都打开开发者工具以便调试
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('生产环境：加载本地文件', indexPath);
    mainWindow.loadFile(indexPath);
  }


  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('页面加载失败:', errorCode, errorDescription);
  });

  mainWindow.on('closed', () => {
    console.log('主窗口已关闭');
    mainWindow = null;
  });
}

function startBackend() {

  console.log('启动后端服务');
  // 启动后端服务
  const backendPath = path.join(__dirname, '../backend/src/index.js');
  console.log('后端服务路径:', backendPath);
  backendProcess = spawn('node', [backendPath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });

  backendProcess.on('error', (error) => {
    console.error('后端服务启动失败:', error);
  });

  backendProcess.on('exit', (code) => {
    console.log('后端服务已退出，退出码:', code);
  });
}

app.whenReady().then(() => {
  console.log('应用程序就绪');
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // 确保在应用退出前关闭后端服务
  if (backendProcess) {
    backendProcess.kill();
  }
});