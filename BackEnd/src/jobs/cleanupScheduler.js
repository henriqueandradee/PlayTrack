/**
 * Cleanup Scheduler
 * Job de limpeza automática:
 * - Deletar permanentemente usuários 30 dias após soft delete
 * - Executado diariamente às 0:00
 * 
 * Instalação: npm install node-schedule
 */

const schedule = require('node-schedule');
const User = require('../models/User');
const Video = require('../models/Video');
const Event = require('../models/Event');
const VideoStats = require('../models/VideoStats');

/**
 * Job: Deletar permanentemente usuários 30 dias após soft delete
 * Cascata:
 *   1. Deletar vídeos do usuário
 *   2. Deletar eventos (análises)
 *   3. Deletar estatísticas
 *   4. Deletar usuário
 */
const deleteExpiredAccounts = async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    console.log(`[CLEANUP] Starting cleanup job. Threshold: ${thirtyDaysAgo.toISOString()}`);

    // 1. Buscar usuários para deletar (soft deleted há 30+ dias)
    const usersToDelete = await User.find({
      deletedAt: { $lte: thirtyDaysAgo },
    });

    if (usersToDelete.length === 0) {
      console.log('[CLEANUP] Nenhum usuário para deletar');
      return;
    }

    console.log(`[CLEANUP] ${usersToDelete.length} usuário(s) marcado(s) para exclusão permanente`);

    // 2. Para cada usuário, deletar dados em cascata
    for (const user of usersToDelete) {
      try {
        // Delete vídeos e eventos relacionados
        await Video.deleteMany({ userId: user._id });
        await Event.deleteMany({ userId: user._id });
        await VideoStats.deleteMany({ userId: user._id });

        // Delete usuário
        const result = await User.deleteOne({ _id: user._id });

        console.log(`[CLEANUP] Deleted user ${user._id} (${user.email})`);
      } catch (err) {
        console.error(`[CLEANUP] Error deleting user ${user._id}:`, err.message);
      }
    }

    console.log(`[CLEANUP] Cleanup job completed. Deleted ${usersToDelete.length} account(s)`);
  } catch (err) {
    console.error('[CLEANUP] Error in deleteExpiredAccounts:', err);
  }
};

/**
 * Job: Notificar usuários com conta pendente de exclusão (> 20 dias)
 * Email de aviso: "Sua conta será deletada permanentemente em 10 dias"
 */
const notifyExpiringSoonAccounts = async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);

    const expiringAccounts = await User.find({
      deletedAt: { $gte: thirtyDaysAgo, $lte: twentyDaysAgo },
    });

    if (expiringAccounts.length === 0) {
      return;
    }

    console.log(`[CLEANUP] ${expiringAccounts.length} conta(s) vencendo em 10 dias`);

    // TODO: Enviar email de notificação
    // for (const user of expiringAccounts) {
    //   await sendEmail({
    //     to: user.email,
    //     template: 'account_deletion_warning',
    //     data: {
    //       username: user.username,
    //       daysRemaining: 10,
    //       recoveryUrl: `${process.env.FRONTEND_URL}/recover-account`
    //     }
    //   });
    // }
  } catch (err) {
    console.error('[CLEANUP] Error in notifyExpiringSoonAccounts:', err);
  }
};

/**
 * Iniciar scheduler
 * Chamado em server.js no bootstrap
 */
const startScheduler = () => {
  try {
    // Deletar contas permanentemente: diariamente às 0:00
    // Cron: '0 0 * * *' = todos os dias às 00:00
    schedule.scheduleJob('0 0 * * *', deleteExpiredAccounts);

    // Notificar contas vencendo: diariamente às 1:00
    schedule.scheduleJob('0 1 * * *', notifyExpiringSoonAccounts);

    console.log('[CLEANUP] Scheduler started successfully');
  } catch (err) {
    console.error('[CLEANUP] Error starting scheduler:', err);
  }
};

/**
 * Parar scheduler (útil para testes)
 */
const stopScheduler = () => {
  schedule.gracefulShutdown();
  console.log('[CLEANUP] Scheduler stopped');
};

module.exports = {
  startScheduler,
  stopScheduler,
  deleteExpiredAccounts,
  notifyExpiringSoonAccounts,
};
