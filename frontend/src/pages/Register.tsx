import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/auth";
import { QualificationsInput } from "../components/QualificationsInput";
import { ExperienceInput } from "../components/ExperienceInput";
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
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans text-slate-900">
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
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="hidden sm:inline">
              Official Cadre Enrollment Portal
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 pb-4 border-b border-slate-300 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-slate-500 mb-1">
              National Statistical Cadre Enrolment • Form OSS-REG/01
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Official Profile & Competency Registration
            </h1>
          </div>
          <div className="text-xs text-slate-600">
            Already registered?{" "}
            <Link
              to="/login"
              className="font-semibold text-blue-900 hover:underline"
            >
              Sign in to console
            </Link>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-800 p-3.5 rounded text-xs font-medium mb-6">
            <AlertCircle size={17} className="text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-8 bg-white border border-slate-300 rounded shadow-xs p-6 sm:p-8 space-y-6"
            noValidate
          >
            <div>
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
                <span className="text-xs font-bold font-mono text-slate-400">
                  01.
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Official Identification & Credentials
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800">
                    Full Name (As per Service Record){" "}
                    <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full h-9 px-3 rounded border text-xs text-slate-900 shadow-xs focus:outline-none ${
                      isNameInvalid
                        ? "border-red-500 bg-red-50/20 ring-1 ring-red-500"
                        : "border-slate-300 bg-white focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                    }`}
                    placeholder="e.g. Dr. Rajesh Kumar Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  {isNameInvalid && (
                    <span className="text-[11px] text-red-600 block">
                      Name is required.
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <label className="text-xs font-semibold text-slate-800">
                      Cadre / Portal Username{" "}
                      <span className="text-red-600">*</span>
                    </label>
                    <span className="text-[10px] font-mono">
                      {usernameStatus === "checking" && (
                        <span className="text-slate-500 flex items-center gap-1">
                          <Loader2 size={10} className="animate-spin" />{" "}
                          Verifying
                        </span>
                      )}
                      {usernameStatus === "available" && (
                        <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                          <CheckCircle2 size={11} /> Available
                        </span>
                      )}
                      {usernameStatus === "taken" && (
                        <span className="text-red-600 font-semibold">
                          Unavailable
                        </span>
                      )}
                    </span>
                  </div>
                  <input
                    type="text"
                    className={`w-full h-9 px-3 rounded border text-xs font-mono text-slate-900 shadow-xs focus:outline-none ${
                      isUsernameInvalid
                        ? "border-red-500 bg-red-50/20 ring-1 ring-red-500"
                        : "border-slate-300 bg-white focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                    }`}
                    placeholder="e.g. rajesh_k_iss"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  {isUsernameInvalid && (
                    <span className="text-[11px] text-red-600 block">
                      {usernameStatus === "taken"
                        ? "Username is taken. Choose another."
                        : "Minimum 3 characters required."}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800">
                    Official Email (NIC / Government Domain){" "}
                    <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    className={`w-full h-9 px-3 rounded border text-xs text-slate-900 shadow-xs focus:outline-none ${
                      isEmailInvalid
                        ? "border-red-500 bg-red-50/20 ring-1 ring-red-500"
                        : "border-slate-300 bg-white focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                    }`}
                    placeholder="e.g. rajesh.sharma@mospi.gov.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  {isEmailInvalid && (
                    <span className="text-[11px] text-red-600 block">
                      Valid official email address is required.
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800">
                    Mobile Phone Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    className={`w-full h-9 px-3 rounded border text-xs text-slate-900 shadow-xs focus:outline-none ${
                      isPhoneInvalid
                        ? "border-red-500 bg-red-50/20 ring-1 ring-red-500"
                        : "border-slate-300 bg-white focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                    }`}
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  {isPhoneInvalid && (
                    <span className="text-[11px] text-red-600 block">
                      10-digit mobile number required.
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800">
                    Gender
                  </label>
                  <select
                    className="w-full h-9 px-3 rounded border border-slate-300 bg-white text-xs text-slate-900 shadow-xs focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    className="w-full h-9 px-3 rounded border border-slate-300 bg-white text-xs text-slate-900 shadow-xs focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
                <span className="text-xs font-bold font-mono text-slate-400">
                  02.
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Cadre Classification & Departmental Posting
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800">
                    Official Designation / Post{" "}
                    <span className="text-red-600">*</span>
                  </label>
                  <select
                    className="w-full h-9 px-3 rounded border border-slate-300 bg-white text-xs text-slate-900 shadow-xs focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  >
                    {DESIGNATIONS.map((group, gIdx) => (
                      <optgroup key={gIdx} label={group.group}>
                        {group.options.map((opt, oIdx) => (
                          <option key={oIdx} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800">
                    Division / Wing / Directorate{" "}
                    <span className="text-red-600">*</span>
                  </label>
                  <select
                    className="w-full h-9 px-3 rounded border border-slate-300 bg-white text-xs text-slate-900 shadow-xs focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    {DEPARTMENTS.map((dept, idx) => (
                      <option key={idx} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {designation === "Other" && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-800">
                      Specify Custom Designation{" "}
                      <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full h-9 px-3 rounded border border-slate-300 bg-white text-xs text-slate-900 shadow-xs focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                      placeholder="e.g. Senior Demographer / Consultant"
                      value={customDesignation}
                      onChange={(e) => setCustomDesignation(e.target.value)}
                    />
                  </div>
                )}

                {department === "Other" && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-800">
                      Specify Custom Department / Organization{" "}
                      <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full h-9 px-3 rounded border border-slate-300 bg-white text-xs text-slate-900 shadow-xs focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                      placeholder="e.g. Planning Commission / State Statistical Bureau"
                      value={customDepartment}
                      onChange={(e) => setCustomDepartment(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
                <span className="text-xs font-bold font-mono text-slate-400">
                  03.
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
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
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
                <span className="text-xs font-bold font-mono text-slate-400">
                  04.
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Account Security
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800">
                    Account Password <span className="text-red-600">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`w-full h-9 pl-3 pr-9 rounded border text-xs text-slate-900 shadow-xs focus:outline-none ${
                        isPasswordInvalid
                          ? "border-red-500 bg-red-50/20 ring-1 ring-red-500"
                          : "border-slate-300 bg-white focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                      }`}
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-2.5 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {isPasswordInvalid && (
                    <span className="text-[11px] text-red-600 block">
                      Password must be at least 6 characters.
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800">
                    Confirm Password <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="password"
                    className={`w-full h-9 px-3 rounded border text-xs text-slate-900 shadow-xs focus:outline-none ${
                      isConfirmPasswordInvalid
                        ? "border-red-500 bg-red-50/20 ring-1 ring-red-500"
                        : "border-slate-300 bg-white focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                    }`}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {isConfirmPasswordInvalid && (
                    <span className="text-[11px] text-red-600 block">
                      Passwords do not match.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-[11px] text-slate-500 text-left">
                By submitting this form, you confirm that the entered service
                record and qualifications are accurate under the Official
                Statistics Code of Conduct.
              </span>
              <button
                type="submit"
                className="w-full sm:w-auto h-10 px-6 bg-blue-900 hover:bg-blue-950 text-white rounded text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
              <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-amber-400" />
                  <span className="font-serif text-xs font-bold uppercase tracking-wider">
                    Competency Dossier Preview
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-950 border border-blue-800 text-blue-300">
                  LIVE
                </span>
              </div>

              <div className="p-4 space-y-4 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-0.5">
                    Official Cadre Designation
                  </span>
                  <div className="font-semibold text-slate-900">
                    {designation === "Other"
                      ? customDesignation || "Unspecified Cadre"
                      : designation}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-0.5">
                    Departmental Division
                  </span>
                  <div className="font-medium text-slate-800">
                    {department === "Other"
                      ? customDepartment || "Unspecified Division"
                      : department}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-left">
                  <div className="bg-slate-50 border border-slate-200 p-2 rounded">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">
                      Qualifications
                    </span>
                    <span className="font-mono text-base font-bold text-slate-900">
                      {qualifications.length}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2 rounded">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">
                      Service Records
                    </span>
                    <span className="font-mono text-base font-bold text-slate-900">
                      {experience.length}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5">
                    FRAC Competency Framework Alignment
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] bg-slate-50 border border-slate-200 px-2 py-1 rounded">
                      <span className="text-slate-700">
                        Survey Sampling & Estimation
                      </span>
                      <span className="font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        Level 3 • Proficient
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] bg-slate-50 border border-slate-200 px-2 py-1 rounded">
                      <span className="text-slate-700">
                        National Accounting (SNA 2008)
                      </span>
                      <span className="font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        Level 4 • Advanced
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] bg-slate-50 border border-slate-200 px-2 py-1 rounded">
                      <span className="text-slate-700">
                        Price Indices (CPI / WPI)
                      </span>
                      <span className="font-mono text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        Level 2 • Intermediate
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] bg-slate-50 border border-slate-200 px-2 py-1 rounded">
                      <span className="text-slate-700">
                        Data Quality & Assurance (DQAF)
                      </span>
                      <span className="font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        Level 3 • Proficient
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500 leading-normal">
                  <Layers
                    size={14}
                    className="shrink-0 text-slate-400 mt-0.5"
                  />
                  <span>
                    Upon completion of enrollment, AI skill intelligence maps
                    your background to iGOT Karmayogi curriculum tracks.
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded p-3.5 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Building2 size={14} className="text-slate-500" />
                <span>NSSTA Cadre Support Helpdesk</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                For official assistance regarding ISS/SSS cadre seniority
                numbers or designation changes, contact the NSSTA Helpdesk at{" "}
                <span className="font-mono text-slate-700">
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
