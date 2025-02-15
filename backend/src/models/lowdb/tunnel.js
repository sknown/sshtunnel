import db from '../../database/config.js';

class TunnelModel {
  static async findAll(userId) {
    await db.read();
    return db.data.tunnels.filter(tunnel => tunnel.userId === userId);
  }

  static async findById(id) {
    await db.read();
    return db.data.tunnels.find(tunnel => tunnel.id === id);
  }

  static async create(tunnelData) {
    await db.read();
    const id = db.data.tunnels.length > 0 ? Math.max(...db.data.tunnels.map(t => t.id)) + 1 : 1;
    
    const tunnel = {
      id,
      ...tunnelData,
      status: 'disconnected',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    db.data.tunnels.push(tunnel);
    await db.write();
    return tunnel;
  }

  static async update(id, tunnelData) {
    await db.read();
    const index = db.data.tunnels.findIndex(tunnel => tunnel.id === id);
    if (index === -1) return null;

    const tunnel = db.data.tunnels[index];
    db.data.tunnels[index] = {
      ...tunnel,
      ...tunnelData,
      updatedAt: new Date()
    };

    await db.write();
    return db.data.tunnels[index];
  }

  static async delete(id) {
    await db.read();
    const index = db.data.tunnels.findIndex(tunnel => tunnel.id === id);
    if (index === -1) return false;

    db.data.tunnels.splice(index, 1);
    await db.write();
    return true;
  }

  static async updateStatus(id, status) {
    return this.update(id, { status });
  }
}

export default TunnelModel;