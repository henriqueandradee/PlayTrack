/**
 * ✅ LGPD Art. 14: Age Validation Utilities (Frontend)
 * Ensures users are at least 18 years old
 */

export interface AgeValidationResult {
  isValid: boolean;
  age?: number;
  message?: string;
}

interface BirthDateParts {
  year: number;
  month: number;
  day: number;
}

const parseBirthDateParts = (birthDate: string | Date): BirthDateParts | null => {
  if (typeof birthDate === 'string') {
    const match = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    return { year, month, day };
  }

  if (isNaN(birthDate.getTime())) return null;

  return {
    year: birthDate.getFullYear(),
    month: birthDate.getMonth() + 1,
    day: birthDate.getDate(),
  };
};

/**
 * Calculate age from birth date
 */
export function calculateAge(birthDate: string | Date): number {
  const parts = parseBirthDateParts(birthDate);
  if (!parts) return NaN;

  const today = new Date();
  let age = today.getFullYear() - parts.year;
  const monthDiff = today.getMonth() + 1 - parts.month;

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parts.day)) {
    age--;
  }

  return age;
}

/**
 * Validate if birth date results in age >= minAge
 */
export function validateAge(
  birthDate: string | Date,
  minAge: number = 18
): AgeValidationResult {
  // Handle empty/null values
  if (!birthDate) {
    return {
      isValid: false,
      message: 'Data de nascimento e obrigatoria',
    };
  }

  const parts = parseBirthDateParts(birthDate);

  // Validate date is valid
  if (!parts) {
    return {
      isValid: false,
      message: 'Formato de data invalido',
    };
  }

  const birth = new Date(parts.year, parts.month - 1, parts.day);
  if (
    birth.getFullYear() !== parts.year ||
    birth.getMonth() + 1 !== parts.month ||
    birth.getDate() !== parts.day
  ) {
    return {
      isValid: false,
      message: 'Data de nascimento invalida',
    };
  }

  // Check date is not in future
  if (birth > new Date()) {
    return {
      isValid: false,
      message: 'Data de nascimento nao pode estar no futuro',
    };
  }

  const age = calculateAge(birth);

  if (!Number.isFinite(age)) {
    return {
      isValid: false,
      message: 'Nao foi possivel calcular a idade',
    };
  }

  if (age < minAge) {
    return {
      isValid: false,
      age,
      message: `Voce deve ter pelo menos ${minAge} anos. Idade atual: ${age}`,
    };
  }

  return {
    isValid: true,
    age,
  };
}

/**
 * Check if birth date is valid (not in future)
 */
export function isValidBirthDate(birthDate: string | Date): boolean {
  const parts = parseBirthDateParts(birthDate);
  if (!parts) return false;

  const birth = new Date(parts.year, parts.month - 1, parts.day);
  if (
    birth.getFullYear() !== parts.year ||
    birth.getMonth() + 1 !== parts.month ||
    birth.getDate() !== parts.day
  ) {
    return false;
  }

  // Date in future
  if (birth > new Date()) {
    return false;
  }

  // Person older than 150 years (reasonable upper bound)
  const age = calculateAge(birth);
  if (age > 150) {
    return false;
  }

  return true;
}
