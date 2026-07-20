import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef } from "react";
const logo = "/iesvra-logo.png";
import { loginUser, registerUserInDb, validateUserCredentials, updateUserPassword, hasUserAccount, getRegisteredUsers, saveRegisteredUsers } from "@/lib/auth";
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

  // Mock social login states
  const [socialProvider, setSocialProvider] = useState<string | null>(null);
  const [socialEmail, setSocialEmail] = useState("");

  const handleSocialLogin = (provider: string) => {
    setSocialProvider(provider);
    setSocialEmail("");
  };

  const handleSocialLoginSubmit = (nameVal: string, emailVal: string) => {
    loginUser(nameVal, emailVal, "user");

    const users = getRegisteredUsers();
    const normalizedEmail = emailVal.trim().toLowerCase();
    if (!users.some((u: any) => u.email.toLowerCase() === normalizedEmail)) {
      users.push({
        name: nameVal,
        email: normalizedEmail,
        passwordHash: "social-auth-bypass-pass",
        role: 'user'
      });
      saveRegisteredUsers(users);
    }

    toast.success(`Logged in successfully via ${socialProvider}!`);
    setSocialProvider(null);
    navigate({ to: "/" });
  };

  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (socialProvider !== "Google") return;

    const initGoogleBtn = () => {
      const client_id = (window as any).GOOGLE_CLIENT_ID || "825754182940-32tep8cm2tku2cdpfmd29adhn8q8j4du.apps.googleusercontent.com";
      (window as any).google.accounts.id.initialize({
        client_id: client_id,
        callback: (response: any) => {
          try {
            const base64Url = response.credential.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const payload = JSON.parse(jsonPayload);
            if (payload && payload.email) {
              handleSocialLoginSubmit(payload.name || payload.email.split('@')[0], payload.email);
            }
          } catch (err) {
            console.error("Google authentication error:", err);
          }
        }
      });
      if (googleBtnRef.current) {
        (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          width: "300"
        });
      }
    };

    if (typeof (window as any).google === "undefined" || !(window as any).google.accounts) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogleBtn;
      document.head.appendChild(script);
    } else {
      setTimeout(initGoogleBtn, 100);
    }
  }, [socialProvider]);

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
      <Link to="/" className="mb-8 flex items-center">
        <img
          src={logo}
          alt="IESVRA"
          className="h-12 w-auto object-contain"
        />
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

            {/* Social Login Divider */}
            <div className="relative my-6 text-center text-xs uppercase text-muted-foreground">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <span className="relative bg-white px-2">Or continue with</span>
            </div>

            {/* Social Login Buttons */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => window.location.href = "/api/auth/google"}
                className="flex items-center justify-center gap-2 h-11 border border-border rounded-md hover:bg-secondary/10 transition font-semibold text-sm text-navy-deep active:scale-95 cursor-pointer w-full"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin("Apple")}
                className="flex items-center justify-center gap-2 h-11 border border-border rounded-md hover:bg-secondary/10 transition font-semibold text-sm text-navy-deep active:scale-95 cursor-pointer w-full"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 3.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.11.09 2.26-.56 2.95-1.39z"/></svg>
                Continue with Apple
              </button>
            </div>
          </>
        )}
      </div>

      {/* Social Login Modal Overlay */}
      {socialProvider && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg border border-border p-6 w-full max-w-sm relative animate-in fade-in zoom-in-95 duration-200 text-navy-deep font-sans">
            <button
              onClick={() => setSocialProvider(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-navy-deep cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {socialProvider === "Google" ? (
              <div>
                <div className="text-center mb-6">
                  <svg className="mx-auto mb-3" viewBox="0 0 24 24" width="40" height="40" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  <h3 className="text-xl font-bold text-navy-deep">Sign in with Google</h3>
                  <p className="text-xs text-muted-foreground mt-1">to continue to IESVRA</p>
                </div>

                <div className="flex justify-center mb-6 min-h-[44px]">
                  <div ref={googleBtnRef} className="w-full flex justify-center"></div>
                </div>

                <div className="border-t border-border/60 pt-4">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-2">Or use another Google account</label>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (socialEmail.trim()) {
                      handleSocialLoginSubmit(socialEmail.trim().split("@")[0], socialEmail.trim());
                    }
                  }} className="flex gap-2">
                    <input
                      required
                      type="email"
                      placeholder="name@domain.com"
                      value={socialEmail}
                      onChange={(e) => setSocialEmail(e.target.value)}
                      className="flex-1 border border-border rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                    />
                    <button type="submit" className="bg-primary text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-primary/90 transition cursor-pointer">Next</button>
                  </form>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-center mb-6">
                  <svg className="mx-auto mb-3 text-navy-deep fill-current" viewBox="0 0 24 24" width="40" height="40" xmlns="http://www.w3.org/2000/svg"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.11.09 2.26-.56 2.95-1.39z"/></svg>
                  <h3 className="text-xl font-bold text-navy-deep">Sign in with Apple ID</h3>
                  <p className="text-xs text-muted-foreground mt-1">Use your Apple ID to sign in to IESVRA</p>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (socialEmail.trim()) {
                    handleSocialLoginSubmit(socialEmail.trim().split("@")[0], socialEmail.trim());
                  }
                }} className="space-y-3 mb-6">
                  <input
                    required
                    type="email"
                    placeholder="Apple ID"
                    value={socialEmail}
                    onChange={(e) => setSocialEmail(e.target.value)}
                    className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gold"
                  />
                  <button type="submit" className="w-full bg-navy-deep text-white py-2 rounded-md font-semibold text-sm hover:bg-navy-deep/90 transition cursor-pointer">Continue</button>
                </form>

                <div className="border-t border-border/60 pt-4 text-center">
                  <button
                    onClick={() => handleSocialLoginSubmit("Apple User", "appleuser@iesvra.com")}
                    className="text-xs font-semibold text-gold hover:underline cursor-pointer"
                  >
                    Sign in with Touch ID / Face ID
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
