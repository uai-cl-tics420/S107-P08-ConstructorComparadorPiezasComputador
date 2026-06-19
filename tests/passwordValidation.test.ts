import { expect, test, describe } from 'bun:test';
import { validatePassword } from '../src/lib/auth/validators';

describe('Password Validators', () => {
  const cases = [
    ['Ab1!', 'La contraseña debe contener mínimo 8 caracteres.'],
    ['ABCDE123!', 'La contraseña debe contener al menos una minúscula.'],
    ['abcde123!', 'La contraseña debe contener al menos una mayúscula.'],
    ['Abcdefgh!', 'La contraseña debe contener al menos un número.'],
    ['Abcdefgh1', 'La contraseña debe contener al menos un símbolo especial.']
  ];

  cases.forEach(([pwd, msg]) => {
    test(`Falla con ${pwd}`, () => {
      const result = validatePassword(pwd);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain(msg);
    });
  });

  test('Retorna múltiples fallos', () => {
    const result = validatePassword('123');
    expect(result.isValid).toBe(false);
    expect(result.message).toHaveLength(4);
  });

  test('Admite contraseña válida', () => {
    const result = validatePassword('P@ss1234');
    expect(result.isValid).toBe(true);
    expect(result.message).toBeNull();
  });
});

