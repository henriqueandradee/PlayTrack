const validateRequiredConsents = (consents = {}) => {
  const termsAccepted = consents.termsAccepted === true;
  const privacyAccepted = consents.privacyAccepted === true;

  return {
    isValid: termsAccepted && privacyAccepted,
    missing: {
      termsAccepted: !termsAccepted,
      privacyAccepted: !privacyAccepted,
    },
  };
};

module.exports = {
  validateRequiredConsents,
};
