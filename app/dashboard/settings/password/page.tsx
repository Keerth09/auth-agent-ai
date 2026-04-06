"use client";

import { useState } from "react";
import { 
  Key, 
  ShieldCheck, 
  Fingerprint, 
  Lock, 
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

export default function PasswordSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  const handleEnroll = () => {
    setEnrolling(true);
    setTimeout(() => {
       setEnrolling(false);
       setEnrolled(true);
       setTimeout(() => setEnrolled(false), 2000);
    }, 2000);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mimic secure update
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="animate-fade-in max-w-4xl">
      <Link 
        href="/dashboard/settings" 
        style={{ 
          display: "inline-flex", 
          alignItems: "center", 
          gap: 8, 
          color: "var(--text-muted)", 
          fontSize: 14, 
          marginBottom: 24,
          textDecoration: "none"
        }}
        className="hover:text-white transition-colors"
      >
        <ArrowLeft size={16} /> Back to Settings
      </Link>

      <header style={{ marginBottom: 40 }}>
        <h1
          style={{
            fontFamily: "var(--font-syne)",
            fontSize: 32,
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
            marginBottom: 8,
          }}
        >
          Password & Security Hub
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>
          Zero-Trust credential management and biometric enrollment.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32, alignItems: "start" }}>
        
        {/* Main Setting Form */}
        <div className="section-card" style={{ padding: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
            <Key size={20} className="text-purple-500" />
            <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-syne)" }}>Update Primary Credentials</h2>
          </div>

          <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ position: "relative" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>Current Password</label>
              <div style={{ position: "relative" }}>
                <input 
                  type={showCurrent ? "text" : "password"} 
                  value={passwords.current}
                  onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                  placeholder="********"
                  style={{ 
                    width: "100%", 
                    padding: "12px 48px 12px 16px", 
                    background: "rgba(255,255,255,0.03)", 
                    border: "1px solid var(--border)", 
                    borderRadius: 12,
                    color: "#fff",
                    outline: "none"
                  }}
                  className="focus:border-purple-500/50 transition-colors"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                >
                  {showCurrent ? <Lock size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ position: "relative" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>New Password</label>
                <div style={{ position: "relative" }}>
                  <input 
                    type={showNew ? "text" : "password"} 
                    value={passwords.new}
                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                    placeholder="********"
                    style={{ 
                      width: "100%", 
                      padding: "12px 40px 12px 16px", 
                      background: "rgba(255,255,255,0.03)", 
                      border: "1px solid var(--border)", 
                      borderRadius: 12,
                      color: "#fff",
                      outline: "none"
                    }}
                    className="focus:border-purple-500/50 transition-colors"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                  >
                    {showNew ? <Lock size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div style={{ position: "relative" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>Confirm New Password</label>
                <div style={{ position: "relative" }}>
                  <input 
                    type={showConfirm ? "text" : "password"} 
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                    placeholder="********"
                    style={{ 
                      width: "100%", 
                      padding: "12px 40px 12px 16px", 
                      background: "rgba(255,255,255,0.03)", 
                      border: "1px solid var(--border)", 
                      borderRadius: 12,
                      color: "#fff",
                      outline: "none"
                    }}
                    className="focus:border-purple-500/50 transition-colors"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                  >
                    {showConfirm ? <Lock size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
              style={{ 
                marginTop: 12, 
                width: "fit-content",
                padding: "12px 28px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "var(--purple)",
                border: "none",
                borderRadius: 12,
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer"
              }}
            >
              {loading ? "Updating Security Context..." : success ? <>Success <CheckCircle2 size={16} /></> : "Update Credentials"}
            </button>
          </form>
        </div>

        {/* Side Panel: Biometrics */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="section-card" style={{ padding: 24, border: "1px solid rgba(52,211,153,0.1)", background: "rgba(52,211,153,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Fingerprint className="text-emerald-400" size={18} />
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Biometric Enrollment</h3>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 20 }}>
              Use TouchID, FaceID, or hardware keys for cryptographic Zero-Trust verification.
            </p>
            <button 
              onClick={handleEnroll}
              disabled={enrolling}
              style={{ 
                width: "100%", 
                padding: "10px", 
                borderRadius: 8, 
                border: enrolled ? "1px solid #34d399" : "1px solid rgba(52,211,153,0.2)", 
                background: enrolled ? "rgba(52,211,153,0.1)" : "rgba(52,211,153,0.05)", 
                color: enrolled ? "#34d399" : "#34d399",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer"
              }}
              className="hover:bg-emerald-500/10 transition-colors"
            >
              {enrolling ? "Scanning..." : enrolled ? "Passkey Enrolled ✓" : "Configure Passkey"}
            </button>
          </div>

          <div className="section-card" style={{ padding: 24, border: "1px solid rgba(239,68,68,0.1)", background: "rgba(239,68,68,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Lock className="text-rose-400" size={18} />
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Security Status</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
                <span>MFA Enforcement:</span>
                <span style={{ color: "#34d399" }}>ACTIVE</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
                 <span>Session Timeout:</span>
                 <span>60 MINS</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
