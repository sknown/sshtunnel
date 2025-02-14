// 全局配置常量
import pkg from '../../../package.json';

export const PORT = pkg.config.dev.backendPort;
export const API_BASE_URL = `http://localhost:${PORT}`;