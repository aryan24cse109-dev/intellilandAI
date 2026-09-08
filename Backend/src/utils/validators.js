const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidUUID = (value) => {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
};

const isAllowedDocumentType = (type) => {
  return [
    "ROR",
    "MUTATION",
    "REGISTRATION",
    "HANDWRITTEN",
    "MAP",
  ].includes(type);
};

module.exports = {
  isValidEmail,
  isValidUUID,
  isAllowedDocumentType,
};