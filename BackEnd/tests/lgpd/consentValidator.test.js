const { validateRequiredConsents } = require('../../src/shared/consentValidator');

describe('LGPD Consent Validator', () => {
  it('should pass when terms and privacy are accepted', () => {
    const result = validateRequiredConsents({
      termsAccepted: true,
      privacyAccepted: true,
      marketingConsent: false,
    });

    expect(result.isValid).toBe(true);
    expect(result.missing.termsAccepted).toBe(false);
    expect(result.missing.privacyAccepted).toBe(false);
  });

  it('should fail when terms is missing', () => {
    const result = validateRequiredConsents({
      termsAccepted: false,
      privacyAccepted: true,
    });

    expect(result.isValid).toBe(false);
    expect(result.missing.termsAccepted).toBe(true);
    expect(result.missing.privacyAccepted).toBe(false);
  });

  it('should fail when privacy is missing', () => {
    const result = validateRequiredConsents({
      termsAccepted: true,
      privacyAccepted: false,
    });

    expect(result.isValid).toBe(false);
    expect(result.missing.termsAccepted).toBe(false);
    expect(result.missing.privacyAccepted).toBe(true);
  });
});
