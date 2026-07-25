import prisma from '../utils/prisma';
import { comparePassword, hashPassword } from '../utils/password';
import { signAccessToken, TokenPayload } from '../utils/jwt';
import { UnauthorizedError, NotFoundError } from '../utils/errors';

/**
 * Dummy hash so a missing user costs the same bcrypt work as a real one.
 * Without it, response time leaks which emails exist.
 */
const DUMMY_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEe.9Qm5Z0Ur4v0Vd0/8kK1Jz3xq3hQm2Iu';

export const authService = {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { staff: { include: { branch: true } } },
    });

    // Always run a compare, even on a miss — constant-ish time.
    const valid = await comparePassword(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !user.isActive || !valid) throw new UnauthorizedError('Invalid credentials');

    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      staffId: user.staffId,
      branchId: user.staff.branchId,
    };

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return {
      accessToken: signAccessToken(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        staffId: user.staffId,
        name: user.staff.name,
        branch: user.staff.branch.name,
        branchId: user.staff.branchId,
      },
    };
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { staff: { include: { branch: true } } },
    });
    if (!user || !user.isActive) throw new NotFoundError('User');
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      staffId: user.staffId,
      name: user.staff.name,
      branch: user.staff.branch.name,
      branchId: user.staff.branchId,
    };
  },
};

export { hashPassword };
