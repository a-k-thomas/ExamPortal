import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/common/ThemeToggle';
import {
  GraduationCap,
  Clock,
  CheckCircle2,
  BarChart2,
  Shield,
  ShieldCheck,
  BookOpen,
  Zap,
  Laptop,
  Users,
  Sparkles,
  ArrowRight,
  LogIn,
  UserPlus,
  Menu,
  X,
  ChevronRight,
  Award,
} from 'lucide-react';

const Home = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeWorkflowTab, setActiveWorkflowTab] = useState('student');

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#09120e] text-stone-900 dark:text-stone-100 flex flex-col selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* ─── 1. PUBLIC NAVIGATION HEADER ───────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-white/85 dark:bg-[#0c1813]/85 backdrop-blur-md border-b border-stone-200/80 dark:border-emerald-950/80 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 text-white flex items-center justify-center shadow-md shadow-emerald-900/10 group-hover:scale-105 transition-transform duration-200 border border-emerald-500/20">
              <GraduationCap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-stone-900 dark:text-stone-100 text-base sm:text-lg tracking-tight">
                  Exam<span className="text-emerald-600 dark:text-emerald-400">Portal</span>
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 dark:bg-amber-300" />
              </div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-stone-400 dark:text-emerald-400/80 hidden sm:block">
                Online Assessment System
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300">
            <a href="#" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
              Home
            </a>
            <a href="#roles" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
              For Roles
            </a>
            <a href="#features" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
              How It Works
            </a>
            <a href="#capabilities" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
              Capabilities
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <ThemeToggle size="sm" />
            <div className="h-5 w-px bg-stone-200 dark:bg-emerald-950" />
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-stone-700 dark:text-stone-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
              <span>Sign In</span>
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm shadow-emerald-900/10 transition-all cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 sm:hidden">
            <ThemeToggle size="sm" />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-emerald-950/40 rounded-lg cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-b border-stone-200 dark:border-emerald-950 bg-white dark:bg-[#0c1813] px-4 pt-3 pb-5 space-y-3">
            <nav className="flex flex-col space-y-2 text-sm font-medium text-stone-700 dark:text-stone-200">
              <a
                href="#"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-emerald-950/40"
              >
                Home
              </a>
              <a
                href="#roles"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-emerald-950/40"
              >
                For Roles
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-emerald-950/40"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-emerald-950/40"
              >
                How It Works
              </a>
              <a
                href="#capabilities"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-emerald-950/40"
              >
                Capabilities
              </a>
            </nav>
            <div className="pt-2 border-t border-stone-100 dark:border-emerald-950 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-stone-800 dark:text-stone-100 bg-stone-100 dark:bg-emerald-950/40 border border-stone-200 dark:border-emerald-900/60"
              >
                <LogIn className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Sign In to Portal</span>
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                <UserPlus className="w-4 h-4 text-amber-300" />
                <span>Create Student Account</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ─── 2. HERO SECTION ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24">
        {/* Subtle decorative background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-emerald-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headline and CTAs */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800/80 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="uppercase tracking-wider text-[11px] font-bold">Online Examination Platform</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 leading-[1.12]">
                Assess. Learn.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-emerald-600 to-amber-600 dark:from-emerald-400 dark:via-emerald-300 dark:to-amber-300">
                  Improve.
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                A modern platform for creating, conducting, and evaluating online examinations with secure assessments, instant results, and meaningful performance insights.
              </p>

              {/* Audience Pill Row */}
              <div className="flex items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-stone-500 dark:text-stone-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Students
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Educators
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Administrators
                </span>
              </div>

              {/* CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-md shadow-emerald-900/15 transition-all group"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4 text-amber-300 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-stone-700 dark:text-stone-200 bg-white dark:bg-[#112019] hover:bg-stone-50 dark:hover:bg-emerald-950/60 border border-stone-200 dark:border-emerald-900/60 shadow-xs transition-all"
                >
                  <LogIn className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Sign In to Portal</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Hero Visual (Assessment Mockup Card) */}
            <div className="lg:col-span-5 relative">
              {/* Floating Chip Top Right */}
              <div className="hidden sm:flex absolute -top-4 -right-2 z-20 items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-900/80 shadow-md text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>100% Server Authoritative</span>
              </div>

              {/* Main Assessment Mockup Card */}
              <div className="bg-white dark:bg-[#112019] border border-stone-200/90 dark:border-emerald-950/80 rounded-2xl shadow-xl p-5 sm:p-6 space-y-4 relative">
                {/* Mockup Topbar */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-emerald-950">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 dark:text-stone-100 text-xs sm:text-sm">
                        CS302: Computer Systems
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-semibold">
                        Midterm
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">Total Marks: 25 &bull; 45 Mins</p>
                  </div>

                  {/* Timer Badge */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300/80 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-mono font-bold shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                    <span>24:18 left</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-medium text-stone-500 dark:text-stone-400">
                    <span>Question 4 of 25</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">16% Completed</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-600 to-amber-400 rounded-full w-[16%]" />
                  </div>
                </div>

                {/* Sample Question Box */}
                <div className="bg-stone-50 dark:bg-[#0c1813] border border-stone-200/80 dark:border-emerald-950 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                      Single Choice &bull; 1.0 Mark
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 leading-snug">
                    Which cache mapping scheme permits any given main memory block to reside in any line in cache memory?
                  </p>

                  {/* Option Items */}
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950 text-stone-700 dark:text-stone-300">
                      <div className="w-4 h-4 rounded-full border border-stone-300 dark:border-stone-700 shrink-0" />
                      <span>Direct Mapping</span>
                    </div>

                    <div className="flex items-center gap-2.5 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/80 text-emerald-900 dark:text-emerald-200 font-medium shadow-2xs">
                      <div className="w-4 h-4 rounded-full border-4 border-emerald-600 dark:border-emerald-400 bg-amber-400 shrink-0" />
                      <span>Fully Associative Mapping</span>
                    </div>

                    <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950 text-stone-700 dark:text-stone-300">
                      <div className="w-4 h-4 rounded-full border border-stone-300 dark:border-stone-700 shrink-0" />
                      <span>Set-Associative Mapping</span>
                    </div>
                  </div>
                </div>

                {/* Mockup Action Footer */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-stone-400 dark:text-stone-500">Auto-saved 2s ago</span>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-500 cursor-not-allowed">
                      Previous
                    </span>
                    <span className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-xs">
                      Next Question
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Chip Bottom Left */}
              <div className="hidden sm:flex absolute -bottom-4 -left-3 z-20 items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-900/80 shadow-md text-xs font-semibold text-amber-800 dark:text-amber-300">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Instant Auto-Evaluation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. ROLE-BASED ENTRY ("Built for every role") ───────────────────── */}
      <section id="roles" className="py-16 bg-white dark:bg-[#0c1813] border-y border-stone-200 dark:border-emerald-950/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Built for Every Role
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              Purpose-Built Interfaces for All Campus Roles
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Dedicated portals tailored to the distinct needs of candidates, educators, and institution leadership.
            </p>
          </div>

          {/* 3 Role Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Student Card */}
            <div className="bg-stone-50/70 dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col justify-between hover:border-emerald-400 dark:hover:border-emerald-700 transition-colors group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center shadow-xs">
                  <GraduationCap className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">Students</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                    Take assessments in a secure, distraction-free environment with instant evaluation.
                  </p>
                </div>
                <ul className="space-y-2 text-xs text-stone-600 dark:text-stone-300 pt-2 border-t border-stone-200/60 dark:border-emerald-950">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Take timed online examinations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Navigate questions with live palette</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Instant evaluated results & scores</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Manage candidate academic profile</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-stone-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 shadow-xs transition"
                >
                  <span>Student Portal Login</span>
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </Link>
              </div>
            </div>

            {/* Teacher Card */}
            <div className="bg-stone-50/70 dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col justify-between hover:border-emerald-400 dark:hover:border-emerald-700 transition-colors group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center justify-center shadow-xs">
                  <Sparkles className="w-6 h-6 text-amber-700 dark:text-amber-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">Teachers</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                    Author question repositories, schedule test windows, and inspect student analytics.
                  </p>
                </div>
                <ul className="space-y-2 text-xs text-stone-600 dark:text-stone-300 pt-2 border-t border-stone-200/60 dark:border-emerald-950">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Create, edit, and publish exams</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Configure options and custom marks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Monitor candidate attempt activity</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Analyze question accuracy & pass rates</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-stone-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 shadow-xs transition"
                >
                  <span>Teacher Portal Login</span>
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </Link>
              </div>
            </div>

            {/* Administrator Card */}
            <div className="bg-stone-50/70 dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col justify-between hover:border-emerald-400 dark:hover:border-emerald-700 transition-colors group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 flex items-center justify-center shadow-xs">
                  <Shield className="w-6 h-6 text-emerald-700 dark:text-amber-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">Administrators</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                    Oversee campus-wide examination governance, user directory, and platform analytics.
                  </p>
                </div>
                <ul className="space-y-2 text-xs text-stone-600 dark:text-stone-300 pt-2 border-t border-stone-200/60 dark:border-emerald-950">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Manage user accounts & permissions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Oversee campus assessment catalog</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Access institutional analytics reports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Enforce exam integrity and policies</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-stone-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 shadow-xs transition"
                >
                  <span>Admin Portal Login</span>
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. CORE FEATURES SECTION ────────────────────────────────────── */}
      <section id="features" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              Engineered for Academic Integrity & Performance
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              A comprehensive toolset ensuring fair, transparent, and accurate testing across educational institutions.
            </p>
          </div>

          {/* 6 Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Secure Authentication & RBAC</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                JWT-secured access with strict role-based authorization for Students, Teachers, and Administrators.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Exam Authoring & Management</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Configure examination titles, instructions, durations, test windows, and custom mark weights per question.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Server-Authoritative Timing</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Backend-calculated deadlines and automatic auto-submission ensure that browser clocks cannot compromise fairness.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Instant Automated Scoring</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Immediate objective question evaluation with percentage computation while keeping correct answers strictly concealed.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                <BarChart2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Multi-Tiered Analytics Reports</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Comprehensive reporting modules across exams, individual student scores, and item-level question accuracy distributions.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                <Laptop className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Responsive Academic UX</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Optimized layouts for desktop monitors, laptops, tablets, and smartphones supporting emerald light and dark palettes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. HOW IT WORKS SECTION ───────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 bg-white dark:bg-[#0c1813] border-y border-stone-200 dark:border-emerald-950/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Workflow Guide
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              How ExamPortal Operates
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              A transparent 4-step workflow designed for rapid candidate onboarding and seamless faculty execution.
            </p>
          </div>

          {/* Role Workflow Switcher */}
          <div className="flex justify-center">
            <div className="inline-flex p-1 rounded-xl bg-stone-100 dark:bg-[#112019] border border-stone-200 dark:border-emerald-950">
              <button
                type="button"
                onClick={() => setActiveWorkflowTab('student')}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeWorkflowTab === 'student'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                Candidate Workflow
              </button>
              <button
                type="button"
                onClick={() => setActiveWorkflowTab('teacher')}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeWorkflowTab === 'teacher'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                Instructor Workflow
              </button>
            </div>
          </div>

          {/* Student Steps */}
          {activeWorkflowTab === 'student' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { step: '01', title: 'Create Account', desc: 'Register with academic details, department, section, and year of study.' },
                { step: '02', title: 'Select Exam', desc: 'Browse authorized published examinations active within the permitted test window.' },
                { step: '03', title: 'Take Assessment', desc: 'Navigate questions with real-time saving and authoritative countdown clock.' },
                { step: '04', title: 'View Results', desc: 'Receive instant evaluated scores, marks breakdown, and percentage metrics.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="bg-stone-50/70 dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-6 space-y-3 relative group hover:border-emerald-500 transition">
                  <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400/80">
                    {step}
                  </div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">{title}</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Teacher Steps */}
          {activeWorkflowTab === 'teacher' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { step: '01', title: 'Create Exam', desc: 'Define exam title, instructions, duration limit, and scheduled start/end windows.' },
                { step: '02', title: 'Add Questions', desc: 'Populate multiple-choice questions with answer choices and customized mark weights.' },
                { step: '03', title: 'Publish Test', desc: 'Transition exam from draft to published status to make it available to students.' },
                { step: '04', title: 'Analyze Results', desc: 'Access comprehensive analytics reports, candidate pass rates, and item accuracy.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="bg-stone-50/70 dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-6 space-y-3 relative group hover:border-amber-400 transition">
                  <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                    {step}
                  </div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">{title}</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── 6. PLATFORM CAPABILITIES PREVIEW ──────────────────────────────── */}
      <section id="capabilities" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Architectural Highlights
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              Built on Modern Academic Principles
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              A breakdown of the core technical tenets powering ExamPortal.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-6 space-y-2.5">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                TIMING ENGINE
              </span>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Server-Authoritative Clock</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                All deadlines are enforced by the server with grace-period logic, neutralizing local system clock tampering.
              </p>
            </div>

            <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-6 space-y-2.5">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                SCORING INTEGRITY
              </span>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Zero Answer Exposure</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Correct answers and evaluation rubrics remain strictly on the backend and are never sent to the browser during the exam.
              </p>
            </div>

            <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-6 space-y-2.5">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                ROLE SECURITY
              </span>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Granular Role Isolation</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Dedicated protected routes and API controllers restrict sensitive examination data to authorized roles only.
              </p>
            </div>

            <div className="bg-white dark:bg-[#112019] border border-stone-200 dark:border-emerald-950/80 rounded-2xl p-6 space-y-2.5">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                ACCESSIBILITY
              </span>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Academic Emerald Theme</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                High-contrast typography, accessible color ratios, and seamless toggle between daylight and midnight dark themes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. FINAL CALL TO ACTION ───────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-emerald-800 via-emerald-900 to-stone-900 text-white border border-emerald-700/60 shadow-xl text-center space-y-6">
            <div className="max-w-2xl mx-auto space-y-3 relative z-10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Get Started with ExamPortal
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Ready to Take Your Next Assessment?
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                Create your student account or sign in to experience a simpler, secure way to conduct and complete online examinations.
              </p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-stone-950 shadow-md transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Student Account</span>
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xs transition-colors"
              >
                <LogIn className="w-4 h-4 text-emerald-300" />
                <span>Sign In to Portal</span>
              </Link>
            </div>

            {/* Background blur shape */}
            <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          </div>
        </div>
      </section>

      {/* ─── 8. FOOTER ────────────────────────────────────────────────────── */}
      <footer className="mt-auto bg-white dark:bg-[#0c1813] border-t border-stone-200 dark:border-emerald-950/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Brand column */}
            <div className="md:col-span-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-amber-200 flex items-center justify-center font-bold shadow-xs border border-amber-300/30">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="font-bold text-base text-stone-900 dark:text-stone-100 tracking-tight">
                  Exam<span className="text-emerald-600 dark:text-emerald-400">Portal</span>
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm leading-relaxed">
                Online Examination & Quiz Management System. Empowering students, educators, and administrators with secure testing, automated scoring, and real-time analytics.
              </p>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-200">
                Navigation
              </h4>
              <ul className="space-y-2 text-xs text-stone-500 dark:text-stone-400">
                <li>
                  <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#roles" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    Role Directory
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    How It Works
                  </a>
                </li>
              </ul>
            </div>

            {/* Portal Access */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-200">
                Portals & Auth
              </h4>
              <ul className="space-y-2 text-xs text-stone-500 dark:text-stone-400">
                <li>
                  <Link to="/login" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    Register as Student
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    Teacher Login
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    Admin Login
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright Subfooter */}
          <div className="pt-8 border-t border-stone-100 dark:border-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400 dark:text-stone-500">
            <p>&copy; 2026 ExamPortal. Online Examination & Quiz Management System. All rights reserved.</p>
            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Academic Integrity Verified</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
