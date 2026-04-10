/**
 * Validação de Senha conforme LGPD e Boas Práticas de Segurança
 * 
 * Requisitos:
 * - Mínimo 12 caracteres
 * - Pelo menos 1 letra maiúscula (A-Z)
 * - Pelo menos 1 número (0-9)
 * - Opcional: 1 caractere especial (!@#$%^&*)
 */

/**
 * Valida força de senha
 * @param {string} password - Senha a validar
 * @returns {object} { isValid: boolean, errors: string[] }
 */
const validatePassword = (password) => {
  const errors = [];

  if (!password) {
    errors.push('Senha é obrigatória');
    return { isValid: false, errors };
  }

  if (password.length < 12) {
    errors.push('Senha deve ter mínimo 12 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos 1 letra maiúscula (A-Z)');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Senha deve conter pelo menos 1 número (0-9)');
  }

  if (password.length > 128) {
    errors.push('Senha não pode ter mais de 128 caracteres');
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password),
  };
};

/**
 * Calcula força da senha
 * @param {string} password - Senha a avaliar
 * @returns {string} 'fraca' | 'média' | 'forte'
 */
const calculatePasswordStrength = (password) => {
  let strength = 0;

  // Comprimento
  if (password.length >= 12) strength++;
  if (password.length >= 16) strength++;
  if (password.length >= 20) strength++;

  // Tipos de caracteres
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;

  // Evita padrões comuns
  if (!/(.)\1{2,}/.test(password)) strength++; // Sem repetição de 3+ caracteres
  if (!/^[a-zA-Z]+$/.test(password)) strength++; // Não apenas letras

  if (strength < 4) return 'fraca';
  if (strength < 7) return 'média';
  return 'forte';
};

/**
 * Gera mensagem de feedback de força
 * @param {string} strength - Resultado de calculatePasswordStrength
 * @returns {string} Mensagem de feedback
 */
const getPasswordStrengthMessage = (strength) => {
  const messages = {
    fraca: '❌ Senha fraca. Adicione mais caracteres ou variedade.',
    média: '⚠️ Senha média. Considere adicionar caracteres especiais ou mais comprimento.',
    forte: '✅ Senha forte!',
  };
  return messages[strength] || '';
};

/**
 * Exemplo de senhas válidas
 * @returns {string[]} Array com exemplos de senhas que atendem aos requisitos
 */
const getPasswordExamples = () => {
  return [
    'SecurePass123',     // 13 char, maiúscula, número
    'MyApp@2024!',       // 11 char (fora do padrão), maiúscula, número, especial
    'PlayTrack456',      // 12 char, maiúscula, número
    'Football2024Year',  // 16 char, maiúscula, número
    'Password#2024',     // 13 char, maiúscula, número, especial
  ];
};

module.exports = {
  validatePassword,
  calculatePasswordStrength,
  getPasswordStrengthMessage,
  getPasswordExamples,
};
