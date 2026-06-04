import prisma from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken, TokenPayload } from '../utils/jwt';
import { UnauthorizedError, NotFoundError } from '../utils/errors';

export const authService = {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { staff: { include: { branch: true } } },
    });
    if (!user || !user.isActive) throw new UnauthorizedError('Invalid credentials');

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      staffId: user.staffId,
      branchId: user.staff.branchId,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Store hashed refresh token
    const hashedRefresh = await hashPassword(refreshToken);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefresh, lastLogin: new Date() },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        staffId: user.staffId,
        name: user.staff.name,
        branch: user.staff.branch.name,
      },
    };
  },

  async refresh(refreshTokenInput: string) {
    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken(refreshTokenInput);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { staff: true },
    });
    if (!user || !user.refreshToken) throw new UnauthorizedError('Invalid refresh token');

    const valid = await comparePassword(refreshTokenInput, user.refreshToken);
    if (!valid) throw new UnauthorizedError('Refresh token revoked');

    const newPayload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      staffId: user.staffId,
      branchId: user.staff.branchId,
    };

    const accessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);
    const hashedRefresh = await hashPassword(newRefreshToken);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefresh },
    });

    return { accessToken, refreshToken: newRefreshToken };
  },

  async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { staff: { include: { branch: true } } },
    });
    if (!user) throw new NotFoundError('User');
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
