import { DataTypes } from 'sequelize';
import sequelize from '../../database/config';

const Tunnel = sequelize.define('Tunnel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  localPort: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  remoteHost: {
    type: DataTypes.STRING,
    allowNull: false
  },
  remotePort: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sshHost: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sshPort: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 22
  },
  sshUsername: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('connected', 'disconnected'),
    defaultValue: 'disconnected'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  privateKeyPath: {
    type: DataTypes.STRING
  },
  privateKeyName: {
    type: DataTypes.STRING
  }
}, {
  timestamps: true
});

export default Tunnel;