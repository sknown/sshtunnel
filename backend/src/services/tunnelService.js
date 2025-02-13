const { Client } = require('ssh2');
const Tunnel = require('../models/tunnel');
const FileService = require('./fileService');
const net = require('net');
const fileService = FileService;

class TunnelService {
  constructor() {
    this.activeTunnels = new Map();
    this.localServers = new Map();
  }

  async connect(tunnelId, userId) {
    console.log('开始连接隧道...', { tunnelId, userId });
    const tunnel = await Tunnel.findOne({ _id: tunnelId, userId });
    if (!tunnel) {
      console.log('隧道配置未找到', { tunnelId });
      throw new Error('隧道配置未找到');
    }

    if (this.activeTunnels.has(tunnelId)) {
      console.log('隧道已处于连接状态', { tunnelId });
      throw new Error('隧道已经处于连接状态');
    }

    const sshClient = new Client();

    return new Promise(async (resolve, reject) => {
      sshClient
        .on('ready', () => {
          console.log('SSH连接已就绪', { tunnelId });
          
          // 创建本地服务器
          const server = net.createServer((connection) => {
            console.log('本地端口收到新连接', { tunnelId, localPort: tunnel.localPort });

            sshClient.forwardOut(
              '127.0.0.1',
              tunnel.localPort,
              tunnel.remoteHost,
              tunnel.remotePort,
              async (err, stream) => {
                if (err) {
                  console.error('端口转发失败', { 
                    tunnelId, 
                    error: err.message,
                    remoteHost: tunnel.remoteHost,
                    remotePort: tunnel.remotePort
                  });
                  connection.end();
                  return;
                }

                connection.pipe(stream);
                stream.pipe(connection);

                connection.on('error', (err) => {
                  console.error('本地连接错误', { tunnelId, error: err.message });
                  stream.end();
                });

                stream.on('error', (err) => {
                  console.error('远程连接错误', { tunnelId, error: err.message });
                  connection.end();
                });
              }
            );
          });

          server.on('error', async (err) => {
            console.error('本地服务器错误', { tunnelId, error: err.message });
            await this.disconnect(tunnelId, userId);
            reject(new Error(`创建本地端口失败: ${err.message}`));
          });

          server.listen(tunnel.localPort, '127.0.0.1', async () => {
            console.log('本地端口监听成功', {
              tunnelId,
              localPort: tunnel.localPort
            });

            this.localServers.set(tunnelId, server);
            this.activeTunnels.set(tunnelId, sshClient);
            tunnel.status = 'connected';
            await tunnel.save();
            resolve(tunnel);
          });
        })
        .on('error', async (err) => {
          console.error('SSH连接错误', { tunnelId, error: err.message });
          await this.disconnect(tunnelId, userId);
          reject(new Error(`SSH连接失败: ${err.message}`));
        })
        .connect({
          host: tunnel.sshHost,
          port: tunnel.sshPort,
          username: tunnel.sshUsername,
          password: tunnel.sshPassword,
          privateKey: tunnel.privateKeyPath ? await fileService.getPrivateKey(tunnel.privateKeyPath).catch(err => {
            console.error('读取私钥文件失败', { tunnelId, error: err.message });
            throw new Error(`读取私钥文件失败: ${err.message}`);
          }) : tunnel.privateKey,
          agent: process.env.SSH_AUTH_SOCK,
          agentForward: true
        });
    });
  }

  async disconnect(tunnelId, userId) {
    const tunnel = await Tunnel.findOne({ _id: tunnelId, userId });
    if (!tunnel) {
      throw new Error('隧道配置未找到');
    }

    const sshClient = this.activeTunnels.get(tunnelId);
    if (sshClient) {
      sshClient.end();
      this.activeTunnels.delete(tunnelId);
    }

    const server = this.localServers.get(tunnelId);
    if (server) {
      server.close();
      this.localServers.delete(tunnelId);
    }

    tunnel.status = 'disconnected';
    await tunnel.save();
    return tunnel;
  }

  async getTunnelStatus(tunnelId, userId) {
    const tunnel = await Tunnel.findOne({ _id: tunnelId, userId });
    if (!tunnel) {
      throw new Error('隧道配置未找到');
    }
    return tunnel;
  }
}

module.exports = new TunnelService();