export const PASSWORD_MIN_LENGTH = 8;

export function validatePassword(password: string, confirmation?: string): string | undefined {
  if (password.length < PASSWORD_MIN_LENGTH) return "Use at least 8 characters for your password.";
  if (confirmation !== undefined && password !== confirmation) return "The passwords do not match.";
  return undefined;
}

export function validateResetCode(code: string): string | undefined {
  return /^\d{8}$/.test(code) ? undefined : "Enter the 8-digit code from your email.";
}
