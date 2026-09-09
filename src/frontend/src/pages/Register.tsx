import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/auth";
import { QualificationsInput } from "../components/QualificationsInput";
import { ExperienceInput } from "../components/ExperienceInput";
import { ThemeToggle } from "../components/ThemeToggle";
import {
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Building2,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  ChevronDown,
  Check,
  Menu,
} from "lucide-react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

const DESIGNATIONS = [
  {
    group: "Subordinate Statistical Service (SSS)",
    options: [
      "Junior Statistical Officer (JSO)",
      "Senior Statistical Officer (SSO)",
    ],
  },
  {
    group: "Indian Statistical Service (ISS)",
    options: [
      "Assistant Director (AD)",
      "Deputy Director (DD)",
      "Joint Director (JD)",
      "Director / DDG",
    ],
  },
  {
    group: "State Statistical Cadre (DES)",
    options: [
      "Statistical Assistant / Investigator",
      "Research Officer (State DES)",
      "Joint Director (State DES)",
    ],
  },
  { group: "Other Cadres", options: ["Other"] },
];

const DEPARTMENTS = [
  "National Accounts Division (NAD)",
  "Survey Design and Research Division (SDRD)",
  "Field Operations Division (FOD)",
  "Data Quality Assurance Division (DQAD)",
  "Economic Statistics Division (ESD)",
  "Price Statistics Division (PSD)",
  "Social Statistics Division (SSD)",
  "Coordination and Publication Division (CAP)",
  "State Directorate of Economics and Statistics (DES)",
  "National Statistical Systems Training Academy (NSSTA)",
  "Other",
];

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("Male");
  const [dob, setDob] = useState("");
  const [designation, setDesignation] = useState(
    "Junior Statistical Officer (JSO)",
  );
  const [department, setDepartment] = useState(
    "National Accounts Division (NAD)",
  );
  const [customDesignation, setCustomDesignation] = useState("");
  const [customDepartment, setCustomDepartment] = useState("");

  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [isDesignationDropdownOpen, setIsDesignationDropdownOpen] =
    useState(false);
  const [isDepartmentDropdownOpen, setIsDepartmentDropdownOpen] =
    useState(false);

  const [qualifications, setQualifications] = useState<string[]>([
    "M.Sc Statistics",
    "Post Graduate Diploma in Big Data Analytics",
  ]);
  const [experience, setExperience] = useState<string[]>([
    "4 years in National Accounts Division (NAD) - Annual GDP Estimation and GVA modeling",
    "2 years in Survey Design and Research Division (SDRD) - NSS 78th Round Sample Selection",
  ]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const cleaned = username.trim().toLowerCase();
    if (!cleaned || cleaned.length < 3) {
      const id = setTimeout(() => {
        setUsernameStatus("idle");
      }, 0);
      return () => clearTimeout(id);
    }

    const timeoutId = setTimeout(async () => {
      setUsernameStatus("checking");
      try {
        const result = await authService.checkUsername(cleaned);
        if (result.exists) {
          setUsernameStatus("taken");
        } else {
          setUsernameStatus("available");
        }
      } catch {
        setUsernameStatus("idle");
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [username]);

  const isNameInvalid = submitted && !name.trim();
  const isUsernameInvalid =
    usernameStatus === "taken" ||
    (submitted && (!username.trim() || username.trim().length < 3));

  const isEmailInvalid =
    (submitted && !email.trim()) ||
    (email.trim().length > 0 && !EMAIL_REGEX.test(email.trim()));

  const cleanPhone = phone.replace(/\D/g, "");
  const isPhoneInvalid =
    (submitted && !phone.trim()) ||
    (phone.trim().length > 0 && !PHONE_REGEX.test(cleanPhone));

  const isPasswordInvalid = submitted && (!password || password.length < 6);

  const isConfirmPasswordInvalid = submitted && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError(null);

    if (!name.trim()) {
      setError("Please enter the official full name.");
      return;
    }
    if (!username.trim() || username.trim().length < 3) {
      setError(
        "Please choose a valid official username (at least 3 characters).",
      );
      return;
    }
    if (usernameStatus === "taken") {
      setError(
        "The chosen username is already assigned. Please choose another.",
      );
      return;
    }
    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      setError("Please enter a valid government / official email address.");
      return;
    }
    if (!PHONE_REGEX.test(cleanPhone)) {
      setError("Please enter a valid 10-digit mobile phone number.");
      return;
    }
    if (designation === "Other" && !customDesignation.trim()) {
      setError("Please specify your custom designation.");
      return;
    }
    if (department === "Other" && !customDepartment.trim()) {
      setError("Please specify your custom department / division.");
      return;
    }
    if (qualifications.length === 0) {
      setError("Please record at least one educational qualification.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters in length.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const finalDesignation =
      designation === "Other" ? customDesignation.trim() : designation;
    const finalDepartment =
      department === "Other" ? customDepartment.trim() : department;

    try {
      setLoading(true);
      await register({
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        phone: parseInt(cleanPhone, 10),
        gender,
        dob: dob ? `${dob}T00:00:00` : undefined,
        designation: finalDesignation,
        department: finalDepartment,
        qualifications: qualifications,
        experience: experience,
        password,
      });

      navigate("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Registration could not be completed. Please check your inputs.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-between font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <header className="bg-slate-900 text-white border-b-2 border-amber-600">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
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
              <span>Official Cadre Enrollment Portal</span>
            </div>
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <div className="sm:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center cursor-pointer transition-colors shadow-2xs btn-press"
                aria-label="Account and Navigation Menu"
                aria-expanded={isMobileMenuOpen}
                aria-haspopup="true"
                aria-controls="register-mobile-navigation"
              >
                <Menu size={16} />
              </button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <div
                id="register-mobile-navigation"
                className="absolute right-4 top-full z-50 mt-2 w-56 bg-slate-900/98 backdrop-blur-md border border-slate-700 text-white rounded-xl shadow-2xl ring-1 ring-slate-800 p-1.5 space-y-1 animate-scale-in sm:hidden"
              >
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center px-2.5 py-2 rounded-lg text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-amber-400 transition-colors"
                >
                  Home
                </Link>
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center px-2.5 py-2 rounded-lg text-xs font-bold text-amber-400 hover:bg-slate-800 transition-colors"
                >
                  Official Login
                </Link>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-scale-in">
        <div className="mb-6 pb-4 border-b border-slate-300 dark:border-slate-800 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
              National Statistical Cadre Enrolment • Form OSS-REG/01
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Official Profile & Competency Registration
            </h1>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Already registered?{" "}
            <Link
              to="/login"
              className="font-semibold text-blue-900 dark:text-amber-400 hover:underline inline-flex items-center gap-1 btn-press"
            >
              <span>Sign in to console</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-3.5 rounded text-xs font-medium mb-6 animate-slide-down">
            <AlertCircle
              size={17}
              className="text-red-600 dark:text-red-400 shrink-0 mt-0.5"
            />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-xs p-6 sm:p-8 space-y-6 card-interactive"
            noValidate
          >
            <div>
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
                <span className="text-xs font-bold font-mono text-slate-400 dark:text-slate-500">
                  01.
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Official Identification & Credentials
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Full Name (As per Service Record){" "}
                    <span className="text-red-600 dark:text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full h-9 px-3 rounded border text-xs text-slate-900 dark:text-slate-100 shadow-xs focus:outline-none transition-all duration-200 ${
                      isNameInvalid
                        ? "border-red-500 dark:border-red-500 bg-red-50/20 dark:bg-red-950/30 ring-1 ring-red-500"
                        : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-blue-700 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-700 dark:focus:ring-blue-500"
                    }`}
                    placeholder="e.g. Dr. Rajesh Kumar Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  {isNameInvalid && (
                    <span className="text-[11px] text-red-600 dark:text-red-400 block animate-slide-down">
                      Name is required.
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Cadre / Portal Username{" "}
                      <span className="text-red-600 dark:text-red-400">*</span>
                    </label>
                    <span className="text-[10px] font-mono">
                      {usernameStatus === "checking" && (
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Loader2 size={10} className="animate-spin" />{" "}
                          Verifying
                        </span>
                      )}
                      {usernameStatus === "available" && (
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-0.5 animate-badge-pop">
                          <CheckCircle2 size={11} /> Available
                        </span>
                      )}
                      {usernameStatus === "taken" && (
                        <span className="text-red-600 dark:text-red-400 font-semibold animate-shake">
                          Unavailable
                        </span>
                      )}
                    </span>
                  </div>
                  <input
                    type="text"
                    className={`w-full h-9 px-3 rounded border text-xs font-mono text-slate-900 dark:text-slate-100 shadow-xs focus:outline-none transition-all duration-200 ${
                      isUsernameInvalid
                        ? "border-red-500 dark:border-red-500 bg-red-50/20 dark:bg-red-950/30 ring-1 ring-red-500"
                        : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-blue-700 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-700 dark:focus:ring-blue-500"
                    }`}
                    placeholder="e.g. rajesh_k_iss"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  {isUsernameInvalid && (
                    <span className="text-[11px] text-red-600 dark:text-red-400 block animate-slide-down">
                      {usernameStatus === "taken"
                        ? "Username is taken. Choose another."
                        : "Minimum 3 characters required."}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Official Email (NIC / Government Domain){" "}
                    <span className="text-red-600 dark:text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    className={`w-full h-9 px-3 rounded border text-xs text-slate-900 dark:text-slate-100 shadow-xs focus:outline-none transition-all duration-200 ${
                      isEmailInvalid
                        ? "border-red-500 dark:border-red-500 bg-red-50/20 dark:bg-red-950/30 ring-1 ring-red-500"
                        : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-blue-700 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-700 dark:focus:ring-blue-500"
                    }`}
                    placeholder="e.g. rajesh.sharma@mospi.gov.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  {isEmailInvalid && (
                    <span className="text-[11px] text-red-600 dark:text-red-400 block animate-slide-down">
                      Valid official email address is required.
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Mobile Phone Number{" "}
                    <span className="text-red-600 dark:text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    className={`w-full h-9 px-3 rounded border text-xs text-slate-900 dark:text-slate-100 shadow-xs focus:outline-none transition-all duration-200 ${
                      isPhoneInvalid
                        ? "border-red-500 dark:border-red-500 bg-red-50/20 dark:bg-red-950/30 ring-1 ring-red-500"
                        : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-blue-700 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-700 dark:focus:ring-blue-500"
                    }`}
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  {isPhoneInvalid && (
                    <span className="text-[11px] text-red-600 dark:text-red-400 block animate-slide-down">
                      10-digit mobile number required.
                    </span>
                  )}
                </div>

                <div className="space-y-1 relative">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Gender
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsGenderDropdownOpen((prev) => !prev)}
                      className="w-full h-9 px-3 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 focus:border-blue-700 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-700 dark:focus:ring-blue-500 text-xs text-slate-900 dark:text-slate-100 shadow-xs flex items-center justify-between gap-2 transition-all duration-200 cursor-pointer btn-press text-left"
                      aria-expanded={isGenderDropdownOpen}
                    >
                      <span className="truncate">{gender}</span>
                      <ChevronDown
                        size={14}
                        className={`text-slate-400 dark:text-slate-400 shrink-0 transition-transform duration-200 ${
                          isGenderDropdownOpen
                            ? "rotate-180 text-blue-900 dark:text-amber-400"
                            : ""
                        }`}
                      />
                    </button>

                    {isGenderDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsGenderDropdownOpen(false)}
                        />
                        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl ring-1 ring-slate-900/10 dark:ring-white/10 p-1 space-y-0.5 animate-scale-in">
                          {["Male", "Female", "Other"].map((g) => {
                            const isSelected = gender === g;
                            return (
                              <button
                                key={g}
                                type="button"
                                onClick={() => {
                                  setGender(g);
                                  setIsGenderDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-xs text-left transition-all duration-150 cursor-pointer ${
                                  isSelected
                                    ? "bg-slate-900 dark:bg-slate-800 text-white dark:text-amber-300 font-semibold shadow-xs"
                                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                                }`}
                              >
                                <span className="truncate">{g}</span>
                                {isSelected && (
                                  <Check
                                    size={13}
                                    className="text-amber-400 shrink-0"
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    className="w-full h-9 px-3 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 shadow-xs focus:outline-none focus:border-blue-700 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-700 dark:focus:ring-blue-500 transition-colors"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
                <span className="text-xs font-bold font-mono text-slate-400 dark:text-slate-500">
                  02.
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Cadre Classification & Departmental Posting
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 relative">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Official Designation / Post{" "}
                    <span className="text-red-600 dark:text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setIsDesignationDropdownOpen((prev) => !prev)
                      }
                      className="w-full h-9 px-3 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 focus:border-blue-700 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-700 dark:focus:ring-blue-500 text-xs text-slate-900 dark:text-slate-100 shadow-xs flex items-center justify-between gap-2 transition-all duration-200 cursor-pointer btn-press text-left"
                      aria-expanded={isDesignationDropdownOpen}
                    >
                      <span className="truncate">{designation}</span>
                      <ChevronDown
                        size={14}
                        className={`text-slate-400 dark:text-slate-400 shrink-0 transition-transform duration-200 ${
                          isDesignationDropdownOpen
                            ? "rotate-180 text-blue-900 dark:text-amber-400"
                            : ""
                        }`}
                      />
                    </button>

                    {isDesignationDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsDesignationDropdownOpen(false)}
                        />
                        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl ring-1 ring-slate-900/10 dark:ring-white/10 p-1 space-y-1 max-h-64 overflow-y-auto animate-scale-in">
                          {DESIGNATIONS.map((group, gIdx) => (
                            <div key={gIdx} className="space-y-0.5">
                              <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                                {group.group}
                              </div>
                              {group.options.map((opt, oIdx) => {
                                const isSelected = designation === opt;
                                return (
                                  <button
                                    key={oIdx}
                                    type="button"
                                    onClick={() => {
                                      setDesignation(opt);
                                      setIsDesignationDropdownOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-xs text-left transition-all duration-150 cursor-pointer ${
                                      isSelected
                                        ? "bg-slate-900 dark:bg-slate-800 text-white dark:text-amber-300 font-semibold shadow-xs"
                                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                                    }`}
                                  >
                                    <span className="truncate">{opt}</span>
                                    {isSelected && (
                                      <Check
                                        size={13}
                                        className="text-amber-400 shrink-0"
                                      />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-1 relative">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Division / Wing / Directorate{" "}
                    <span className="text-red-600 dark:text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setIsDepartmentDropdownOpen((prev) => !prev)
                      }
                      className="w-full h-9 px-3 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 focus:border-blue-700 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-700 dark:focus:ring-blue-500 text-xs text-slate-900 dark:text-slate-100 shadow-xs flex items-center justify-between gap-2 transition-all duration-200 cursor-pointer btn-press text-left"
                      aria-expanded={isDepartmentDropdownOpen}
                    >
                      <span className="truncate">{department}</span>
                      <ChevronDown
                        size={14}
                        className={`text-slate-400 dark:text-slate-400 shrink-0 transition-transform duration-200 ${
                          isDepartmentDropdownOpen
                            ? "rotate-180 text-blue-900 dark:text-amber-400"
                            : ""
                        }`}
                      />
                    </button>

                    {isDepartmentDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsDepartmentDropdownOpen(false)}
                        />
                        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl ring-1 ring-slate-900/10 dark:ring-white/10 p-1 space-y-0.5 max-h-64 overflow-y-auto animate-scale-in">
                          <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                            MoSPI Divisions & State Wings
                          </div>
                          {DEPARTMENTS.map((dept, idx) => {
                            const isSelected = department === dept;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setDepartment(dept);
                                  setIsDepartmentDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-xs text-left transition-all duration-150 cursor-pointer ${
                                  isSelected
                                    ? "bg-slate-900 dark:bg-slate-800 text-white dark:text-amber-300 font-semibold shadow-xs"
                                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                                }`}
                              >
                                <span className="truncate">{dept}</span>
                                {isSelected && (
                                  <Check
                                    size={13}
                                    className="text-amber-400 shrink-0"
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {designation === "Other" && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Specify Custom Designation{" "}
                      <span className="text-red-600 dark:text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full h-9 px-3 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 shadow-xs focus:outline-none focus:border-blue-700 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-700 dark:focus:ring-blue-500 transition-colors"
                      placeholder="e.g. Senior Demographer / Consultant"
                      value={customDesignation}
                      onChange={(e) => setCustomDesignation(e.target.value)}
                    />
                  </div>
                )}

                {department === "Other" && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Specify Custom Department / Organization{" "}
                      <span className="text-red-600 dark:text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full h-9 px-3 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 shadow-xs focus:outline-none focus:border-blue-700 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-700 dark:focus:ring-blue-500 transition-colors"
                      placeholder="e.g. Planning Commission / State Statistical Bureau"
                      value={customDepartment}
                      onChange={(e) => setCustomDepartment(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
                <span className="text-xs font-bold font-mono text-slate-400 dark:text-slate-500">
                  03.
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Statistical Qualifications & Domain Service Record
                </h2>
              </div>

              <div className="space-y-4">
                <QualificationsInput
                  value={qualifications}
                  onChange={setQualifications}
                  hasError={submitted && qualifications.length === 0}
                />

                <ExperienceInput value={experience} onChange={setExperience} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
                <span className="text-xs font-bold font-mono text-slate-400 dark:text-slate-500">
                  04.
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Account Security
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Account Password{" "}
                    <span className="text-red-600 dark:text-red-400">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`w-full h-9 pl-3 pr-9 rounded border text-xs text-slate-900 dark:text-slate-100 shadow-xs focus:outline-none transition-all duration-200 ${
                        isPasswordInvalid
                          ? "border-red-500 dark:border-red-500 bg-red-50/20 dark:bg-red-950/30 ring-1 ring-red-500"
                          : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-blue-700 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-700 dark:focus:ring-blue-500"
                      }`}
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer p-1 transition-colors btn-press"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {isPasswordInvalid && (
                    <span className="text-[11px] text-red-600 dark:text-red-400 block animate-slide-down">
                      Password must be at least 6 characters.
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Confirm Password{" "}
                    <span className="text-red-600 dark:text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    className={`w-full h-9 px-3 rounded border text-xs text-slate-900 dark:text-slate-100 shadow-xs focus:outline-none transition-all duration-200 ${
                      isConfirmPasswordInvalid
                        ? "border-red-500 dark:border-red-500 bg-red-50/20 dark:bg-red-950/30 ring-1 ring-red-500"
                        : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-blue-700 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-700 dark:focus:ring-blue-500"
                    }`}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {isConfirmPasswordInvalid && (
                    <span className="text-[11px] text-red-600 dark:text-red-400 block animate-slide-down">
                      Passwords do not match.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 text-left">
                By submitting this form, you confirm that the entered service
                record and qualifications are accurate under the Official
                Statistics Code of Conduct.
              </span>
              <button
                type="submit"
                className="w-full sm:w-auto h-10 px-6 bg-blue-900 hover:bg-blue-950 dark:bg-blue-800 dark:hover:bg-blue-700 text-white rounded text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 shadow-xs shrink-0 btn-press disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={15} />
                    <span>Processing Enrollment...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Official Enrollment</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded shadow-xs overflow-hidden card-interactive">
              <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-amber-400" />
                  <span className="font-serif text-xs font-bold uppercase tracking-wider">
                    Competency Dossier Preview
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-950 border border-blue-800 text-blue-300 animate-pulse-subtle">
                  LIVE
                </span>
              </div>

              <div className="p-4 space-y-4 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase block mb-0.5">
                    Official Cadre Designation
                  </span>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {designation === "Other"
                      ? customDesignation || "Unspecified Cadre"
                      : designation}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase block mb-0.5">
                    Departmental Division
                  </span>
                  <div className="font-medium text-slate-800 dark:text-slate-200">
                    {department === "Other"
                      ? customDepartment || "Unspecified Division"
                      : department}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-left">
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 p-2 rounded transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase block">
                      Qualifications
                    </span>
                    <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                      {qualifications.length}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 p-2 rounded transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase block">
                      Service Records
                    </span>
                    <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                      {experience.length}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase block mb-1.5">
                    FRAC Competency Framework Alignment
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-[11px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 px-2 py-1.5 sm:py-1 rounded transition-colors hover:bg-blue-50/50 dark:hover:bg-slate-800">
                      <span className="text-slate-700 dark:text-slate-300">
                        Survey Sampling & Estimation
                      </span>
                      <span className="self-end sm:self-auto text-right font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                        Level 3 • Proficient
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-[11px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 px-2 py-1.5 sm:py-1 rounded transition-colors hover:bg-blue-50/50 dark:hover:bg-slate-800">
                      <span className="text-slate-700 dark:text-slate-300">
                        National Accounting (SNA 2008)
                      </span>
                      <span className="self-end sm:self-auto text-right font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                        Level 4 • Advanced
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-[11px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 px-2 py-1.5 sm:py-1 rounded transition-colors hover:bg-blue-50/50 dark:hover:bg-slate-800">
                      <span className="text-slate-700 dark:text-slate-300">
                        Price Indices (CPI / WPI)
                      </span>
                      <span className="self-end sm:self-auto text-right font-mono text-[10px] font-semibold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                        Level 2 • Intermediate
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-[11px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 px-2 py-1.5 sm:py-1 rounded transition-colors hover:bg-blue-50/50 dark:hover:bg-slate-800">
                      <span className="text-slate-700 dark:text-slate-300">
                        Data Quality & Assurance (DQAF)
                      </span>
                      <span className="self-end sm:self-auto text-right font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                        Level 3 • Proficient
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  <Layers
                    size={14}
                    className="shrink-0 text-slate-400 dark:text-slate-500 mt-0.5"
                  />
                  <span>
                    Upon completion of enrollment, AI skill intelligence maps
                    your background to iGOT Karmayogi curriculum tracks.
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-3.5 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 card-interactive">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Building2
                  size={14}
                  className="text-slate-500 dark:text-slate-400"
                />
                <span>NSSTA Cadre Support Helpdesk</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                For official assistance regarding ISS/SSS cadre seniority
                numbers or designation changes, contact the NSSTA Helpdesk at{" "}
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  support.oss@mospi.gov.in
                </span>
                .
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-[11px] py-3 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} Ministry of Statistics and Programme
            Implementation (MoSPI), Government of India.
          </span>
          <div className="flex items-center gap-4 font-mono text-[10px]">
            <span>Form Ref: OSS-REG-2026</span>
            <span>•</span>
            <span>Secured Government Network</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
