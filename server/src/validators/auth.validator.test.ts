import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from './auth.validator.js';

describe('authentication validation', () => {
  it('accepts a secure registration request', () => {
    expect(registerSchema.safeParse({ body: { fullName: 'Amina Hassan', email: 'amina@hormuud.edu.so', password: 'HuruSecure1' } }).success).toBe(true);
  });
  it('rejects weak passwords', () => {
    expect(registerSchema.safeParse({ body: { fullName: 'Amina Hassan', email: 'amina@hormuud.edu.so', password: 'password' } }).success).toBe(false);
  });
  it('requires both login fields', () => {
    expect(loginSchema.safeParse({ body: { identifier: 'admin@hormuud.edu.so' } }).success).toBe(false);
  });
});
