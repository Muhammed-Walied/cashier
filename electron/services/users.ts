import bcrypt from 'bcryptjs';
import { queryAll, queryOne, run } from '../database/db';
import { User, ApiResponse } from '../types';

export function loginUser(username: string, password: string): ApiResponse<User> {
  try {
    const user = queryOne<User>(
      'SELECT id, username, password_hash, display_name, role, is_active, created_at FROM users WHERE username = ? AND is_active = 1',
      [username]
    );

    if (!user || !user.password_hash) {
      return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
    }

    const { password_hash, ...safeUser } = user;
    return { success: true, data: safeUser as User };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getAllUsers(): ApiResponse<User[]> {
  try {
    const users = queryAll<User>(
      'SELECT id, username, display_name, role, is_active, created_at FROM users ORDER BY id ASC'
    );
    return { success: true, data: users };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function createUser(userData: {
  username: string;
  password?: string;
  display_name: string;
  role: 'admin' | 'cashier';
}): ApiResponse<User> {
  try {
    const existing = queryOne('SELECT id FROM users WHERE username = ?', [userData.username]);
    if (existing) {
      return { success: false, error: 'اسم المستخدم موجود بالفعل' };
    }

    const hash = bcrypt.hashSync(userData.password || '123456', 10);
    const result = run(
      'INSERT INTO users (username, password_hash, display_name, role, is_active) VALUES (?, ?, ?, ?, 1)',
      [userData.username, hash, userData.display_name, userData.role]
    );

    const newUser = queryOne<User>(
      'SELECT id, username, display_name, role, is_active, created_at FROM users WHERE id = ?',
      [result.lastInsertRowid]
    );

    return { success: true, data: newUser! };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function updateUser(
  id: number,
  userData: {
    display_name?: string;
    role?: 'admin' | 'cashier';
    is_active?: number;
    password?: string;
  }
): ApiResponse<boolean> {
  try {
    if (userData.password && userData.password.trim() !== '') {
      const hash = bcrypt.hashSync(userData.password, 10);
      run('UPDATE users SET password_hash = ? WHERE id = ?', [hash, id]);
    }

    if (userData.display_name !== undefined) {
      run('UPDATE users SET display_name = ? WHERE id = ?', [userData.display_name, id]);
    }

    if (userData.role !== undefined) {
      run('UPDATE users SET role = ? WHERE id = ?', [userData.role, id]);
    }

    if (userData.is_active !== undefined) {
      run('UPDATE users SET is_active = ? WHERE id = ?', [userData.is_active, id]);
    }

    return { success: true, data: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function deleteUser(id: number): ApiResponse<boolean> {
  try {
    // Prevent deleting the main admin with id 1
    if (id === 1) {
      return { success: false, error: 'لا يمكن حذف حساب المدير الرئيسي' };
    }
    run('UPDATE users SET is_active = 0 WHERE id = ?', [id]);
    return { success: true, data: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
