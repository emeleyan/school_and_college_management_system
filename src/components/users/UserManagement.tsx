import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Role } from '../../types';
import { getAll, add, update, hashPassword } from '../../db/indexedDB';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Lock,
  Mail,
  Phone,
  Building2,
  Key,
  Eye,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const {
    currentUser,
    roles,
    institutes,
    logAudit,
    refreshContext,
    language,
    t,
    hasPermission,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'roles'>('users');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    email: '',
    mobile: '',
    roleId: 'role_teacher',
    instituteAccess: 'all',
  });

  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await getAll<User>('users');
      setUsersList(allUsers);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newUser.username.trim() || !newUser.password.trim() || !newUser.fullName.trim()) {
      setErrorMsg('Username, Full Name, and Password are required.');
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    // Check duplicate username
    if (usersList.some((u) => u.username.toLowerCase() === newUser.username.trim().toLowerCase())) {
      setErrorMsg('Username already exists. Please choose another.');
      return;
    }

    try {
      const passwordHash = await hashPassword(newUser.password);
      const userObj: User = {
        id: `usr_${newUser.username.trim().toLowerCase()}_${Date.now()}`,
        username: newUser.username.trim(),
        passwordHash,
        fullName: newUser.fullName.trim(),
        email: newUser.email.trim() || undefined,
        mobile: newUser.mobile.trim() || undefined,
        roleId: newUser.roleId,
        instituteAccess:
          newUser.instituteAccess === 'all'
            ? 'all'
            : [newUser.instituteAccess],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await add('users', userObj);
      await logAudit(
        'USER_CREATE',
        'users',
        `Created new user "${userObj.username}" with role ${userObj.roleId}`,
        userObj.id
      );

      await fetchUsers();
      await refreshContext();
      setShowAddModal(false);
      setNewUser({
        username: '',
        fullName: '',
        password: '',
        confirmPassword: '',
        email: '',
        mobile: '',
        roleId: 'role_teacher',
        instituteAccess: 'all',
      });
      setStatusMsg(`User "${userObj.username}" created successfully.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create user');
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (user.id === currentUser?.id) {
      setErrorMsg('You cannot deactivate your own logged-in account.');
      return;
    }

    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      const updated: User = {
        ...user,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      };
      await update('users', updated);
      await logAudit(
        'USER_STATUS_CHANGE',
        'users',
        `Changed status of user "${user.username}" to ${nextStatus}`,
        user.id
      );
      await fetchUsers();
      setStatusMsg(`User ${user.username} status set to ${nextStatus}.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update user status');
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.roleId === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>User Accounts &amp; Role-Based Access Control</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Offline local authentication with hashed credentials &amp; granular permissions.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setActiveSubTab('users')}
              className={`px-3 py-1.5 rounded font-semibold transition-all cursor-pointer ${
                activeSubTab === 'users'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Users ({usersList.length})
            </button>
            <button
              onClick={() => setActiveSubTab('roles')}
              className={`px-3 py-1.5 rounded font-semibold transition-all cursor-pointer ${
                activeSubTab === 'roles'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Roles &amp; Matrix ({roles.length})
            </button>
          </div>

          {hasPermission('users', 'add') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add User</span>
            </button>
          )}
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {activeSubTab === 'users' ? (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name, username, or email..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:w-60">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="all">Filter by Role (All)</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-850 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Institute Scope</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Last Login</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        No users match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const userRole = roles.find((r) => r.id === user.roleId);
                      const isSelf = user.id === currentUser?.id;

                      return (
                        <tr key={user.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition-colors">
                          <td className="px-6 py-3.5">
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{user.fullName}</span>
                              {isSelf && (
                                <span className="text-[9px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.2 rounded font-bold uppercase tracking-wide">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              @{user.username} {user.email ? `• ${user.email}` : ''}
                            </div>
                          </td>

                          <td className="px-6 py-3.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                              <ShieldCheck className="w-3 h-3 text-blue-600" />
                              <span>{userRole?.name || user.roleId}</span>
                            </span>
                          </td>

                          <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300 font-medium">
                            {user.instituteAccess === 'all'
                              ? 'Both School & College'
                              : 'Restricted Institute'}
                          </td>

                          <td className="px-6 py-3.5">
                            {user.status === 'active' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                <CheckCircle2 className="w-3 h-3" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                <XCircle className="w-3 h-3" />
                                Deactivated
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-3.5 text-slate-400 text-[11px] font-mono">
                            {user.lastLoginAt
                              ? new Date(user.lastLoginAt).toLocaleString()
                              : 'Never'}
                          </td>

                          <td className="px-6 py-3.5 text-right">
                            {!isSelf && hasPermission('users', 'edit') && (
                              <button
                                onClick={() => handleToggleStatus(user)}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                                  user.status === 'active'
                                    ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                    : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                }`}
                              >
                                {user.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ROLES & PERMISSIONS MATRIX SUBTAB */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((r) => (
              <div
                key={r.id}
                className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span>{r.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700">
                    {r.isSystem ? 'System' : 'Custom'}
                  </span>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {r.bengaliName}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {r.description}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-400">
                  Configured Modules:{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {Object.keys(r.permissions || {}).length}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>Create New User Account</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    placeholder="e.g. teacher_karim"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    placeholder="e.g. Abdul Karim"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    User Role *
                  </label>
                  <select
                    value={newUser.roleId}
                    onChange={(e) => setNewUser({ ...newUser, roleId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Institute Access
                  </label>
                  <select
                    value={newUser.instituteAccess}
                    onChange={(e) => setNewUser({ ...newUser, instituteAccess: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="all">Both School &amp; College</option>
                    {institutes.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile
                  </label>
                  <input
                    type="tel"
                    value={newUser.mobile}
                    onChange={(e) => setNewUser({ ...newUser, mobile: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
