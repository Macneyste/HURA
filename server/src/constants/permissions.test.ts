import { describe, expect, it } from 'vitest';
import { PERMISSIONS, ROLE_PERMISSIONS } from './permissions.js';

describe('role permissions', () => {
  it('gives a super admin every platform permission', () => expect(ROLE_PERMISSIONS.SUPER_ADMIN).toEqual(Object.values(PERMISSIONS)));
  it('does not give a student administrative access', () => expect(ROLE_PERMISSIONS.STUDENT).not.toContain(PERMISSIONS.USERS_UPDATE));
});
