const mongoose = require('mongoose');

const tunnelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  localPort: { type: Number, required: true },
  remoteHost: { type: String, required: true },
  remotePort: { type: Number, required: true },
  sshHost: { type: String, required: true },
  sshPort: { type: Number, required: true, default: 22 },
  sshUsername: { type: String, required: true },
  status: { type: String, enum: ['connected', 'disconnected'], default: 'disconnected' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  privateKeyPath: { type: String },
  privateKeyName: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tunnel', tunnelSchema);