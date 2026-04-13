const { calculateAge, validateAge, isValidBirthDate } = require('../../src/shared/ageValidator');

describe('LGPD Age Validator', () => {
  it('should validate user with age >= 18', () => {
    const adultDate = new Date();
    adultDate.setFullYear(adultDate.getFullYear() - 20);
    expect(validateAge(adultDate)).toBe(true);
  });

  it('should reject user under 18', () => {
    const underageDate = new Date();
    underageDate.setFullYear(underageDate.getFullYear() - 16);
    expect(validateAge(underageDate)).toBe(false);
  });

  it('should reject future birth date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    expect(isValidBirthDate(futureDate)).toBe(false);
  });

  it('should calculate age as a non-negative integer', () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 30);
    const age = calculateAge(d);
    expect(Number.isInteger(age)).toBe(true);
    expect(age).toBeGreaterThanOrEqual(0);
  });

  it('should accept YYYY-MM-DD string for an adult age', () => {
    const d = new Date();
    const year = d.getFullYear() - 19;
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const isoDateOnly = `${year}-${month}-${day}`;

    expect(validateAge(isoDateOnly)).toBe(true);
  });

  it('should accept user who just turned 18 today', () => {
    const d = new Date();
    const year = d.getFullYear() - 18;
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const isoDateOnly = `${year}-${month}-${day}`;

    expect(validateAge(isoDateOnly)).toBe(true);
  });
});
