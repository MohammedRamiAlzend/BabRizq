// Domain model for User entity
export type UserRole = 'admin' | 'store_owner' | 'marketer' | 'back_office' | 'delivery' | 'customer';

export interface User {
  id: string;
  name: string;
  nameAr: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Business logic for User
export class UserEntity {
  constructor(private user: User) {}

  isAdmin(): boolean {
    return this.user.role === 'admin';
  }

  isStoreOwner(): boolean {
    return this.user.role === 'store_owner';
  }

  canManageStore(storeId: string): boolean {
    // Business rule: store owners can only manage their own store
    return this.isStoreOwner() && this.user.id === storeId; // Simplified
  }

  updateProfile(updates: Partial<Pick<User, 'name' | 'nameAr' | 'phone'>>): User {
    return {
      ...this.user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  }
}

// Validation
export function validateUser(user: Partial<User>): string[] {
  const errors: string[] = [];
  if (!user.name) errors.push('Name is required');
  if (!user.email) errors.push('Email is required');
  if (!user.role) errors.push('Role is required');
  // Add more validations
  return errors;
}