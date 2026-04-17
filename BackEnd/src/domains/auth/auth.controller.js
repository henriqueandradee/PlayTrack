const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const config = require('../../config');
const { validatePassword } = require('../../shared/passwordValidator');
const { validateAge } = require('../../shared/ageValidator');
const { validateRequiredConsents } = require('../../shared/consentValidator');

const generateToken = (id, tokenVersion = 0) =>
  jwt.sign({ id, tv: tokenVersion }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

/**
 * POST /auth/register
 * ✅ LGPD Art. 7-8: Consentimento Explícito
 * ✅ LGPD Art. 14: Proteção de Menores (18+)
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, dateOfBirth, consents } = req.body;

    // ✅ Validar força de senha conforme LGPD
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(422).json({
        success: false,
        message: 'Weak password',
        code: 'WEAK_PASSWORD',
        errors: passwordValidation.errors,
      });
    }

    // ✅ LGPD Art. 14: Validar maioridade (18+)
    if (dateOfBirth) {
      const isAdult = validateAge(dateOfBirth, 18);
      if (!isAdult) {
        return res.status(422).json({
          success: false,
          message: 'Requisito de idade minima nao atendido. E necessario ter 18 anos ou mais.',
          code: 'UNDERAGE_USER',
        });
      }
    }

    // ✅ LGPD Art. 7-8: Validar consentimento explícito (não pode vir pré-marcado)
    const consentValidation = validateRequiredConsents(consents);
    if (!consentValidation.isValid) {
      return res.status(422).json({
        success: false,
        message: 'You must accept Terms and Privacy Policy to register.',
        code: 'MISSING_REQUIRED_CONSENT',
        missingConsents: consentValidation.missing,
      });
    }

    // ✅ Verificar email duplicado
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email already in use',
        code: 'DUPLICATE_EMAIL',
      });
    }

    // ✅ Criar usuário com LGPD compliance fields
    const user = await User.create({
      username,
      email,
      password,
      dateOfBirth: dateOfBirth || null,
      consents: {
        termsAccepted: consents.termsAccepted === true,
        privacyAccepted: consents.privacyAccepted === true,
        marketingConsent: consents.marketingConsent === true || false,
        acceptedAt: new Date(),
        acceptedIp: req.ip || req.connection.remoteAddress,
      },
    });

    const token = generateToken(user._id, user.tokenVersion);

    // ✅ Retorna token no JSON (frontend salva em localStorage)
    return res.status(201).json({
      success: true,
      data: {
        token, // ✅ Client-side irá usar via Authorization header
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          plan: user.plan.type,
          usage: user.usage,
        },
      },
      message: 'Registered successfully.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/login
 * ✅ LGPD Art. 17: Previne login de contas deletadas (soft delete)
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // ✅ LGPD Art. 17: Verificar se conta foi deletada (soft delete)
    if (!user.canLogin()) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deleted. Please contact support to restore.',
        code: 'ACCOUNT_DELETED',
      });
    }

    const token = generateToken(user._id, user.tokenVersion);

    // ✅ Retorna token no JSON (frontend salva em localStorage)
    return res.status(200).json({
      success: true,
      data: {
        token, // ✅ Client-side irá usar via Authorization header
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          plan: user.plan.type,
          usage: user.usage,
        },
      },
      message: 'Logged in successfully.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /auth/me
 */
exports.getMe = async (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        plan: req.user.plan.type,
        usage: req.user.usage,
      },
    },
  });
};

/**
 * POST /auth/logout
 * Limpa o cookie de token
 */
exports.logout = async (req, res) => {
  // ❌ Cookie clearance removed - using Authorization header instead
  // Frontend handles token cleanup via localStorage
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * POST /auth/delete-account
 * ✅ LGPD Art. 17: Direito ao Esquecimento (Soft Delete)
 * Soft deleta a conta (30 dias para recuperar)
 */
exports.deleteAccount = async (req, res, next) => {
  try {
    const { password, confirmEmail, reason } = req.body;
    const userId = req.user._id;

    // ✅ Validar se o usuário está autenticado
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    // ✅ Buscar usuário
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'NOT_FOUND',
      });
    }

    // ✅ Verificar senha
    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
        code: 'INVALID_PASSWORD',
      });
    }

    // ✅ Confirmar email
    if (confirmEmail !== user.email) {
      return res.status(422).json({
        success: false,
        message: 'Email confirmation does not match',
        code: 'EMAIL_MISMATCH',
      });
    }

    // ✅ LGPD Art. 17: Soft delete (30 dias para hard delete automático)
    user.deletedAt = new Date();
    user.deletedReason = reason || 'USER_REQUESTED';
    user.tokenVersion += 1;
    await user.save();

    // ✅ Limpar cookie de autenticação
    clearTokenCookie(res);

    // TODO: Enviar email de confirmação com link para undelete

    return res.status(200).json({
      success: true,
      message: 'Account marked for deletion. You have 30 days to restore it. Use /auth/undelete-account to cancel.',
      data: {
        deletedAt: user.deletedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/undelete-account
 * ✅ LGPD Art. 17: Recuperar conta dentro de 30 dias
 */
exports.undeleteAccount = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ✅ Buscar conta deletada
    const user = await User.findOne({ email, deletedAt: { $ne: null } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Deleted account not found for this email',
        code: 'NOT_FOUND',
      });
    }

    // ✅ Verificar se está dentro da janela de 30 dias
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (user.deletedAt < thirtyDaysAgo) {
      return res.status(410).json({
        success: false,
        message: 'Recovery window has expired (30 days). The account has been permanently deleted.',
        code: 'RECOVERY_EXPIRED',
      });
    }

    // ✅ Verificar senha
    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
        code: 'INVALID_PASSWORD',
      });
    }

    // ✅ LGPD Art. 17: Restaurar conta
    user.deletedAt = null;
    user.deletedReason = null;
    user.tokenVersion += 1;
    await user.save();

    // ✅ Gerar novo token
    const token = generateToken(user._id, user.tokenVersion);
    setTokenCookie(res, token);

    return res.status(200).json({
      success: true,
      message: 'Account restored successfully.',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          plan: user.plan.type,
          usage: user.usage,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /auth/roster
 * Returns the user's persistent team roster.
 */
exports.getRoster = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('teamRoster');
    return res.json({
      success: true,
      data: user.teamRoster || [],
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /auth/roster
 * Replaces the user's team roster with the provided list.
 */
exports.updateRoster = async (req, res, next) => {
  try {
    const { roster } = req.body;
    if (!Array.isArray(roster)) {
      return res.status(422).json({
        success: false,
        message: 'roster must be an array of { id, name }',
      });
    }

    // Validate and sanitize
    const sanitized = roster
      .filter((a) => a && typeof a.name === 'string' && a.name.trim())
      .map((a) => ({
        id: a.id || require('crypto').randomUUID(),
        name: a.name.trim(),
      }));

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { teamRoster: sanitized } },
      { new: true }
    ).select('teamRoster');

    return res.json({
      success: true,
      data: user.teamRoster,
    });
  } catch (err) {
    next(err);
  }
};
