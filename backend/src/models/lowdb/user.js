import bcrypt from 'bcryptjs';
import db from '../../database/config.js';

class UserModel {
  static async findByUsername(username) {
    await db.read();
    return db.data.users.find(user => user.username === username);
  }

  static async findByEmail(email) {
    await db.read();
    return db.data.users.find(user => user.email === email);
  }

  static async create(userData) {
    await db.read();
    const id = db.data.users.length > 0 ? Math.max(...db.data.users.map(u => u.id)) + 1 : 1;
    
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = {
      id,
      username: userData.username,
      password: hashedPassword,
      email: userData.email,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    db.data.users.push(user);
    await db.write();
    return user;
  }

  static async update(id, userData) {
    await db.read();
    const index = db.data.users.findIndex(user => user.id === id);
    if (index === -1) return null;

    const user = db.data.users[index];
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    db.data.users[index] = {
      ...user,
      ...userData,
      updatedAt: new Date()
    };

    await db.write();
    return db.data.users[index];
  }

  static async comparePassword(user, candidatePassword) {
    return bcrypt.compare(candidatePassword, user.password);
  }
}

export default UserModel;