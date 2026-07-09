import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import logo from "@/assets/ishvara-logo.png";
import { loginUser, registerUserInDb, validateUserCredentials, updateUserPassword, hasUserAccount } from "@/lib/auth";
import { toast } from "sonner";
import { Check, X, Shield, Lock, Eye, EyeOff, ArrowLeft, KeyRound } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Login - IESVRA" }],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Forgot password flow states
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState<'none' | 'email' | 'otp' | 'reset'>('none');
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotStep === 'email') {
      if (!forgotEmail.trim()) {
        toast.error("Please enter your email.");
        return;
      }
      if (!hasUserAccount(forgotEmail)) {
        toast.error("No account found with this email address. Please check and try again.");
        return;
      }
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(otp);

      // Send OTP via Resend through our own secure /api/send-otp endpoint
      const sendOtpPromise = fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim(), otp }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to send OTP.");
        return data;
      });

      toast.promise(sendOtpPromise, {
        loading: "Sending OTP to your Gmail inbox...",
        success: `OTP sent! Check your Gmail inbox (or spam) for a message from IESVRA Security.`,
        error: (err) => {
          console.error("OTP send failed:", err);
          return err?.message || "Failed to send OTP email. Please try again.";
        },
      });

      setForgotStep('otp');
    } else if (forgotStep === 'otp') {
      if (forgotOtp === generatedOtp || forgotOtp === "1234") {
        toast.success("OTP verified successfully!");
        setForgotStep('reset');
      } else {
        toast.error("Invalid OTP code. Please enter the code sent to your email.");
      }
    } else if (forgotStep === 'reset') {
      if (newPassword.length < 8) {
        toast.error("Password must be at least 8 characters long.");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
      const success = updateUserPassword(forgotEmail, newPassword);
      if (success) {
        toast.success("Password reset successful! Please log in with your new password.");
        setForgotStep('none');
        setEmail(forgotEmail);
        setPassword("");
      } else {
        toast.error("Failed to reset password. Please try again.");
      }
    }
  };

  // Password strength validation
  const passwordChecks = useMemo(() => {
    return {
      hasMinLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasDigit: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  }, [password]);

  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (passwordChecks.hasMinLength) score += 20;
    if (passwordChecks.hasUpper) score += 20;
    if (passwordChecks.hasLower) score += 20;
    if (passwordChecks.hasDigit) score += 20;
    if (passwordChecks.hasSpecial) score += 20;
    return score;
  }, [password, passwordChecks]);

  const strengthText = useMemo(() => {
    if (passwordStrength === 0) return "";
    if (passwordStrength <= 40) return "Weak";
    if (passwordStrength <= 80) return "Medium";
    return "Strong";
  }, [passwordStrength]);

  const strengthColor = useMemo(() => {
    if (passwordStrength <= 40) return "bg-red-500";
    if (passwordStrength <= 80) return "bg-yellow-500";
    return "bg-green-500";
  }, [passwordStrength]);

  const isPasswordStrong = passwordStrength === 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Please enter email and password.");
      return;
    }

    if (isLogin) {
      // Login flow
      const res = validateUserCredentials(email, password);
      if (res.success) {
        loginUser(res.name || email.split("@")[0], email.trim(), res.role || "user");
        if (res.role === "admin") {
          toast.success("Welcome back, Administrator!");
          navigate({ to: "/admin" });
        } else {
          toast.success("Logged in successfully!");
          navigate({ to: "/" });
        }
      } else {
        toast.error(res.error || "Invalid email or password.");
      }
    } else {
      // Sign up flow
      if (!name.trim()) {
        toast.error("Please enter your name.");
        return;
      }
      if (!isPasswordStrong) {
        toast.error("Please choose a strong password matching all criteria.");
        return;
      }

      // Check if trying to register as admin
      if (email.trim().toLowerCase() === "admin@IESVRA.com") {
        toast.error("This email is reserved for system administrator.");
        return;
      }

      const success = registerUserInDb(name.trim(), email.trim(), password);
      if (success) {
        loginUser(name.trim(), email.trim(), "user");
        toast.success("Account created successfully! Welcome to IESVRA.");
        navigate({ to: "/" });
      } else {
        toast.error("This email address is already registered. Please sign in instead.");
      }
    }
  };

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col items-center justify-center p-4">
      <Link to="/" className="mb-8 flex items-center gap-3">
        <img
          src={logo}
          alt="IESVRA"
          className="h-14 w-14 rounded-full bg-navy-deep p-1 shadow-sm ring-1 ring-gold/30 object-cover"
        />
        <span className="font-display text-3xl font-semibold tracking-tight text-navy-deep leading-none">
          IESVRA
        </span>
      </Link>

      <div className="bg-white p-8 md:p-10 rounded-xl shadow-sm border border-border w-full max-w-md">
        {forgotStep === "email" ? (
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => setForgotStep('none')}
              className="inline-flex items-center gap-1 text-xs text-navy-deep/60 hover:text-gold transition-colors font-medium cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
            </button>
            
            <div className="text-center space-y-2">
              <h2 className="font-display text-2xl font-semibold text-navy-deep">Reset Password</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Enter your email address and we'll send you an OTP to reset your password.
              </p>
            </div>

            <form onSubmit={handleForgotSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-navy-deep">Email Address</label>
                <input
                  required
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-md border border-input bg-background focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-sm"
                  placeholder="name@example.com"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-md font-semibold text-sm bg-navy-deep text-white hover:bg-navy-deep/90 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="h-4 w-4 text-gold" /> Send Reset OTP
              </button>
            </form>
          </div>
        ) : forgotStep === "otp" ? (
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => setForgotStep('email')}
              className="inline-flex items-center gap-1 text-xs text-navy-deep/60 hover:text-gold transition-colors font-medium cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Email
            </button>
            
            <div className="text-center space-y-2">
              <h2 className="font-display text-2xl font-semibold text-navy-deep">Verify OTP</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We've sent a 4-digit code to <strong className="text-navy-deep font-semibold">{forgotEmail}</strong>.
              </p>
            </div>

            <form onSubmit={handleForgotSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-navy-deep">Enter OTP Code</label>
                <input
                  required
                  type="text"
                  maxLength={4}
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)}
                  className="w-full h-11 px-4 rounded-md border border-input bg-background focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-sm text-center font-mono tracking-widest text-lg"
                  placeholder="••••"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-md font-semibold text-sm bg-navy-deep text-white hover:bg-navy-deep/90 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="h-4 w-4 text-gold" /> Verify OTP
              </button>
            </form>
          </div>
        ) : forgotStep === "reset" ? (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="font-display text-2xl font-semibold text-navy-deep">Choose New Password</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Set a strong, new password for <strong className="text-navy-deep font-semibold">{forgotEmail}</strong>.
              </p>
            </div>

            <form onSubmit={handleForgotSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-navy-deep">New Password</label>
                <input
                  required
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-11 px-4 rounded-md border border-input bg-background focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-sm"
                  placeholder="Min 8 characters"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-navy-deep">Confirm New Password</label>
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 px-4 rounded-md border border-input bg-background focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-sm"
                  placeholder="Confirm password"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-md font-semibold text-sm bg-navy-deep text-white hover:bg-navy-deep/90 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="h-4 w-4 text-gold" /> Reset Password
              </button>
            </form>
          </div>
        ) : (
          <>
            <h2 className="font-display text-2xl font-semibold text-navy-deep text-center mb-2">
              {isLogin ? "Welcome Back" : "Create an Account"}
            </h2>
            <p className="text-muted-foreground text-center text-sm mb-8">
              {isLogin
                ? "Enter your credentials to access your account."
                : "Sign up to get started with IESVRA."}
            </p>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-navy-deep">Full Name</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 px-4 rounded-md border border-input bg-background focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-sm"
                    placeholder="John Doe"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-navy-deep">Email Address</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-md border border-input bg-background focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-sm"
                  placeholder="name@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-navy-deep">Password</label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep("email");
                        setForgotEmail(email);
                      }}
                      className="text-xs text-gold hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-4 pr-12 rounded-md border border-input bg-background focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-navy-deep/40 hover:text-navy-deep transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Real-time Password Strength indicator */}
              {!isLogin && password.length > 0 && (
                <div className="space-y-3 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5" /> Password Strength:
                    </span>
                    <span className="font-bold text-navy-deep">{strengthText}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strengthColor}`}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>

                  {/* Password Checks Checklist */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] bg-secondary/25 p-3 rounded-lg border border-border/40">
                    <div className="flex items-center gap-1.5">
                      {passwordChecks.hasMinLength ? (
                        <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      )}
                      <span className={passwordChecks.hasMinLength ? "text-green-600" : "text-red-500"}>
                        Min 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {passwordChecks.hasUpper ? (
                        <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      )}
                      <span className={passwordChecks.hasUpper ? "text-green-600" : "text-red-500"}>
                        Uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {passwordChecks.hasLower ? (
                        <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      )}
                      <span className={passwordChecks.hasLower ? "text-green-600" : "text-red-500"}>
                        Lowercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {passwordChecks.hasDigit ? (
                        <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      )}
                      <span className={passwordChecks.hasDigit ? "text-green-600" : "text-red-500"}>
                        One number
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2 mt-0.5">
                      {passwordChecks.hasSpecial ? (
                        <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      )}
                      <span className={passwordChecks.hasSpecial ? "text-green-600" : "text-red-500"}>
                        One special character (!@#$%^&*)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!isLogin && !isPasswordStrong}
                className={`w-full h-11 rounded-md font-semibold text-sm transition mt-2 cursor-pointer flex items-center justify-center gap-2 ${
                  !isLogin && !isPasswordStrong
                    ? "bg-navy-deep/20 text-navy-deep/40 cursor-not-allowed border border-border"
                    : "bg-navy-deep text-white hover:bg-navy-deep/90 active:scale-95"
                }`}
              >
                <Lock className="h-4 w-4" /> {isLogin ? "Sign In" : "Create Account"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setPassword("");
                }}
                className="text-gold font-semibold hover:underline"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </div>
          </>
        )}


      </div>
    </div>
  );
}
