import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { getUserById } from '../../services/userService';
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  Layers,
  Calendar,
  Hash,
  FileText,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

const StudentDetails = () => {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchStudent = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getUserById(studentId);
        if (isMounted) {
          setStudent(data.user);
        }
      } catch (err) {
        if (isMounted) {
          const status = err.response?.status;
          if (status === 403) {
            setError('Access Denied: You are only authorized to view student candidate profiles.');
          } else if (status === 404) {
            setError('Student not found. The candidate account may have been removed or does not exist.');
          } else {
            setError(err.response?.data?.message || 'Failed to retrieve student profile records.');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (studentId) {
      fetchStudent();
    }

    return () => {
      isMounted = false;
    };
  }, [studentId]);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title={student ? student.name : 'Student Profile'}
          subtitle="Read-only institutional academic and candidate enrollment record."
          backTo="/teacher/students"
          backLabel="Back to Students"
          badge="Candidate Profile"
        />

        {loading ? (
          <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-16 shadow-xs">
            <LoadingSpinner label="Loading student information..." />
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-[#112019] border border-rose-200 dark:border-rose-950/80 rounded-2xl p-8 shadow-xs space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">Unable to View Student Profile</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">{error}</p>
            </div>
            <div className="pt-2">
              <Link
                to="/teacher/students"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-stone-100 dark:bg-emerald-950/60 hover:bg-stone-200 dark:hover:bg-emerald-900/40 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-emerald-800 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Student Directory</span>
              </Link>
            </div>
          </div>
        ) : !student ? (
          <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-12 shadow-xs">
            <EmptyState
              icon={User}
              title="Student Not Found"
              description="The requested student profile could not be located in the institution directory."
              actionLabel="Back to Student Directory"
              actionLink="/teacher/students"
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Identity Overview Card */}
            <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-center gap-6">
              <div className="relative shrink-0">
                {student.profilePicture ? (
                  <img
                    src={student.profilePicture}
                    alt={student.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-sm"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null}
                {!student.profilePicture && (
                  <div className="w-20 h-20 rounded-2xl border border-amber-300/40 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 text-amber-200 flex items-center justify-center text-3xl font-bold shadow-sm">
                    {student.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 truncate">{student.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800 uppercase tracking-wider">
                    Student Candidate
                  </span>
                  {(student.studentId || student.rollNumber) && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-stone-100 text-stone-800 border border-stone-300 dark:bg-stone-800 dark:text-stone-200 dark:border-stone-700">
                      ID: {student.studentId || student.rollNumber}
                    </span>
                  )}
                </div>
                <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm font-mono">{student.email}</p>

                <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-1.5 text-xs text-stone-500 dark:text-stone-400 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Enrolled {new Date(student.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Candidate
                  </span>
                  {student.yearOfStudy && (
                    <>
                      <span>&bull;</span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 text-[11px] font-semibold">
                        {student.yearOfStudy}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Read-Only Details Section 1: Account Information */}
            <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="border-b border-stone-100 dark:border-emerald-950 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-emerald-400 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Account Information
                  </h3>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                    Identity credentials and communication channels
                  </p>
                </div>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                  Read Only
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Full Name */}
                <div className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-[#0c1813] border border-stone-200/80 dark:border-emerald-950 space-y-1">
                  <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Full Candidate Name
                  </span>
                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100">{student.name}</p>
                </div>

                {/* Email Address */}
                <div className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-[#0c1813] border border-stone-200/80 dark:border-emerald-950 space-y-1">
                  <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Email Address
                  </span>
                  <p className="text-xs font-mono font-medium text-stone-900 dark:text-stone-100">{student.email}</p>
                </div>

                {/* Phone Contact */}
                <div className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-[#0c1813] border border-stone-200/80 dark:border-emerald-950 space-y-1">
                  <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Phone Contact
                  </span>
                  <p className="text-xs font-medium text-stone-900 dark:text-stone-100">
                    {student.phone || <span className="text-stone-400 italic">Not provided</span>}
                  </p>
                </div>

                {/* System Role */}
                <div className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-[#0c1813] border border-stone-200/80 dark:border-emerald-950 space-y-1">
                  <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Institutional Role
                  </span>
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-mono">
                    {student.role || 'STUDENT'}
                  </p>
                </div>
              </div>
            </div>

            {/* Read-Only Details Section 2: Academic Information */}
            <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="border-b border-stone-100 dark:border-emerald-950 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-emerald-400 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Academic Information
                  </h3>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                    Curriculum enrollment, roll assignment, and department details
                  </p>
                </div>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                  Read Only
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Student ID / Roll Number */}
                <div className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-[#0c1813] border border-stone-200/80 dark:border-emerald-950 space-y-1">
                  <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Student ID / Roll Number
                  </span>
                  <p className="text-xs font-mono font-bold text-stone-900 dark:text-stone-100">
                    {student.studentId || student.rollNumber || (
                      <span className="text-stone-400 font-sans font-normal italic">Not recorded</span>
                    )}
                  </p>
                </div>

                {/* Department */}
                <div className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-[#0c1813] border border-stone-200/80 dark:border-emerald-950 space-y-1">
                  <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Academic Department
                  </span>
                  <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                    {student.department || <span className="text-stone-400 font-normal italic">Unassigned</span>}
                  </p>
                </div>

                {/* Section */}
                <div className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-[#0c1813] border border-stone-200/80 dark:border-emerald-950 space-y-1">
                  <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Section / Batch
                  </span>
                  <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                    {student.section || <span className="text-stone-400 font-normal italic">Not specified</span>}
                  </p>
                </div>

                {/* Year of Study */}
                <div className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-[#0c1813] border border-stone-200/80 dark:border-emerald-950 space-y-1">
                  <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Current Year of Study
                  </span>
                  <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                    {student.yearOfStudy ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 text-[11px] font-bold">
                        {student.yearOfStudy}
                      </span>
                    ) : (
                      <span className="text-stone-400 font-normal italic">Not specified</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Read-Only Details Section 3: Additional Notes / Bio */}
            <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="border-b border-stone-100 dark:border-emerald-950 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-emerald-400 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Candidate Bio & Academic Notes
                  </h3>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                    Candidate self-summary, academic focus, or profile comments
                  </p>
                </div>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                  Read Only
                </span>
              </div>

              <div className="p-4 rounded-xl bg-stone-50/70 dark:bg-[#0c1813] border border-stone-200/80 dark:border-emerald-950">
                {student.bio ? (
                  <p className="text-xs text-stone-700 dark:text-stone-300 whitespace-pre-wrap leading-relaxed">
                    {student.bio}
                  </p>
                ) : (
                  <p className="text-xs text-stone-400 italic">No academic notes or bio provided by this candidate.</p>
                )}
              </div>
            </div>

            {/* Back action */}
            <div className="pt-2 flex justify-start">
              <Link
                to="/teacher/students"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-[#112019] hover:bg-stone-100 dark:hover:bg-emerald-950/60 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-emerald-900/60 shadow-2xs transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-stone-500" />
                <span>Back to Enrolled Students</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentDetails;
