const passwordValidators = {
  // Password validation comparissons map
  minLength: (password: string) => password.length >= 8,
  hasLowercase: (password: string) => /[a-z]/.test(password),
  hasUppercase: (password: string) => /[A-Z]/.test(password),
  hasNumber: (password: string) => /[0-9]/.test(password),
  hasSymbol: (password: string) => /[^A-Za-z0-9]/.test(password),
};

// Function for passing a single password through all validators and returnig all fails or success
export const validatePassword = (password: string): { isValid: boolean; message: string[] | null } => {
  const errors: string[] = [];

  if (!passwordValidators.minLength(password)) {
    errors.push('La contraseña debe contener mínimo 8 caracteres.');
  }
  if (!passwordValidators.hasLowercase(password)) {
    errors.push('La contraseña debe contener al menos una minúscula.');
  }
  if (!passwordValidators.hasUppercase(password)) {
    errors.push('La contraseña debe contener al menos una mayúscula.');
  }
  if (!passwordValidators.hasNumber(password)) {
    errors.push('La contraseña debe contener al menos un número.');
  }
  if (!passwordValidators.hasSymbol(password)) {
    errors.push('La contraseña debe contener al menos un símbolo especial.');
  }

  const passed = errors.length === 0;

  return {
    isValid: passed,
    message: passed ? null : errors,
  };
};
