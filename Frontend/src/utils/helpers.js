export const cn = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

export const getInitials = (name = "") => {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "U";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

export const truncateText = (text, maxLength = 80) => {
  if (!text) {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
};

export const isValidEmail = (email = "") => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export const isValidFileType = (file, allowedTypes = []) => {
  if (!file) {
    return false;
  }

  return allowedTypes.includes(file.type);
};

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) {
    return "0 Bytes";
  }

  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / 1024 ** index).toFixed(2)} ${units[index]}`;
};

export const getApiErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again."
) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

export const hasRole = (user, ...allowedRoles) => {
  if (!user?.role) {
    return false;
  }

  return allowedRoles.includes(user.role);
};

export const canUploadDocuments = (user) => {
  return hasRole(user, "ADMIN", "OFFICER");
};

export const canVerifyDocuments = (user) => {
  return hasRole(user, "ADMIN", "OFFICER", "VERIFIER");
};

export const canViewAudit = (user) => {
  return hasRole(user, "ADMIN", "OFFICER", "VERIFIER");
};

export const canManageUsers = (user) => {
  return hasRole(user, "ADMIN");
};

export const canViewGIS = (user) => {
  return hasRole(user, "ADMIN", "OFFICER", "VERIFIER", "VIEWER");
};

export const canViewDocuments = (user) => {
  return hasRole(user, "ADMIN", "OFFICER", "VERIFIER", "VIEWER");
};