const express = require('express');
const router = express.Router();
const tunnelService = require('../services/tunnelService');
const auth = require('../middleware/auth');
const Tunnel = require('../models/tunnel');
const fileService = require('../services/fileService');

// 获取用户的所有隧道配置
router.get('/', auth, async (req, res) => {
  try {
    const tunnels = await Tunnel.find({ userId: req.user._id });
    res.json(tunnels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 创建新的隧道配置
router.post('/', auth, async (req, res) => {
  try {
    let privateKeyPath;
    if (req.body.privateKey) {
      privateKeyPath = await fileService.savePrivateKey(req.body.privateKey);
    }

    const tunnelData = { 
      ...req.body, 
      userId: req.user._id,
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
router.put('/:id', auth, async (req, res) => {
  try {
    const tunnel = await Tunnel.findOne({ _id: req.params.id, userId: req.user._id });
    if (!tunnel) {
      return res.status(404).json({ message: '隧道不存在或无权访问' });
    }

    if (tunnel.status === 'connected') {
      return res.status(400).json({ message: '无法编辑已连接的隧道' });
    }

    if (req.body.privateKey) {
      // 如果有新的私钥文件，先删除旧的
      if (tunnel.privateKeyPath) {
        await fileService.deletePrivateKey(tunnel.privateKeyPath);
      }
      const privateKeyPath = await fileService.savePrivateKey(req.body.privateKey);
      req.body.privateKeyPath = privateKeyPath;
      req.body.privateKeyName = req.body.privateKeyName;
    } else if (req.body.privateKeyName === '') {
      // 如果用户删除了私钥文件
      if (tunnel.privateKeyPath) {
        await fileService.deletePrivateKey(tunnel.privateKeyPath);
        req.body.privateKeyPath = null;
      }
    }

    Object.assign(tunnel, req.body);
    await tunnel.save();
    res.json(tunnel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 连接隧道
router.post('/:id/connect', auth, async (req, res) => {
  try {
    const tunnel = await tunnelService.connect(req.params.id, req.user._id);
    res.json(tunnel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 断开隧道
router.post('/:id/disconnect', auth, async (req, res) => {
  try {
    const tunnel = await tunnelService.disconnect(req.params.id, req.user._id);
    res.json(tunnel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 获取隧道状态
router.get('/:id/status', auth, async (req, res) => {
  try {
    const tunnel = await tunnelService.getTunnelStatus(req.params.id, req.user._id);
    res.json(tunnel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;