import express from 'express';
import tunnelService from '../services/tunnelService.js';
import { authenticateToken } from '../middleware/auth.js';
const router = express.Router();
import Tunnel from '../models/tunnel.js';
import fileService from '../services/fileService.js';

// 获取用户的所有隧道配置
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tunnels = await Tunnel.findAll({ where: { userId: req.user.id } });
    res.json(tunnels);
  } catch (error) {
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
      privateKeyPath = await fileService.savePrivateKey(req.body.privateKey);
    }

    const tunnelData = { 
      ...req.body, 
      userId: req.user.id,
      privateKeyPath,
      privateKeyName: req.body.privateKeyName
    };
    const tunnel = new Tunnel(tunnelData);
    await tunnel.save();
    res.status(201).json(tunnel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 更新隧道配置
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const tunnel = await Tunnel.findOne({ id: req.params.id, userId: req.user.id });
    if (!tunnel) {
      return res.status(404).json({ message: '隧道不存在或无权访问' });
    }

    if (tunnel.status === 'connected') {
      return res.status(400).json({ message: '无法编辑已连接的隧道' });
    }

    // 如果提供了新的私钥
    if (req.body.privateKey) {
      // 删除旧的私钥文件
      if (tunnel.privateKeyPath) {
        await fileService.deletePrivateKey(tunnel.privateKeyPath);
      }
      // 保存新的私钥文件
      req.body.privateKeyPath = await fileService.savePrivateKey(req.body.privateKey);
    }

    Object.assign(tunnel, req.body);
    await tunnel.save();
    res.json(tunnel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 删除隧道配置
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const tunnel = await Tunnel.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!tunnel) {
      return res.status(404).json({ message: '隧道不存在或无权访问' });
    }

    if (tunnel.status === 'connected') {
      return res.status(400).json({ message: '无法删除已连接的隧道' });
    }

    // 删除关联的私钥文件
    if (tunnel.privateKeyPath) {
      await fileService.deletePrivateKey(tunnel.privateKeyPath);
    }

    await tunnel.destroy();
    res.json({ message: '隧道配置已删除' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 连接隧道
router.post('/:id/connect', authenticateToken, async (req, res) => {
  try {
    const tunnel = await tunnelService.connect(req.params.id, req.user.id);
    res.json(tunnel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 断开隧道连接
router.post('/:id/disconnect', authenticateToken, async (req, res) => {
  try {
    const tunnel = await tunnelService.disconnect(req.params.id, req.user.id);
    res.json(tunnel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 获取隧道状态
router.get('/:id/status', authenticateToken, async (req, res) => {
  try {
    const tunnel = await tunnelService.getTunnelStatus(req.params.id, req.user.id);
    res.json(tunnel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;