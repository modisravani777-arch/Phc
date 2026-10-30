import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Phone, KeyRound, Mail, LockKeyhole, AlertCircle, Shield, HeartPulse, Building2, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { FacilityRole } from '../types';

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
          setErrorMsg('Enter your mobile number');
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
    } catch (err: any) {
      const msg = err?.message || 'Unable to sign in. Please verify your credentials and facility role.';
      setErrorMsg(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc] font-sans selection:bg-blue-500/20">
      {/* Left Modern Healthcare Branding Panel */}
      <div className="hidden lg:flex lg:w-[46%] relative bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-12 flex-col justify-between overflow-hidden border-r border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3.5 mb-14">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-blue-500/30 font-black text-2xl">
              ✚
            </div>
            <div>
              <div className="text-2xl font-extrabold tracking-tight text-white leading-tight">
                ArogyaSathi
              </div>
              <div className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">
                Primary Healthcare Platform
              </div>
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-4 text-white">
            Transforming rural health with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400">
              real-time synchronization.
            </span>
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed max-w-md">
            Directly connected to PostgreSQL, tracking 2,234 catchment citizens across 6 villages, maternal ANC registers, child immunization, and emergency 108 triage.
          </p>
        </div>

        <div className="relative z-10 space-y-3.5">
          {[
            { icon: Building2, label: 'Two-Tier Health Architecture', desc: 'Seamless linkage between PHCs and rural Sub-Centres' },
            { icon: HeartPulse, label: 'Comprehensive Clinical Registers', desc: 'RMNCH+A maternal care, UIP vaccines, and NCD surveillance' },
            { icon: Shield, label: 'Session & Role Protection', desc: 'Secure facility-level access for doctors, ANMs, and supervisors' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">{item.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Login Form */}
      <div className="relative flex flex-1 flex-col items-center justify-center p-5 sm:p-10">
        <div className="relative z-10 w-full max-w-[450px] animate-fade-in-up">
          {/* Back to Homepage Link */}
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition-colors hover:text-blue-600"
          >
            <ArrowLeft className="w-4 h-4" /> Back to public portal
          </Link>

          {/* Form Card */}
          <div className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-7 sm:p-9 shadow-xl">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-400 flex items-center justify-center text-white shadow-md font-black text-xl">
                ✚
              </div>
              <div>
                <div className="text-lg font-extrabold text-slate-900 tracking-tight">
                  ArogyaSathi
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Facility Workspace
                </div>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                Authorized Access
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mt-2 sm:text-3xl">
                Facility Sign In
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Select your facility role to access the clinical command center.
              </p>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2.5 p-3.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200/70 rounded-xl animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Facility Level Classification
                </label>
                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-1.5">
                  {([
                    ['PHC', 'Primary Health Centre (PHC)'],
                    ['SUBCENTRE', 'Sub-Centre (SC)'],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setRole(value);
                        setOtpRequested(false);
                        setOtp('');
                      }}
                      className={`rounded-xl px-3 py-2 text-xs font-extrabold transition-all ${
                        role === value
                          ? 'bg-white text-blue-600 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-1.5">
                {([
                  ['email', 'Email / Password'],
                  ['otp', 'Phone OTP'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setLoginMethod(value);
                      setErrorMsg(null);
                    }}
                    className={`rounded-xl px-3 py-2 text-xs font-extrabold transition-all ${
                      loginMethod === value
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {loginMethod === 'email' ? (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">
                      Operator Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="doctor@arogyasathi.in"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">
                      Security Password
                    </label>
                    <div className="relative">
                      <LockKeyhole className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">
                      Registered Health Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        disabled={otpRequested}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {otpRequested && (
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-700">
                        6-Digit Verification Code
                      </label>
                      <div className="relative">
                        <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          inputMode="numeric"
                          pattern="[0-9]{6}"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Enter 6-digit code"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs font-mono tracking-widest text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpRequested(false);
                          setOtp('');
                        }}
                        className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Use a different mobile number
                      </button>
                    </div>
                  )}
                </>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="mt-2 w-full rounded-xl py-3 font-extrabold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 text-xs"
              >
                {loginMethod === 'email'
                  ? 'Sign In to Workspace'
                  : otpRequested
                    ? 'Verify & Open Workspace'
                    : 'Request Verification Code'}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs font-medium text-slate-400">
            ArogyaSathi Health Platform · National Rural Health Mission
          </p>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
