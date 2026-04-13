/**
 * Age Validator
 * Valida idade mínima (18+ para LGPD Art. 14)
 */

const parseBirthDateParts = (dateOfBirth) => {
  if (!dateOfBirth) return null;

  // Input do HTML date chega como YYYY-MM-DD; parse manual evita drift por timezone.
  if (typeof dateOfBirth === 'string') {
    const match = dateOfBirth.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    return { year, month, day };
  }

  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return null;

  return {
    year: birthDate.getFullYear(),
    month: birthDate.getMonth() + 1,
    day: birthDate.getDate(),
  };
};

/**
 * Calcular idade a partir de data de nascimento
 * @param {Date | String} dateOfBirth - data de nascimento
 * @returns {number} idade em anos
 */
const calculateAge = (dateOfBirth) => {
  const parts = parseBirthDateParts(dateOfBirth);
  if (!parts) return NaN;

  const today = new Date();

  let age = today.getFullYear() - parts.year;
  const monthDiff = today.getMonth() + 1 - parts.month;

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parts.day)) {
    age--;
  }

  return age;
};

/**
 * Validar se usuário tem pelo menos 18 anos
 * @param {Date | String} dateOfBirth
 * @returns {boolean}
 */
const validateAge = (dateOfBirth, minAge = 18) => {
  if (!dateOfBirth) return true; // Campo opcional, skip se não fornecido

  const age = calculateAge(dateOfBirth);
  if (!Number.isFinite(age)) return false;

  return age >= minAge;
};

/**
 * Validar data de nascimento (não é data futura)
 * @param {Date | String} dateOfBirth
 * @returns {boolean}
 */
const isValidBirthDate = (dateOfBirth) => {
  const parts = parseBirthDateParts(dateOfBirth);
  if (!parts) return false;

  const birthDate = new Date(parts.year, parts.month - 1, parts.day);
  if (Number.isNaN(birthDate.getTime())) return false;

  // Garante data real (ex.: 2024-02-31 deve ser inválida).
  if (
    birthDate.getFullYear() !== parts.year ||
    birthDate.getMonth() + 1 !== parts.month ||
    birthDate.getDate() !== parts.day
  ) {
    return false;
  }

  return birthDate <= new Date();
};

module.exports = {
  calculateAge,
  validateAge,
  isValidBirthDate,
};
