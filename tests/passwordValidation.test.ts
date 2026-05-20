import { expect, test, describe } from 'bun:test';
import { validatePassword } from '../src/lib/auth/validators';

describe('Password Validators', () => {
  test('Mínimo 8 caracteres', () => {
    const result = validatePassword('Ab1!');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('La contraseña debe contener mínimo 8 caracteres.');
  });

  test('Al menos una minúsculas', () => {
    const result = validatePassword('ABCDE123!');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('La contraseña debe contener al menos una minúscula.');
  });

  test('Al menos una mayúsculas', () => {
    const result = validatePassword('abcde123!');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('La contraseña debe contener al menos una mayúscula.');
  });

  test('Al menos un número', () => {
    const result = validatePassword('Abcdefgh!');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('La contraseña debe contener al menos un número.');
  });

  test('Al menos un símbolo', () => {
    const result = validatePassword('Abcdefgh1');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('La contraseña debe contener al menos un símbolo especial.');
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
