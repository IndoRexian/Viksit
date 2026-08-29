import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ThemeToggle } from "../components/ThemeToggle";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  AlertCircle,
  Loader2,
  Lock,
  Building2,
  FileCheck2,
} from "lucide-react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loginMethod, setLoginMethod] = useState<
    "username" | "email" | "phone"
  >("username");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isEmailInvalid =
    loginMethod === "email" &&
    ((identifier.length > 0 && !EMAIL_REGEX.test(identifier.trim())) ||
      (submitted && !identifier.trim()));

  const isPhoneInvalid =
    loginMethod === "phone" &&
    ((identifier.length > 0 && !PHONE_REGEX.test(identifier.trim())) ||
      (submitted && !identifier.trim()));

  const isUsernameInvalid =
    loginMethod === "username" && submitted && !identifier.trim();

  const isPasswordInvalid = submitted && (!password || password.length < 6);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError(null);

    if (!identifier.trim()) {
      setError(`Please enter your ${loginMethod}.`);
      return;
    }

    if (loginMethod === "email" && !EMAIL_REGEX.test(identifier.trim())) {
      setError("Please enter a valid official email address.");
      return;
    }

    if (loginMethod === "phone" && !PHONE_REGEX.test(identifier.trim())) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!password) {
      setError("Please enter your account password.");
      return;
    }

    try {
      setLoading(true);
      const payload: {
        username?: string;
        email?: string;
        phone?: number;
        password: string;
      } = {
        password,
      };

      if (loginMethod === "username") {
        payload.username = identifier.trim();
      } else if (loginMethod === "email") {
        payload.email = identifier.trim();
      } else if (loginMethod === "phone") {
        payload.phone = parseInt(identifier.trim(), 10);
      }

      await login(payload);
      navigate("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Authentication failed. Please verify your official credentials.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getIdentifierError = () => {
    if (loginMethod === "email") {
      if (submitted && !identifier.trim())
        return "Official email address is required.";
      if (identifier.length > 0 && !EMAIL_REGEX.test(identifier.trim()))
        return "Please enter a valid official email (e.g. officer@nic.in / @mospi.gov.in).";
    } else if (loginMethod === "phone") {
      if (submitted && !identifier.trim())
        return "Registered mobile number is required.";
      if (identifier.length > 0 && !PHONE_REGEX.test(identifier.trim()))
        return "Enter a valid 10-digit Indian mobile number.";
    } else if (loginMethod === "username") {
      if (submitted && !identifier.trim()) return "Cadre username is required.";
    }
    return null;
  };

  const identifierError = getIdentifierError();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-between font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <header className="bg-slate-900 text-white border-b-2 border-amber-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/favicon.svg"
              alt="National Emblem"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain shrink-0"
            />
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-amber-400">
                Government of India • भारत सरकार
              </span>
              <span className="text-xs sm:text-sm font-medium text-slate-200">
                Ministry of Statistics & Programme Implementation (MoSPI)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
            <div className="hidden sm:flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>iGOT Karmayogi Federated Portal</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6 animate-scale-in">
        <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-sm rounded-none sm:rounded-md grid grid-cols-1 md:grid-cols-12 overflow-hidden card-interactive">
          <div className="md:col-span-5 bg-slate-900 text-white p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
            <div>
              <div className="inline-block px-2 py-0.5 bg-blue-950 border border-blue-800 text-[11px] font-mono text-blue-300 uppercase tracking-wide mb-4">
                Official Gateway
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight mb-2">
                Samarth Sankhyiki
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 font-normal">
                Skill Intelligence & Adaptive Capacity Building Platform for
                India's Official Statistical System.
              </p>

              <div className="space-y-3.5 pt-4 border-t border-slate-800">
                <div className="flex items-start gap-2.5 group">
                  <Building2
                    size={16}
                    className="text-amber-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-200 block">
                      Cadre Harmonization
                    </span>
                    <span className="text-slate-400">
                      Integrated competency mapping for ISS, SSS, and State DES
                      officials.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 group">
                  <FileCheck2
                    size={16}
                    className="text-emerald-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-200 block">
                      FRAC Alignment
                    </span>
                    <span className="text-slate-400">
                      Direct integration with National Standards and iGOT
                      Karmayogi roles.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 group">
                  <Shield
                    size={16}
                    className="text-blue-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-200 block">
                      National Statistical Cadre
                    </span>
                    <span className="text-slate-400">
                      Official evaluation for NAD, SDRD, FOD, DQAD, and Price
                      Statistics.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
              National Statistical Systems Training Academy (NSSTA)
            </div>
          </div>

          <div className="md:col-span-7 p-6 sm:p-8 bg-white dark:bg-slate-900 flex flex-col justify-between">
            <div>
              <div className="mb-6">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">
                  Official Sign In
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Authenticate using your registered government credentials or
                  cadre identifier.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-3 rounded text-xs font-medium mb-5 animate-slide-down">
                  <AlertCircle
                    size={16}
                    className="text-red-600 dark:text-red-400 shrink-0 mt-0.5"
                  />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5">
                    Authentication Identifier
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700 rounded">
                    <button
                      type="button"
                      className={`py-1.5 text-xs font-medium rounded transition-all duration-200 cursor-pointer btn-press ${
                        loginMethod === "username"
                          ? "bg-white dark:bg-slate-700 text-blue-900 dark:text-amber-400 font-semibold shadow-xs border border-slate-300 dark:border-slate-600"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                      onClick={() => {
                        setLoginMethod("username");
                        setIdentifier("");
                        setError(null);
                      }}
                    >
                      Username
                    </button>
                    <button
                      type="button"
                      className={`py-1.5 text-xs font-medium rounded transition-all duration-200 cursor-pointer btn-press ${
                        loginMethod === "email"
                          ? "bg-white dark:bg-slate-700 text-blue-900 dark:text-amber-400 font-semibold shadow-xs border border-slate-300 dark:border-slate-600"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                      onClick={() => {
                        setLoginMethod("email");
                        setIdentifier("");
                        setError(null);
                      }}
                    >
                      Official Email
                    </button>
                    <button
                      type="button"
                      className={`py-1.5 text-xs font-medium rounded transition-all duration-200 cursor-pointer btn-press ${
                        loginMethod === "phone"
                          ? "bg-white dark:bg-slate-700 text-blue-900 dark:text-amber-400 font-semibold shadow-xs border border-slate-300 dark:border-slate-600"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                      onClick={() => {
                        setLoginMethod("phone");
                        setIdentifier("");
                        setError(null);
                      }}
                    >
                      Mobile
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {loginMethod === "username" &&
                      "Official Username / Cadre ID"}
                    {loginMethod === "email" &&
                      "Government / NIC Email Address"}
                    {loginMethod === "phone" &&
                      "Registered 10-Digit Mobile Number"}
                    <span className="text-red-600 ml-0.5">*</span>
                  </label>
                  <input
                    type={
                      loginMethod === "phone"
                        ? "tel"
                        : loginMethod === "email"
                          ? "email"
                          : "text"
                    }
                    className={`w-full h-10 px-3 rounded border text-xs text-slate-900 dark:text-slate-100 shadow-xs transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none ${
                      isEmailInvalid || isPhoneInvalid || isUsernameInvalid
                        ? "border-red-500 dark:border-red-500 bg-red-50/20 dark:bg-red-950/30 ring-1 ring-red-500"
                        : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-blue-700 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-700 dark:focus:ring-blue-500"
                    }`}
                    placeholder={
                      loginMethod === "username"
                        ? "e.g. officer_rajesh"
                        : loginMethod === "email"
                          ? "e.g. rajesh.kumar@mospi.gov.in"
                          : "e.g. 9876543210"
                    }
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete="username"
                  />
                  {identifierError && (
                    <span className="block text-[11px] text-red-600 dark:text-red-400 font-medium mt-0.5 animate-slide-down">
                      {identifierError}
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-left">
                  <div className="flex justify-between items-baseline">
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Password <span className="text-red-600">*</span>
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Minimum 6 characters
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`w-full h-10 pl-3 pr-9 rounded border text-xs text-slate-900 dark:text-slate-100 shadow-xs transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none ${
                        isPasswordInvalid
                          ? "border-red-500 dark:border-red-500 bg-red-50/20 dark:bg-red-950/30 ring-1 ring-red-500"
                          : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-blue-700 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-700 dark:focus:ring-blue-500"
                      }`}
                      placeholder="Enter your official account password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="absolute right-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer p-1 transition-colors btn-press"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {isPasswordInvalid && (
                    <span className="block text-[11px] text-red-600 dark:text-red-400 font-medium mt-0.5 animate-slide-down">
                      Password is required (minimum 6 characters).
                    </span>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full h-10 bg-blue-900 hover:bg-blue-950 dark:bg-blue-800 dark:hover:bg-blue-700 text-white rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 shadow-xs btn-press disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={15} />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Learning Console</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-600 dark:text-slate-400">
                New official in India's Statistical System?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-blue-900 dark:text-amber-400 hover:underline"
                >
                  Register official profile
                </Link>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2 text-[10px] text-slate-500 dark:text-slate-400">
              <Lock size={13} className="shrink-0 mt-0.5 text-slate-400" />
              <span>
                Authorized Government of India portal. Unauthorized access is
                prohibited and subject to legal action under the IT Act 2000 &
                Official Secrets Act.
              </span>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-[11px] py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} Ministry of Statistics and Programme
            Implementation (MoSPI), Government of India.
          </span>
          <div className="flex items-center gap-4 font-mono text-[10px]">
            <span>Version 2.4.0-OSS</span>
            <span>•</span>
            <span>Integrated with iGOT Karmayogi</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
