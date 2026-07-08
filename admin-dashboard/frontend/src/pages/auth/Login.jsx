import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useAuth from "../../hooks/useAuth";

/**
 * Login Page
 * ─────────────────────────────────────────────────────────────────
 * Premium dark-themed login page.
 * Uses the existing CSS design system + inline styles for unique elements.
 * No MUI dependency — keeps bundle small and consistent with app style.
 */
const Login = () => {
  const navigate  = useNavigate();
  const { login, isAuth } = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  // Already logged in — skip login page
  if (isAuth) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success("Welcome back! Redirecting…");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* ── Animated background blobs ─────────────────────── */}
      <div style={styles.blob1} aria-hidden="true" />
      <div style={styles.blob2} aria-hidden="true" />

      {/* ── Card ──────────────────────────────────────────── */}
      <div style={styles.card}>

        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>🎓</div>
          <div>
            <div style={styles.logoName}>SchoolOrg</div>
            <div style={styles.logoSub}>Admin Dashboard</div>
          </div>
        </div>

        {/* Heading */}
        <div style={styles.headingWrap}>
          <h1 style={styles.heading}>Welcome back</h1>
          <p style={styles.subheading}>
            Sign in to your administrator account to continue.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form} noValidate>

          {/* Email */}
          <div style={styles.fieldWrap}>
            <label htmlFor="login-email" style={styles.label}>
              Email Address
            </label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon} aria-hidden="true">✉️</span>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@schoolorg.com"
                style={styles.input}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div style={styles.fieldWrap}>
            <label htmlFor="login-password" style={styles.label}>
              Password
            </label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon} aria-hidden="true">🔒</span>
              <input
                id="login-password"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ ...styles.input, paddingRight: "48px" }}
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                style={styles.toggleBtn}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            id="login-submit-btn"
            type="submit"
            style={{
              ...styles.submitBtn,
              opacity:   loading ? 0.7 : 1,
              cursor:    loading ? "not-allowed" : "pointer",
            }}
            disabled={loading}
          >
            {loading ? (
              <span style={styles.loadingInner}>
                <span style={styles.spinner} aria-hidden="true" />
                Signing in…
              </span>
            ) : (
              "Sign In →"
            )}
          </button>
        </form>

        {/* Footer hint */}
        <p style={styles.hint}>
          School Organization Management Ecosystem · Admin Portal
        </p>
      </div>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blobFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50%       { transform: translateY(-30px) scale(1.05); }
        }
        #login-email:focus, #login-password:focus {
          outline: none;
          border-color: rgba(99,102,241,0.7) !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important;
        }
        #login-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(99,102,241,0.4) !important;
        }
      `}</style>
    </div>
  );
};

/* ── Styles ───────────────────────────────────────────────────── */
const styles = {
  page: {
    minHeight:       "100vh",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    background:      "linear-gradient(135deg, #0f1117 0%, #141824 50%, #0f1117 100%)",
    padding:         "24px",
    position:        "relative",
    overflow:        "hidden",
    fontFamily:      "'Inter', 'Segoe UI', sans-serif",
  },
  blob1: {
    position:        "absolute",
    width:           "500px",
    height:          "500px",
    borderRadius:    "50%",
    background:      "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
    top:             "-100px",
    left:            "-100px",
    animation:       "blobFloat 8s ease-in-out infinite",
    pointerEvents:   "none",
  },
  blob2: {
    position:        "absolute",
    width:           "400px",
    height:          "400px",
    borderRadius:    "50%",
    background:      "radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 70%)",
    bottom:          "-80px",
    right:           "-80px",
    animation:       "blobFloat 10s ease-in-out infinite reverse",
    pointerEvents:   "none",
  },
  card: {
    position:        "relative",
    zIndex:          1,
    width:           "100%",
    maxWidth:        "420px",
    background:      "rgba(22, 28, 45, 0.85)",
    backdropFilter:  "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border:          "1px solid rgba(100,116,139,0.18)",
    borderRadius:    "20px",
    padding:         "40px",
    boxShadow:       "0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
  },
  logoWrap: {
    display:         "flex",
    alignItems:      "center",
    gap:             "14px",
    marginBottom:    "32px",
  },
  logoIcon: {
    width:           "48px",
    height:          "48px",
    background:      "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(6,182,212,0.2))",
    borderRadius:    "14px",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    fontSize:        "24px",
    border:          "1px solid rgba(99,102,241,0.3)",
    flexShrink:      0,
  },
  logoName: {
    fontSize:        "18px",
    fontWeight:      700,
    color:           "#e2e8f0",
    letterSpacing:   "-0.3px",
  },
  logoSub: {
    fontSize:        "11px",
    color:           "#64748b",
    letterSpacing:   "0.5px",
    textTransform:   "uppercase",
    marginTop:       "2px",
  },
  headingWrap: {
    marginBottom: "28px",
  },
  heading: {
    fontSize:        "24px",
    fontWeight:      700,
    color:           "#e2e8f0",
    margin:          "0 0 6px",
    letterSpacing:   "-0.5px",
  },
  subheading: {
    fontSize:        "14px",
    color:           "#64748b",
    margin:          0,
    lineHeight:      1.5,
  },
  form: {
    display:         "flex",
    flexDirection:   "column",
    gap:             "18px",
  },
  fieldWrap: {
    display:         "flex",
    flexDirection:   "column",
    gap:             "7px",
  },
  label: {
    fontSize:        "13px",
    fontWeight:      500,
    color:           "#94a3b8",
    letterSpacing:   "0.2px",
  },
  inputWrap: {
    position:        "relative",
    display:         "flex",
    alignItems:      "center",
  },
  inputIcon: {
    position:        "absolute",
    left:            "14px",
    fontSize:        "15px",
    pointerEvents:   "none",
    zIndex:          1,
  },
  input: {
    width:           "100%",
    padding:         "12px 14px 12px 42px",
    background:      "rgba(15,17,23,0.6)",
    border:          "1px solid rgba(100,116,139,0.2)",
    borderRadius:    "10px",
    color:           "#e2e8f0",
    fontSize:        "14px",
    transition:      "border-color 0.2s, box-shadow 0.2s",
    boxSizing:       "border-box",
    fontFamily:      "inherit",
  },
  toggleBtn: {
    position:        "absolute",
    right:           "12px",
    background:      "none",
    border:          "none",
    cursor:          "pointer",
    fontSize:        "16px",
    padding:         "4px",
    display:         "flex",
    alignItems:      "center",
    color:           "#64748b",
    lineHeight:      1,
  },
  submitBtn: {
    marginTop:       "8px",
    padding:         "13px",
    background:      "linear-gradient(135deg, #6366f1, #4f46e5)",
    border:          "none",
    borderRadius:    "10px",
    color:           "#fff",
    fontSize:        "15px",
    fontWeight:      600,
    letterSpacing:   "0.2px",
    transition:      "transform 0.15s, box-shadow 0.15s, opacity 0.15s",
    boxShadow:       "0 4px 15px rgba(99,102,241,0.3)",
    fontFamily:      "inherit",
  },
  loadingInner: {
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    gap:             "10px",
  },
  spinner: {
    width:           "16px",
    height:          "16px",
    border:          "2px solid rgba(255,255,255,0.3)",
    borderTopColor:  "#fff",
    borderRadius:    "50%",
    display:         "inline-block",
    animation:       "spin 0.7s linear infinite",
  },
  hint: {
    marginTop:       "24px",
    textAlign:       "center",
    fontSize:        "11px",
    color:           "#334155",
    letterSpacing:   "0.3px",
  },
};

export default Login;
