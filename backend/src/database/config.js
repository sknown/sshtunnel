import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置数据库文件路径
const dbDir = path.join(__dirname, '../../data');
const dbFile = path.join(dbDir, 'db.json');

// 确保数据目录存在
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 创建默认数据结构
const defaultData = {
  users: [],
  tunnels: []
};

// 创建数据库实例
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, defaultData);

// 初始化数据库结构
const initDb = async () => {
  await db.read();
  db.data ||= defaultData;
  await db.write();
};

// 初始化数据库
initDb().catch(console.error);

export default db;