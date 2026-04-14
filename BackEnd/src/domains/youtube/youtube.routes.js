// Endpoint para upload de cookies do YouTube
// Permite ao usuário fazer upload de um arquivo cookies.txt direto

const express = require('express');
const path = require('path');
const fs = require('fs');
const { success } = require('../../shared/response.helper');

const router = express.Router();

// Configurar diretório de cookies
const cookiesDir = path.join(__dirname, '../../config');

// Criar diretório se não existir
if (!fs.existsSync(cookiesDir)) {
  fs.mkdirSync(cookiesDir, { recursive: true });
}

/**
 * POST /youtube/upload-cookies
 * Upload de arquivo cookies.txt para YouTube authentication
 * Body deve conter o conteúdo do arquivo em base64 ou texto
 */
router.post('/upload-cookies', express.text({ limit: '100kb', type: 'text/plain' }), (req, res) => {
  try {
    if (!req.body || req.body.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum conteúdo foi enviado',
      });
    }

    const content = req.body;

    // Validar formato Netscape (deve ter .youtube.com)
    if (!content.includes('.youtube.com') && !content.includes('# Netscape')) {
      return res.status(400).json({
        success: false,
        message: 'Arquivo não parece ser um cookies.txt válido do YouTube. ' +
                'Certifique-se de que contém ".youtube.com"',
      });
    }

    // Salvar arquivo
    const targetPath = path.join(cookiesDir, 'cookies.txt');
    fs.writeFileSync(targetPath, content, 'utf-8');

    return res.json({
      success: true,
      message: 'Cookies do YouTube foram salvos com sucesso!',
      cookiesPath: targetPath,
      instructions: 'Próximo download de YouTube usará os cookies para autenticação.',
    });
  } catch (error) {
    console.error('[YouTube Cookies Upload Error]', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Erro ao processar arquivo de cookies',
    });
  }
});

/**
 * GET /youtube/cookies-status
 * Verificar se cookies.txt está configurado
 */
router.get('/cookies-status', (req, res) => {
  try {
    const cookiesPath = path.join(cookiesDir, 'cookies.txt');
    const hasLocalCookies = fs.existsSync(cookiesPath);
    const hasEnvCookies = !!process.env.YOUTUBE_COOKIES_FILE;

    return res.json({
      hasLocalCookies,
      hasEnvCookies,
      cookiesFile: hasLocalCookies ? cookiesPath : null,
      status: hasLocalCookies || hasEnvCookies ? 'configured' : 'not_configured',
      message: hasLocalCookies || hasEnvCookies 
        ? 'YouTube está autenticado. Downloads devem funcionar.'
        : 'Nenhum arquivo de cookies configurado. Se encontrar erros de autenticação, faça upload de um cookies.txt',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /youtube/cookies
 * Remover arquivo de cookies
 */
router.delete('/cookies', (req, res) => {
  try {
    const cookiesPath = path.join(cookiesDir, 'cookies.txt');
    
    if (fs.existsSync(cookiesPath)) {
      fs.unlinkSync(cookiesPath);
      return res.json({
        success: true,
        message: 'Cookies removidos com sucesso',
      });
    }

    return res.json({
      success: true,
      message: 'Nenhum arquivo de cookies para remover',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
