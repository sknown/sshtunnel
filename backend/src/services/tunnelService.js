import { Client } from 'ssh2';
import Tunnel from '../models/tunnel.js';
import FileService from './fileService.js';
import net from 'net';
const fileService = FileService;

class TunnelService {
  constructor() {
    this.activeTunnels = new Map();
    this.localServers = new Map();
  }

  async connect(tunnelId, userId) {
    const tunnel = await Tunnel.findOne({ where: { id: tunnelId, userId } });
    if (!tunnel) {
      throw new Error('隧道配置未找到');
    }

    if (this.activeTunnels.has(tunnelId)) {
      throw new Error('隧道已经处于连接状态');
    }

    const sshClient = new Client();

    return new Promise(async (resolve, reject) => {
      sshClient
        .on('ready', () => {
          const server = net.createServer((connection) => {
            sshClient.forwardOut(
              '127.0.0.1',
              tunnel.localPort,
              tunnel.remoteHost,
              tunnel.remotePort,
              async (err, stream) => {
                if (err) {
                  connection.end();
                  return;
                }

                connection.pipe(stream);
                stream.pipe(connection);

                connection.on('error', () => {
                  stream.end();
                });

                stream.on('error', () => {
                  connection.end();
                });
              }
            );
          });

          server.on('error', async (err) => {
            await this.disconnect(tunnelId, userId);
            reject(new Error(`创建本地端口失败: ${err.message}`));
          });

          server.listen(tunnel.localPort, '127.0.0.1', async () => {
            this.localServers.set(tunnelId, server);
            this.activeTunnels.set(tunnelId, sshClient);
            tunnel.status = 'connected';
            await tunnel.save();
            resolve(tunnel);
          });
        })
        .on('error', async (err) => {
          await this.disconnect(tunnelId, userId);
          reject(new Error(`SSH连接失败: ${err.message}`));
        })
        .connect({
          host: tunnel.sshHost,
          port: tunnel.sshPort,
          username: tunnel.sshUsername,
          password: tunnel.sshPassword,
          privateKey: tunnel.privateKeyPath ? await fileService.getPrivateKey(tunnel.privateKeyPath).catch(err => {
            throw new Error(`读取私钥文件失败: ${err.message}`);
          }) : tunnel.privateKey,
          agent: process.env.SSH_AUTH_SOCK,
          agentForward: true
        });
    });
  }

  async disconnect(tunnelId, userId) {
    const tunnel = await Tunnel.findOne({ where: { id: tunnelId, userId } });
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
    const tunnel = await Tunnel.findOne({ where: { id: tunnelId, userId } });
    if (!tunnel) {
      throw new Error('隧道配置未找到');
    }
    return tunnel;
  }
}

export default new TunnelService();