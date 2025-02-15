import db from '../database/config.js';
import bcrypt from 'bcryptjs';

class UserModel {
  static async findAll() {
    await db.read();
    return db.data.users;
  }

  static async findById(id) {
    await db.read();
    return db.data.users.find(user => user.id === id);
  }

  static async findByUsername(username) {
    await db.read();
    return db.data.users.find(user => user.username === username);
  }

  static async create(userData) {
    await db.read();
    const id = db.data.users.length > 0 ? Math.max(...db.data.users.map(u => u.id)) + 1 : 1;
    
    const hashedPassword = await bcrypt.hash(userData.password, 8);
    const user = {
      id,
      username: userData.username,
      password: hashedPassword,
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
    const updatedUser = {
      ...user,
      ...userData,
      updatedAt: new Date()
    };

    if (userData.password) {
      updatedUser.password = await bcrypt.hash(userData.password, 8);
    }

    db.data.users[index] = updatedUser;
    await db.write();
    return updatedUser;
  }

  static async delete(id) {
    await db.read();
    const index = db.data.users.findIndex(user => user.id === id);
    if (index === -1) return false;

    db.data.users.splice(index, 1);
    await db.write();
    return true;
  }

  static async comparePassword(user, password) {
    return bcrypt.compare(password, user.password);
  }
}

export default UserModel;