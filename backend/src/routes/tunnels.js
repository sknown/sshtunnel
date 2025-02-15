import express from 'express';
import tunnelService from '../services/tunnelService.js';
import { authenticateToken } from '../middleware/auth.js';
const router = express.Router();
import Tunnel from '../models/tunnel.js';
import fileService from '../services/fileService.js';

// 获取用户的所有隧道配置
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tunnels = await Tunnel.findAll(req.user.id);
    res.json(tunnels);
  } catch (error) {
    console.error('[隧道列表] 发生错误:', error);
    res.status(500).json({ 
      message: error.message,
      details: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

// 创建新的隧道配置
router.post('/', authenticateToken, async (req, res) => {
  try {
    let privateKeyPath;
    if (req.body.privateKey) {
      privateKeyPath = await fileService.savePrivateKey(req.body.privateKey, req.body.privateKeyName);
    }

    const tunnelData = { 
      ...req.body, 
      userId: req.user.id,
      privateKeyPath,
      privateKeyName: req.body.privateKeyName
    };
    
    const tunnel = await Tunnel.create(tunnelData);
    
    res.status(201).json(tunnel);
  } catch (error) {
    console.error('[隧道创建] 发生错误:', error);
    res.status(400).json({ message: error.message });
  }
});

// 更新隧道配置
router.put('/:id', authenticateToken, async (req, res) => {
  try {

    if (!req.params.id) {
      console.log('[隧道更新] 参数验证失败: 缺少隧道ID');
      return res.status(400).json({ message: '缺少隧道ID' });
    }

    const tunnel = await Tunnel.findById(req.params.id, req.user.id);
    if (!tunnel || tunnel.userId !== req.user.id) {
      console.log("tunnel", tunnel);
      console.log('[隧道更新] 隧道未找到或用户无权访问:', { tunnelId: req.params.id, userId: req.user.id });
      return res.status(404).json({ message: '隧道不存在或无权访问' });
    }

    if (tunnel.status === 'connected') {
      console.log('[隧道更新] 尝试更新已连接的隧道:', { tunnelId: tunnel.id, status: tunnel.status });
      return res.status(400).json({ message: '无法编辑已连接的隧道' });
    }

    if (req.body.privateKey) {
      console.log('[隧道更新] 检测到新的私钥文件');
      if (tunnel.privateKeyPath) {
        await fileService.deletePrivateKey(tunnel.privateKeyPath);
      }
      req.body.privateKeyPath = await fileService.savePrivateKey(req.body.privateKey, req.body.privateKeyName);
    }

    const updatedTunnel = await Tunnel.update(req.params.id, req.body, req.user.id);
    res.json(updatedTunnel);
  } catch (error) {
    console.error('[隧道更新] 发生错误:', error);
    res.status(400).json({ message: error.message });
  }
});

// 删除隧道配置
router.delete('/:id', authenticateToken, async (req, res) => {
  try {

    const tunnel = await Tunnel.findById(req.params.id, req.user.id);
    if (!tunnel || tunnel.userId !== req.user.id) {
      console.log('[隧道删除] 隧道未找到或用户无权访问:', { tunnelId: req.params.id, userId: req.user.id });
      return res.status(404).json({ message: '隧道不存在或无权访问' });
    }

    if (tunnel.status === 'connected') {
      console.log('[隧道删除] 尝试删除已连接的隧道:', { tunnelId: tunnel.id, status: tunnel.status });
      return res.status(400).json({ message: '无法删除已连接的隧道' });
    }

    if (tunnel.privateKeyPath) {
      console.log('[隧道删除] 删除关联的私钥文件:', { keyPath: tunnel.privateKeyPath });
      await fileService.deletePrivateKey(tunnel.privateKeyPath);
    }

    await Tunnel.delete(req.params.id);
    res.json({ message: '隧道配置已删除' });
  } catch (error) {
    console.error('[隧道删除] 发生错误:', error);
    res.status(500).json({ message: error.message });
  }
});

// 连接隧道
router.post('/:id/connect', authenticateToken, async (req, res) => {
  try {

    const tunnel = await tunnelService.connect(req.params.id, req.user.id, req.body.tempPassword);
    console.log('[隧道连接] 连接成功:', { tunnelId: tunnel.id, status: tunnel.status });
    res.json(tunnel);
  } catch (error) {
    console.error('[隧道连接] 发生错误:', error);
    res.status(500).json({ message: error.message });
  }
});

// 断开隧道连接
router.post('/:id/disconnect', authenticateToken, async (req, res) => {
  try {
    const tunnel = await tunnelService.disconnect(req.params.id, req.user.id);
    res.json(tunnel);
  } catch (error) {
    console.error('[隧道断开] 发生错误:', error);
    res.status(500).json({ message: error.message });
  }
});

// 获取隧道状态
router.get('/:id/status', authenticateToken, async (req, res) => {
  try {
    const tunnel = await tunnelService.getTunnelStatus(req.params.id, req.user.id);
    res.json(tunnel);
  } catch (error) {
    console.error('[隧道状态] 发生错误:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;