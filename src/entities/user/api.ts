// Mock API for User entity
import { User, UserRole } from './model';

// Mock data - in real app, this would be from DB
const MOCK_USERS: User[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'System Admin',
    nameAr: 'مدير النظام',
    email: 'admin@babrizq.com',
    role: 'admin',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  // Add more users...
];

// API functions
export async function getUsers(): Promise<User[]> {
  // Simulate API call
  return new Promise(resolve => setTimeout(() => resolve(MOCK_USERS), 100));
}

export async function getUserById(id: string): Promise<User | null> {
  return new Promise(resolve =>
    setTimeout(() => resolve(MOCK_USERS.find(u => u.id === id) || null), 100)
  );
}

export async function getUsersByRole(role: UserRole): Promise<User[]> {
  return new Promise(resolve =>
    setTimeout(() => resolve(MOCK_USERS.filter(u => u.role === role)), 100)
  );
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
  // Simulate update
  const user = MOCK_USERS.find(u => u.id === id);
  if (!user) throw new Error('User not found');
  Object.assign(user, updates, { updatedAt: new Date().toISOString() });
  return user;
}