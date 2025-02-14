import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FileService {
  static instance = null;

  static getInstance() {
    if (!FileService.instance) {
      FileService.instance = new FileService();
    }
    return FileService.instance;
  }
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads/keys');
    // 确保上传目录存在
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async savePrivateKey(content) {
    // 生成唯一的文件名
    const fileName = crypto.randomBytes(16).toString('hex') + '.pem';
    const filePath = path.join(this.uploadDir, fileName);

    // 写入文件
    await fs.promises.writeFile(filePath, content, 'utf8');

    // 返回相对路径
    return path.relative(path.join(__dirname, '../..'), filePath);
  }

  async getPrivateKey(relativePath) {
    const absolutePath = path.join(__dirname, '../..', relativePath);
    
    // 验证文件路径是否在允许的目录内
    if (!absolutePath.startsWith(this.uploadDir)) {
      throw new Error(`无效的文件路径: ${absolutePath} 不在允许的目录 ${this.uploadDir} 内`);
    }

    try {
      return await fs.promises.readFile(absolutePath, 'utf8');
    } catch (error) {
      throw new Error(`读取私钥文件失败: ${error.message}`);
    }
  }

  async deletePrivateKey(relativePath) {
    const absolutePath = path.join(__dirname, '../..', relativePath);
    
    // 验证文件路径是否在允许的目录内
    if (!absolutePath.startsWith(this.uploadDir)) {
      throw new Error(`无效的文件路径: ${absolutePath} 不在允许的目录 ${this.uploadDir} 内`);
    }

    try {
      await fs.promises.unlink(absolutePath);
    } catch (error) {
      // 如果文件不存在，忽略错误
      if (error.code !== 'ENOENT') {
        throw new Error(`删除私钥文件失败: ${error.message}`);
      }
    }
  }
}

export default FileService.getInstance();