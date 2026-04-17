const mongoose = require('mongoose');
const crypto = require('crypto');

const shareLinkSchema = new mongoose.Schema(
  {
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
    },
    // Usuário que criou o link (treinador)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Token único para acesso público
    token: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(6).toString('hex'), // Gera token de 12 caracteres (hex)
    },
    // Data de expiração (pode ser null para indefinido)
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias por padrão
    },
    // Soft delete para revogar acesso
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índice para remover documentos expirados automaticamente (TTL)
shareLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Método para verificar se o link está válido
shareLinkSchema.methods.isValid = function () {
  if (!this.isActive) return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  return true;
};

module.exports = mongoose.model('ShareLink', shareLinkSchema);
