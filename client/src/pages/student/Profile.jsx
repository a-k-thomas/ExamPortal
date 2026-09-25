import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import { updateProfile } from '../../services/userService';
import {
  User,
  Mail,
  Phone,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Lock,
  GraduationCap,
  Building2,
  Layers,
  Briefcase,
  Hash,
  Image,
} from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    profilePicture: user?.profilePicture || '',
    // Student fields
    studentId: user?.studentId || user?.rollNumber || '',
    department: user?.department || '',
    section: user?.section || '',
    yearOfStudy: user?.yearOfStudy || '',
    // Teacher fields
    employeeId: user?.employeeId || user?.facultyId || '',
    designation: user?.designation || '',
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Keep form data synced when auth user is refreshed
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        bio: user.bio || '',
        profilePicture: user.profilePicture || '',
        studentId: user.studentId || user.rollNumber || '',
        department: user.department || '',
        section: user.section || '',
        yearOfStudy: user.yearOfStudy || '',
        employeeId: user.employeeId || user.facultyId || '',
        designation: user.designation || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        bio: formData.bio,
        profilePicture: formData.profilePicture,
      };

      if (user?.role === 'student') {
        payload.studentId = formData.studentId;
        payload.department = formData.department;
        payload.section = formData.section;
        payload.yearOfStudy = formData.yearOfStudy;
      } else if (user?.role === 'teacher') {
        payload.employeeId = formData.employeeId;
        payload.department = formData.department;
        payload.designation = formData.designation;
      }

      const res = await updateProfile(payload);
      setSuccessMsg(res.message || 'Profile updated successfully.');
      if (res.user && updateUser) {
        updateUser(res.user);
      }
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem('user', JSON.stringify({ ...parsed, ...res.user }));
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const roleBadgeStyle =
    user?.role === 'admin'
      ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700'
      : user?.role === 'teacher'
      ? 'bg-emerald-100 text-emerald-900 border-emerald-400 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-700'
      : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800';

  const roleTitle =
    user?.role === 'admin'
      ? 'System Administrator'
      : user?.role === 'teacher'
      ? 'Faculty Instructor'
      : 'Verified Candidate';

  const bioLabel =
    user?.role === 'student'
      ? 'Candidate Bio / Academic Notes'
      : 'Professional Bio / Department Notes';

  const bioPlaceholder =
    user?.role === 'student'
      ? 'Major, degree program, academic interests, or examination focus...'
      : 'Department, academic specialization, research areas, or instructor credentials...';

  const avatarGradient =
    user?.role === 'admin'
      ? 'bg-gradient-to-br from-amber-600 via-amber-700 to-stone-900 text-amber-200 border-amber-400/40'
      : 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 text-amber-200 border-amber-300/40';

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Account Profile"
          subtitle="Manage your personal identity, credentials, and academic/faculty records."
          backTo={`/${user?.role || 'student'}/dashboard`}
          backLabel="Back to Dashboard"
        />

        {/* Feedback alerts */}
        {successMsg && (
          <div className="flex items-center gap-2.5 p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2.5 p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 rounded-xl text-rose-800 dark:text-rose-200 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Identity Overview Card */}
        <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-center gap-6">
          <div className="relative shrink-0">
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-sm"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
            {!user?.profilePicture && (
              <div className={`w-20 h-20 rounded-2xl border flex items-center justify-center text-3xl font-bold shadow-sm ${avatarGradient}`}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 truncate">{user?.name}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleBadgeStyle}`}>
                {user?.role?.toUpperCase()}
              </span>
            </div>
            <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm">{user?.email}</p>

            <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-1.5 text-xs text-stone-500 dark:text-stone-400 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Joined {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> {roleTitle}
              </span>

              {/* Student quick tags */}
              {user?.role === 'student' && user?.studentId && (
                <>
                  <span>&bull;</span>
                  <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-mono text-[11px]">
                    ID: {user.studentId}
                  </span>
                </>
              )}
              {user?.role === 'student' && user?.department && (
                <>
                  <span>&bull;</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium truncate max-w-[200px]">
                    {user.department}
                  </span>
                </>
              )}
              {user?.role === 'student' && user?.yearOfStudy && (
                <>
                  <span>&bull;</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 text-[11px] font-semibold">
                    {user.yearOfStudy}
                  </span>
                </>
              )}

              {/* Teacher quick tags */}
              {user?.role === 'teacher' && user?.designation && (
                <>
                  <span>&bull;</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 text-[11px] font-semibold">
                    {user.designation}
                  </span>
                </>
              )}
              {user?.role === 'teacher' && user?.department && (
                <>
                  <span>&bull;</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium truncate max-w-[200px]">
                    {user.department}
                  </span>
                </>
              )}
              {user?.role === 'teacher' && user?.employeeId && (
                <>
                  <span>&bull;</span>
                  <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-mono text-[11px]">
                    FAC ID: {user.employeeId}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profile Update Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: ACCOUNT INFORMATION */}
          <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="border-b border-stone-100 dark:border-emerald-950 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-emerald-400 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Account Information
              </h3>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                Core identity and security credentials
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-stone-50 dark:bg-[#0c1813] border border-stone-300 dark:border-emerald-900/60 rounded-xl px-4 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email (Read Only) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-stone-400" /> Email Address (Immutable)
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-stone-100 dark:bg-[#08120d] border border-stone-200 dark:border-emerald-950 rounded-xl px-4 py-2.5 text-xs text-stone-400 dark:text-stone-500 cursor-not-allowed"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Contact Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-stone-50 dark:bg-[#0c1813] border border-stone-300 dark:border-emerald-900/60 rounded-xl px-4 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
                  placeholder="e.g. +1 555-0199"
                />
              </div>

              {/* Account Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-stone-400" /> Assigned System Role (Immutable)
                </label>
                <input
                  type="text"
                  value={user?.role?.toUpperCase() || ''}
                  disabled
                  className="w-full bg-stone-100 dark:bg-[#08120d] border border-stone-200 dark:border-emerald-950 rounded-xl px-4 py-2.5 text-xs text-stone-400 dark:text-stone-500 cursor-not-allowed font-mono"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2A: STUDENT ACADEMIC INFORMATION */}
          {user?.role === 'student' && (
            <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="border-b border-stone-100 dark:border-emerald-950 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-emerald-400 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Academic Information
                </h3>
                <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                  Institutional enrollment and student curriculum details
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Student ID / Roll Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Student ID / Roll Number
                  </label>
                  <input
                    type="text"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    className="w-full bg-stone-50 dark:bg-[#0c1813] border border-stone-300 dark:border-emerald-900/60 rounded-xl px-4 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
                    placeholder="e.g. STU-2026-042 or 22CS01"
                  />
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Academic Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full bg-stone-50 dark:bg-[#0c1813] border border-stone-300 dark:border-emerald-900/60 rounded-xl px-4 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
                    placeholder="e.g. Computer Science & Engineering"
                  />
                </div>

                {/* Section */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Class Section
                  </label>
                  <input
                    type="text"
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    className="w-full bg-stone-50 dark:bg-[#0c1813] border border-stone-300 dark:border-emerald-900/60 rounded-xl px-4 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
                    placeholder="e.g. Section A, Batch 2"
                  />
                </div>

                {/* Year of Study */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Year of Study
                  </label>
                  <select
                    name="yearOfStudy"
                    value={formData.yearOfStudy}
                    onChange={handleChange}
                    className="w-full bg-stone-50 dark:bg-[#0c1813] border border-stone-300 dark:border-emerald-900/60 rounded-xl px-4 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
                  >
                    <option value="" className="bg-white dark:bg-stone-900 text-stone-500">Select Year of Study</option>
                    <option value="1st Year" className="bg-white dark:bg-stone-900">1st Year</option>
                    <option value="2nd Year" className="bg-white dark:bg-stone-900">2nd Year</option>
                    <option value="3rd Year" className="bg-white dark:bg-stone-900">3rd Year</option>
                    <option value="4th Year" className="bg-white dark:bg-stone-900">4th Year</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2B: TEACHER FACULTY INFORMATION */}
          {user?.role === 'teacher' && (
            <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="border-b border-stone-100 dark:border-emerald-950 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-emerald-400 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Faculty Information
                </h3>
                <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                  Academic department assignment and faculty appointment
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Employee ID / Faculty ID */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Employee ID / Faculty ID
                  </label>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    className="w-full bg-stone-50 dark:bg-[#0c1813] border border-stone-300 dark:border-emerald-900/60 rounded-xl px-4 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
                    placeholder="e.g. FAC-2024-101"
                  />
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Faculty Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full bg-stone-50 dark:bg-[#0c1813] border border-stone-300 dark:border-emerald-900/60 rounded-xl px-4 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
                    placeholder="e.g. Computer Science & Engineering"
                  />
                </div>

                {/* Designation */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Academic Designation
                  </label>
                  <select
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className="w-full bg-stone-50 dark:bg-[#0c1813] border border-stone-300 dark:border-emerald-900/60 rounded-xl px-4 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
                  >
                    <option value="" className="bg-white dark:bg-stone-900 text-stone-500">Select Academic Designation</option>
                    <option value="Professor" className="bg-white dark:bg-stone-900">Professor</option>
                    <option value="Associate Professor" className="bg-white dark:bg-stone-900">Associate Professor</option>
                    <option value="Assistant Professor" className="bg-white dark:bg-stone-900">Assistant Professor</option>
                    <option value="Lecturer" className="bg-white dark:bg-stone-900">Lecturer</option>
                    <option value="Faculty" className="bg-white dark:bg-stone-900">Faculty</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: ADDITIONAL INFORMATION */}
          <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="border-b border-stone-100 dark:border-emerald-950 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-emerald-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Additional Information
              </h3>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                Biographical summary and optional avatar image
              </p>
            </div>

            <div className="space-y-4">
              {/* Profile Picture URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Profile Picture URL (Optional)
                </label>
                <input
                  type="url"
                  name="profilePicture"
                  value={formData.profilePicture}
                  onChange={handleChange}
                  className="w-full bg-stone-50 dark:bg-[#0c1813] border border-stone-300 dark:border-emerald-900/60 rounded-xl px-4 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              {/* Bio / Academic Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {bioLabel}
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-stone-50 dark:bg-[#0c1813] border border-stone-300 dark:border-emerald-900/60 rounded-xl p-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
                  placeholder={bioPlaceholder}
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
