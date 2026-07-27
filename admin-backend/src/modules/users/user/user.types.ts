// src/modules/users/user/user.types.ts

export interface UserListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'suspended';
  isLocked?: boolean;
  sortBy?: 'createdAt' | 'name' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateUserStatusInput {
  status: 'active' | 'inactive' | 'suspended';
}

export interface LockUserInput {
  reason?: string;
}

export const USER_SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  mobile: true,
  cityId: true,
  city: { select: { id: true, name: true } },
  isVerified: true,
  status: true,
  failedLoginAttempts: true,
  isLocked: true,
  lockedAt: true,
  lockedReason: true,
  lastLoginAt: true,
  lastLoginIp: true,
  createdAt: true,
} as const;
