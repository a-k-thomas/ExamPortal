import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getUsers } from '../../services/userService';
import {
  Users,
  Search,
  RefreshCw,
  Mail,
  Calendar,
  UserCheck,
} from 'lucide-react';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getUsers({ role: 'student', search });
      setStudents(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Enrolled Student Directory"
          subtitle="Browse candidates enrolled in your department examinations with search and contact records."
          backTo="/teacher/dashboard"
          backLabel="Back to Dashboard"
          actions={
            <button
              onClick={fetchStudents}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#112019] hover:bg-stone-100 dark:hover:bg-emerald-950/40 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-emerald-950/80 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : 'text-stone-500'}`} />
              <span>Refresh Roster</span>
            </button>
          }
        />

        {/* Search & Filter Toolbar */}
        <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400 dark:text-stone-500" />
            <input
              type="text"
              placeholder="Search by student name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-stone-50 dark:bg-[#0c1813] border border-stone-300 dark:border-emerald-900/60 rounded-xl pl-10 pr-4 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
            />
          </div>

          <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">
            Total Enrolled Students: <strong className="text-stone-900 dark:text-stone-100">{total}</strong>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-stone-200 dark:border-emerald-950/80">
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm tracking-tight">
              Candidate Roster
            </h3>
          </div>

          {loading ? (
            <div className="p-12">
              <LoadingSpinner label="Querying candidate enrollment records..." />
            </div>
          ) : error ? (
            <div className="p-12 text-center text-rose-600 dark:text-rose-400 text-sm">{error}</div>
          ) : students.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Students Found"
              description="No registered students match your current search query."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-[#0c1813] border-b border-stone-200 dark:border-emerald-950/80 text-stone-500 dark:text-stone-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Candidate</th>
                    <th className="px-5 py-3.5">Email Contact</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5">Enrollment Status</th>
                    <th className="px-5 py-3.5">Registered Date</th>
                    <th className="px-5 py-3.5 text-right">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-emerald-950/60">
                  {students.map((student) => {
                    const studentId = student._id || student.id;
                    return (
                      <tr
                        key={studentId}
                        className="hover:bg-stone-50/80 dark:hover:bg-emerald-950/20 transition-colors"
                      >
                        <td className="px-5 py-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-xs font-bold text-emerald-800 dark:text-emerald-300 shrink-0">
                            {student.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link
                              to={`/teacher/students/${studentId}`}
                              className="font-semibold text-stone-900 dark:text-stone-100 text-sm hover:text-emerald-700 dark:hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded transition-colors cursor-pointer block"
                              title="View Academic Profile"
                            >
                              {student.name}
                            </Link>
                            {(student.studentId || student.rollNumber) && (
                              <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400 block">
                                ID: {student.studentId || student.rollNumber}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-stone-600 dark:text-stone-300 font-mono">
                          {student.email}
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 uppercase tracking-wider">
                            Student
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium text-[11px]">
                            <UserCheck className="w-3.5 h-3.5" /> Active Candidate
                          </span>
                        </td>
                        <td className="px-5 py-4 text-stone-500 dark:text-stone-400 font-mono text-[11px]">
                          {student.createdAt
                            ? new Date(student.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            to={`/teacher/students/${studentId}`}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800/80 transition-colors"
                          >
                            <span>View</span>
                            <span aria-hidden="true">&rarr;</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentList;
