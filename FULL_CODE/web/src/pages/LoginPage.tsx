import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  KeyRound,
  Mail,
  LockKeyhole,
  AlertCircle,
  Shield,
  HeartPulse,
  Building2,
  Sparkles,
  ArrowRight,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { FacilityRole } from '../types';
import { getErrorMessage } from '../lib/api';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithEmail, loginWithOtp, requestOtp } = useAuth();
  const { success, error: toastError } = useToast();

  const [loginMethod, setLoginMethod] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [role, setRole] = useState<FacilityRole>('PHC');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fillDemoAccount = (demoRole: FacilityRole) => {
    setRole(demoRole);
    setLoginMethod('email');
    if (demoRole === 'PHC') {
      setEmail('demo.phc@arogyasathi.test');
      setPassword('Arogya@123');
    } else {
      setEmail('demo.subcentre@arogyasathi.test');
      setPassword('Arogya@123');
    }
    setErrorMsg(null);
    success(
      `Pre-filled ${demoRole === 'PHC' ? 'Chandrapuri PHC' : 'Chandrapuri Sub-Centre'} credentials`,
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (loginMethod === 'email') {
        await loginWithEmail(email.trim(), password, role);
        success('Signed in successfully');
        navigate('/app/dashboard');
        return;
      }

      if (!otpRequested) {
        if (!phone.trim()) {
          setErrorMsg('Enter your registered 10-digit mobile number');
          return;
        }
        await requestOtp(phone.trim(), role);
        setOtpRequested(true);
        success('Verification code generated for your facility operator.');
        return;
      }

      if (!/^\d{6}$/.test(otp)) {
        setErrorMsg('Enter the six-digit verification code');
        return;
      }
      await loginWithOtp(phone.trim(), otp, role);
      success('Signed in successfully');
      navigate('/app/dashboard');
    } catch (error: unknown) {
      const msg = getErrorMessage(
        error,
        'Unable to sign in. Please verify your credentials and facility role.',
      );
      setErrorMsg(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc] font-sans selection:bg-blue-500/20 antialiased">
      {/* Left Modern Healthcare Branding Panel */}
      <div className="hidden lg:flex lg:w-[48%] relative bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-12 flex-col justify-between overflow-hidden border-r border-slate-800/80">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-blue-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[380px] h-[380px] bg-teal-500/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3.5 mb-12">
            <img
              src="/app_icon.svg"
              alt="ArogyaSathi logo"
              className="h-12 w-12 rounded-2xl shadow-xl shadow-teal-500/30"
            />
            <div>
              <div className="text-2xl font-black tracking-tight text-white leading-tight">
                ArogyaSathi
              </div>
              <div className="text-[10px] font-extrabold tracking-widest text-blue-400 uppercase">
                Primary Healthcare Platform
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-300">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>National Rural Health Mission · Neon Cloud Backend</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight text-white">
              Connecting Frontline Doctors, ANMs, &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400">
                Field Health Teams.
              </span>
            </h2>

            <p className="text-slate-300 text-sm leading-relaxed max-w-md font-medium">
              Synchronizing 2,234 catchment citizens across 6 rural villages with verified maternal
              ANC care, cold-chain vaccines, and hospital referral escalations.
            </p>
          </div>
        </div>

        {/* 3 Interactive Highlight Cards */}
        <div className="relative z-10 space-y-3 my-8">
          {[
            {
              icon: Building2,
              label: 'Two-Tier Primary Care Network',
              desc: 'Harmonized real-time linkage between PHC doctors & Sub-Centre ANMs',
            },
            {
              icon: HeartPulse,
              label: 'Active Clinical Registries',
              desc: 'RMNCH+A maternal vitals, UIP infant vaccination, and chronic NCD surveillance',
            },
            {
              icon: Shield,
              label: 'Role-Based Security Protocol',
              desc: 'Granular facility permissions protecting verified patient health records',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl hover:bg-white/[0.07] transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-white">{item.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Fill Demo Card at Bottom */}
        <div className="relative z-10 p-4 rounded-2xl bg-white/[0.05] border border-white/[0.1] backdrop-blur-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              One-Click Demo Fill
            </span>
            <span className="text-[10px] text-slate-400">Instant test login</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('PHC')}
              className="px-3 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/30 text-white text-xs font-bold transition-all text-left flex items-center justify-between group"
            >
              <span>PHC Doctor</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount('SUBCENTRE')}
              className="px-3 py-2 rounded-xl bg-teal-600/30 hover:bg-teal-600/50 border border-teal-400/30 text-white text-xs font-bold transition-all text-left flex items-center justify-between group"
            >
              <span>Sub-Centre ANM</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="relative flex flex-1 flex-col items-center justify-center p-6 sm:p-12">
        <div className="relative z-10 w-full max-w-[460px] animate-fade-in">
          {/* Back to Homepage Link */}
          <Link
            to="/"
            className="group mb-6 inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 transition-colors hover:text-blue-600"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Public Portal</span>
          </Link>

          {/* Form Card */}
          <div className="space-y-6 rounded-3xl border border-slate-200/90 bg-white/95 p-7 sm:p-10 shadow-2xl shadow-slate-200/50 backdrop-blur-xl">
            {/* Mobile Header Branding */}
            <div className="lg:hidden flex items-center gap-3 pb-2 border-b border-slate-100">
              <img
                src="/app_icon.svg"
                alt="ArogyaSathi logo"
                className="h-10 w-10 rounded-xl shadow-md shadow-teal-500/25"
              />
              <div>
                <div className="text-lg font-black text-slate-900 tracking-tight">ArogyaSathi</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Facility Workspace
                </div>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/80">
                Authorized Clinical Gateway
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-2.5">
                Facility Sign In
              </h1>
              <p className="mt-1 text-xs text-slate-500 font-medium">
                Choose your health facility level to enter the clinical command center.
              </p>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="flex items-center gap-2.5 p-3.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl animate-shake"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Facility Level Classification Switcher */}
              <div>
                <label className="mb-2 block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  1. Facility Classification
                </label>
                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-100/70 p-1.5">
                  {(
                    [
                      ['PHC', 'Primary Health Centre (PHC)'],
                      ['SUBCENTRE', 'Sub-Centre (SC)'],
                    ] as const
                  ).map(([value, label]) => {
                    const isSelected = role === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setRole(value);
                          setOtpRequested(false);
                          setOtp('');
                        }}
                        className={`rounded-xl px-3 py-2.5 text-xs font-extrabold transition-all duration-200 ${
                          isSelected
                            ? 'bg-white text-blue-600 shadow-md shadow-slate-200/80 ring-1 ring-slate-200'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Login Method Toggle */}
              <div>
                <label className="mb-2 block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  2. Authentication Mode
                </label>
                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-100/70 p-1.5">
                  {(
                    [
                      ['email', 'Email & Password'],
                      ['otp', 'Mobile OTP'],
                    ] as const
                  ).map(([value, label]) => {
                    const isSelected = loginMethod === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setLoginMethod(value);
                          setErrorMsg(null);
                        }}
                        className={`rounded-xl px-3 py-2.5 text-xs font-extrabold transition-all duration-200 ${
                          isSelected
                            ? 'bg-white text-blue-600 shadow-md shadow-slate-200/80 ring-1 ring-slate-200'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Input Fields */}
              {loginMethod === 'email' ? (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      Operator Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        aria-invalid={Boolean(errorMsg)}
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="doctor.phc@arogyasathi.test"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/15"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      Security Password
                    </label>
                    <div className="relative">
                      <LockKeyhole className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        aria-invalid={Boolean(errorMsg)}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/15"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      Registered Health Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        aria-invalid={Boolean(errorMsg)}
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        disabled={otpRequested}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/15 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {otpRequested && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700">
                        6-Digit Security Code
                      </label>
                      <div className="relative">
                        <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          aria-invalid={Boolean(errorMsg)}
                          inputMode="numeric"
                          pattern="[0-9]{6}"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="••••••"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-4 text-center text-sm font-mono tracking-[0.4em] font-black text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/15"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpRequested(false);
                          setOtp('');
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700"
                      >
                        Change mobile number
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 py-3.5 text-xs sm:text-sm font-black text-white shadow-xl shadow-blue-600/30 transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 hover:shadow-2xl hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center gap-2">
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Stethoscope className="w-4 h-4" />
                  )}
                  <span>
                    {isLoading
                      ? 'Authenticating...'
                      : loginMethod === 'email'
                        ? 'Sign In to Clinical Workspace'
                        : otpRequested
                          ? 'Verify Code & Enter'
                          : 'Send Verification Code'}
                  </span>
                  {!isLoading && (
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  )}
                </div>
              </button>
            </form>

            {/* Quick Demo Pre-fill helper */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Test credentials:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoAccount('PHC')}
                  className="font-bold text-blue-600 hover:underline"
                >
                  Fill PHC
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => fillDemoAccount('SUBCENTRE')}
                  className="font-bold text-teal-600 hover:underline"
                >
                  Fill Sub-Centre
                </button>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs font-semibold text-slate-400">
            ArogyaSathi Healthcare Network · NRHM Security Compliant
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
