import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Trash2, X, Check, Shield, User } from 'lucide-react';
import { User as UserType } from '../../types';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'admin' | 'cashier'>('cashier');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.getUsers();
      if (res.success && res.data) {
        setUsers(res.data);
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (window.electronAPI) {
      const res = await window.electronAPI.createUser({
        username: username.trim(),
        password,
        display_name: displayName.trim(),
        role,
      });

      if (res.success) {
        setIsModalOpen(false);
        setUsername('');
        setPassword('');
        setDisplayName('');
        loadUsers();
      } else {
        setErrorMsg(res.error || 'فشل إنشاء المستخدم');
      }
    }
  };

  const handleDelete = async (u: UserType) => {
    if (u.id === 1) {
      alert('لا يمكن حذف المستخدم الرئيسي للنظام');
      return;
    }

    if (window.confirm(`هل أنت متأكد من تعطيل/حذف المستخدم "${u.display_name}"؟`)) {
      if (window.electronAPI) {
        const res = await window.electronAPI.deleteUser(u.id);
        if (res.success) {
          loadUsers();
        } else {
          alert(res.error || 'فشل حذف المستخدم');
        }
      }
    }
  };

  return (
    <div className="space-y-4 select-none">
      {/* 1. Page Header */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600/20 to-blue-600/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <span>إدارة المستخدمين والكاشيرات</span>
          </h2>
          <p className="text-xs text-[#7878a0] mt-1">
            إضافة كاشيرات، تحديد الصلاحيات، وضبط كلمات المرور
          </p>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="btn-primary text-xs !py-2.5 px-4 shadow-md">
          <Plus className="w-4 h-4" />
          <span>إضافة مستخدم جديد</span>
        </button>
      </div>

      {/* 2. Users Table */}
      <div className="pos-card overflow-hidden shadow-sm">
        <div className="table-container">
          <table className="pos-table">
            <thead>
              <tr>
                <th>الاسم الظاهر</th>
                <th>اسم الدخول (Username)</th>
                <th>نوع الصلاحية</th>
                <th>الحالة</th>
                <th>تاريخ الإنشاء</th>
                <th style={{ textAlign: 'center' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="font-bold text-white text-xs">{u.display_name}</td>
                  <td className="font-mono text-xs text-purple-300 bg-[rgba(18,16,31,0.8)] px-2 py-0.5 rounded border border-[rgba(124,58,237,0.15)] w-fit">
                    {u.username}
                  </td>
                  <td>
                    {u.role === 'admin' ? (
                      <span className="badge badge-purple text-xs font-semibold flex items-center gap-1 w-fit">
                        <Shield className="w-3.5 h-3.5" />
                        مدير عام (Admin)
                      </span>
                    ) : (
                      <span className="badge badge-teal text-xs font-semibold flex items-center gap-1 w-fit">
                        <User className="w-3.5 h-3.5" />
                        كاشير (Cashier)
                      </span>
                    )}
                  </td>
                  <td>
                    {u.is_active ? (
                      <span className="badge badge-green text-[10px]">نشط</span>
                    ) : (
                      <span className="badge badge-red text-[10px]">معطل</span>
                    )}
                  </td>
                  <td className="text-xs text-[#7878a0] font-mono">{u.created_at}</td>
                  <td style={{ textAlign: 'center' }}>
                    {u.id !== 1 && (
                      <button
                        onClick={() => handleDelete(u)}
                        title="إيقاف الحساب"
                        className="p-1.5 rounded-lg text-[#7878a0] hover:text-[#ff6b6b] hover:bg-[rgba(255,107,107,0.1)] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="modal-overlay select-none">
          <div className="modal-content !max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(124,58,237,0.12)]">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[rgba(124,58,237,0.15)] border border-[rgba(124,58,237,0.25)] flex items-center justify-center text-purple-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <span>إضافة مستخدم أو كاشير جديد</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#7878a0] hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 p-3 rounded-xl bg-[rgba(255,107,107,0.15)] border border-[rgba(255,107,107,0.3)] text-[#ff6b6b] text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreate} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#a8a8c8] block mb-1">
                  الاسم بالكامل (يظهر في الفاتورة)
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="مثال: أحمد محمود"
                  className="input-dark text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#a8a8c8] block mb-1">
                  اسم المستخدم لتسجيل الدخول (إنجليزي)
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="مثال: ahmed_pos"
                  className="input-dark text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#a8a8c8] block mb-1">كلمة المرور</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="كلمة مرور الدخول"
                  className="input-dark text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#a8a8c8] block mb-1">نوع الصلاحية</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="input-dark text-xs bg-[#1a1a2e]"
                >
                  <option value="cashier">كاشير (نقطة بيع وفواتير فقط)</option>
                  <option value="admin">مدير عام (صلاحيات كاملة للتقارير والأسعار)</option>
                </select>
              </div>

              <div className="mt-6 pt-3 border-t border-[rgba(124,58,237,0.12)] flex items-center gap-3">
                <button type="submit" className="btn-primary flex-1 !py-2.5 text-xs font-bold">
                  <Check className="w-4 h-4" />
                  <span>حفظ المستخدم</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary !py-2.5 text-xs"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
