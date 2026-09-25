import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import ConfirmModal from '../../components/ConfirmModal';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { getUsers, updateUserRole, deleteUser } from '../../services/userService';
import {
  Users,
  Search,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  UserCheck,
} from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    user: null,
    loading: false,
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getUsers({ role: roleFilter, search });
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load platform users.');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId, newRole) => {
    setError('');
    setSuccessMsg('');
    try {
      await updateUserRole(userId, newRole);
      setSuccessMsg('User role updated successfully.');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role.');
    }
  };

  const handleOpenDelete = (user) => {
    setDeleteModal({ isOpen: true, user, loading: false });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.user) return;
    setDeleteModal((prev) => ({ ...prev, loading: true }));
    setError('');
    setSuccessMsg('');

    try {
      await deleteUser(deleteModal.user._id || deleteModal.user.id);
      setSuccessMsg(`User ${deleteModal.user.name} removed successfully.`);
      setDeleteModal({ isOpen: false, user: null, loading: false });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="User & Role Management"
          subtitle="Administer user accounts, assign roles (Student, Teacher, Admin), and enforce security policies."
          badge="Access Control"
          actions={
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 shadow-sm transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
              <span>Refresh</span>
            </button>
          }
        />

        {/* Feedback alerts */}
        {successMsg && (
          <div className="flex items-center gap-2.5 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-medium shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2.5 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-medium shadow-sm">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400 dark:text-stone-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl pl-10 pr-4 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end text-xs">
            <span className="text-stone-500 dark:text-stone-400 font-medium">Filter by Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-1.5 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-950/30">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-sm">Platform Users Directory</h3>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">Total Users: {total}</span>
          </div>

          {loading ? (
            <div className="p-12">
              <LoadingSpinner message="Loading user directory..." />
            </div>
          ) : users.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Users}
                title="No users found"
                description="No users match the search keyword or role filter."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-stone-950/60 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">User</th>
                    <th className="px-5 py-3.5">Email Address</th>
                    <th className="px-5 py-3.5">Assigned Role</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Joined Date</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {users.map((u) => {
                    const userId = u._id || u.id;
                    const roleColor =
                      u.role === 'admin'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                        : u.role === 'teacher'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700';

                    return (
                      <tr key={userId} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition">
                        <td className="px-5 py-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-xs font-bold text-stone-700 dark:text-stone-300">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-stone-900 dark:text-stone-100">{u.name}</span>
                        </td>
                        <td className="px-5 py-4 text-stone-600 dark:text-stone-300 font-mono">
                          {u.email}
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(userId, e.target.value)}
                            className={`border rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider focus:outline-none ${roleColor}`}
                          >
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                            <UserCheck className="w-3.5 h-3.5" /> Active
                          </span>
                        </td>
                        <td className="px-5 py-4 text-stone-500 dark:text-stone-400 font-mono text-[11px]">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleOpenDelete(u)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          title="Permanently Remove User Account?"
          message={`Are you sure you want to permanently remove ${deleteModal.user?.name} (${deleteModal.user?.email})? All associated attempts, records, and access permissions will be revoked immediately. This action cannot be reversed.`}
          confirmText="Permanently Remove User"
          cancelText="Cancel"
          confirmVariant="danger"
          loading={deleteModal.loading}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteModal({ isOpen: false, user: null, loading: false })}
        />
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;
