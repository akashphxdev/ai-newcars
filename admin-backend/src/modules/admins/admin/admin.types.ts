// src/modules/admin/admin.types.ts

export interface AdminListQuery {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: number;
  status?: 'active' | 'inactive' | 'suspended';
  isLocked?: boolean;
  sortBy?: 'createdAt' | 'name' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateAdminInput {
  name: string;
  email: string;
  mobile: string;
  password: string;
  roleId: number;
  status?: 'active' | 'inactive' | 'suspended';
  accessStartDate?: string;
  accessEndDate?: string;
}

export interface UpdateAdminInput {
  name?: string;
  email?: string;
  mobile?: string;
  roleId?: number;
  status?: 'active' | 'inactive' | 'suspended';
  accessStartDate?: string;
  accessEndDate?: string;
}

export interface ChangeAdminPasswordInput {
  newPassword: string;
}

export interface LockAdminInput {
  reason?: string;
}
export const ADMIN_SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  mobile: true,
  roleId: true,
  status: true,
  accessStartDate: true,
  accessEndDate: true,
  lastLoginAt: true,
  lastLoginIp: true,
  failedLoginAttempts: true,
  isLocked: true,
  lockType: true,
  lockedBy: true,
  lockedAt: true,
  lockedReason: true,
  unlockedBy: true,
  unlockedAt: true,
  createdBy: true,
  createdAt: true,
  role: {
    select: {
      id: true,
      roleName: true,
    },
  },
  // ADDED: listing page pe "created by" dikhane ke liye
  createdByAdmin: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;