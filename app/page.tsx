"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  ShieldAlert,
  Lock,
  Key,
  Vault,
  Eye,
  Zap,
  Cpu,
  ArrowRight,
  ChevronDown,
  Check,
  X,
  AlertTriangle,
  AlertCircle,
  Code,
  BookOpen,
  Terminal,
  ScrollText,
  UserCheck,
  Fingerprint,
  GitBranch,
  Workflow,
  Layers,
  Sun,
  Moon,
  Sparkles,
  Clock,
  PlugZap,
  Heart,
  PenLine,
  CheckCircle,
  Globe
} from "lucide-react";

const allTerminalLines = [
  { prefix: "$", text: ' agent.run("Summarize my last 5 emails")', color: "#94a3b8" },
  { prefix: "»", text: " Parsing intent: gmail.read [READ]", color: "#94a3b8" },
  { prefix: "»", text: " Permission engine: AUTO-APPROVED", color: "#10b981" },
  { prefix: "»", text: " Fetching token from Auth0 Vault...", color: "#94a3b8" },
  { prefix: "»", text: " Token fingerprint: ...a4f2 | Agent sees: undefined", color: "#475569" },
  { prefix: "✓", text: " Complete. Token discarded. 847ms", color: "#10b981" },
  { prefix: "$", text: ' agent.run("Send reply to John")', color: "#94a3b8" },
  { prefix: "»", text: " Permission engine: WRITE — PAUSED", color: "#f59e0b" },
  { prefix: "⏸", text: " Awaiting human approval in dashboard...", color: "#f59e0b" },
  { prefix: "$", text: ' agent.run("Delete all drafts")', color: "#94a3b8" },
  { prefix: "!", text: " DESTRUCTIVE action — MFA required", color: "#ef4444" },
  { prefix: "»", text: " Auth0 step-up authentication triggered", color: "#ef4444" },
];

export default function LandingPage() {
  const [isDark, setIsDark] = useState(true);
  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const [activeToggle, setActiveToggle] = useState<"vulnerable" | "protected">("protected");
  const [terminalLines, setTerminalLines] = useState<{ prefix: string; text: string; color: string }[]>([]);
  
  // Terminal Logic

  useEffect(() => {
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine <= allTerminalLines.length) {
        setTerminalLines(allTerminalLines.slice(0, currentLine));
        currentLine++;
      } else {
        setTerminalLines([]);
        currentLine = 0;
      }
    }, 700);
    return () => clearInterval(interval);
  }, []);

  // Theme Management
  useEffect(() => {
    const savedTheme = localStorage.getItem("vaultproxy-theme");
    if (savedTheme === "light") {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    } else {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("vaultproxy-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("vaultproxy-theme", "light");
    }
  };

  // Scroll Animations & Counter
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          
          // Counter Logic
          if (entry.target.classList.contains("counter-box")) {
            const el = entry.target.querySelector(".count-up") as HTMLElement;
            if (el) {
              const targetStr = el.getAttribute("data-target") || "0";
              const target = parseInt(targetStr.replace(/,/g, ""), 10);
              let current = 0;
              const step = Math.ceil(target / 40);
              const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                  el.innerText = targetStr + (el.getAttribute("data-suffix") || "");
                  clearInterval(timer);
                } else {
                  el.innerText = current.toLocaleString() + (el.getAttribute("data-suffix") || "");
                }
              }, 50);
            }
          }
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  return (
    <div className={`min-h-screen landing-page-wrapper w-full overflow-x-hidden ${isDark ? "dark" : ""}`}>
      {/* GLOBAL STYLES INJECTED */}
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --bg-primary: #ffffff;
          --bg-secondary: #f8fafc;
          --bg-card: #ffffff;
          --bg-card-hover: #f1f5f9;
          --border: rgba(0,0,0,0.08);
          --border-hover: rgba(124,58,237,0.4);
          --text-primary: #0f172a;
          --text-secondary: #475569;
          --text-muted: #94a3b8;
          --purple: #7C3AED;
          --purple-light: #8b5cf6;
          --purple-glow: rgba(124,58,237,0.15);
          --green: #059669;
          --orange: #d97706;
          --red: #dc2626;
          --shadow: 0 4px 24px rgba(0,0,0,0.08);
          --grid-color: rgba(0,0,0,0.04);
        }

        .dark {
          --bg-primary: #0a0a0f;
          --bg-secondary: #0f0f1a;
          --bg-card: rgba(255,255,255,0.03);
          --bg-card-hover: rgba(255,255,255,0.06);
          --border: rgba(255,255,255,0.08);
          --border-hover: rgba(124,58,237,0.5);
          --text-primary: #f8fafc;
          --text-secondary: #94a3b8;
          --text-muted: #475569;
          --purple: #7C3AED;
          --purple-light: #a78bfa;
          --purple-glow: rgba(124,58,237,0.2);
          --green: #10b981;
          --orange: #f59e0b;
          --red: #ef4444;
          --shadow: 0 4px 24px rgba(0,0,0,0.4);
          --grid-color: rgba(255,255,255,0.03);
        }

        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono&family=Playfair+Display:wght@700&family=Syne:wght@700;800&display=swap');

        .landing-page-wrapper {
          background-color: var(--bg-primary);
          color: var(--text-primary);
          font-family: 'Inter', sans-serif;
        }

        .grid-bg {
          background-image: radial-gradient(var(--grid-color) 1px, transparent 1px);
          background-size: 28px 28px;
        }

        .font-logo { font-family: 'Playfair Display', serif; }
        .font-syne { font-family: 'Syne', sans-serif; }
        .font-mono-jb { font-family: 'JetBrains Mono', monospace; }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.95); }
        }

        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-16px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .animate-fade-up { animation: fadeSlideUp 0.6s ease forwards; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-blink { animation: blink 1s infinite; }
        .animate-pulse-live { animation: pulse-dot 2s infinite; }

        .reveal { opacity: 0; transform: translateY(32px); transition: all 0.6s ease; }
        .reveal.revealed { opacity: 1; transform: translateY(0); }

        .stagger-1 { animation-delay: 0ms; }
        .stagger-2 { animation-delay: 150ms; }
        .stagger-3 { animation-delay: 300ms; }
        .stagger-4 { animation-delay: 450ms; }
        .stagger-5 { animation-delay: 600ms; }
      `}} />

      {/* ANNOUNCEMENT BAR */}
      {announcementVisible && (
        <div className="w-full h-9 flex items-center justify-center relative z-50 text-white text-sm font-medium transition-all duration-300" style={{ background: 'linear-gradient(90deg, var(--purple), #ec4899)' }}>
          <div className="flex items-center gap-2">
            <Sparkles size={16} />
            <span>VaultProxy is live — Built for Auth0 Authorized to Act Hackathon 2026</span>
          </div>
          <button onClick={() => setAnnouncementVisible(false)} className="absolute right-4 hover:opacity-75 transition-opacity">
            <X size={16} />
          </button>
        </div>
      )}

      {/* NAVBAR */}
      <nav className={`fixed w-full h-16 z-40 transition-all duration-300 ${scrolled ? 'backdrop-blur-xl' : 'backdrop-blur-sm'}`} 
           style={{ backgroundColor: scrolled ? 'rgba(var(--bg-primary), 0.9)' : 'transparent', borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent', top: announcementVisible ? '36px' : '0' }}>
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2" style={{ color: 'var(--purple)' }}>
              <Shield size={20} fill="currentColor" fillOpacity={0.2} />
              <span className="font-logo text-xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, var(--purple), var(--purple-light))' }}>VaultProxy</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--purple-glow)', color: 'var(--purple-light)', border: '1px solid var(--border-hover)' }}>
              v2.0
            </span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#" className="flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}>
              <Code size={16} /> GitHub
            </a>
            <a href="#" className="flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}>
              <BookOpen size={16} /> Docs
            </a>
            
            <div className="w-px h-5" style={{ backgroundColor: 'var(--border)' }} />
            
            <button onClick={toggleTheme} className="p-2 rounded-lg transition-colors border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            
            <a href="/auth/login" className="flex items-center gap-2 px-5 py-2 rounded-lg text-white font-medium text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg" style={{ backgroundColor: 'var(--purple)', boxShadow: '0 4px 14px var(--purple-glow)' }}>
              Launch App <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-[100vh] flex flex-col items-center justify-center px-6 pt-24 pb-16 grid-bg">
        {/* Glow behind */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none" style={{ backgroundColor: 'var(--purple-glow)' }} />
        
        <div className="animate-fade-up stagger-1 z-10">
          <div className="animate-float flex items-center gap-2 px-4 py-1.5 rounded-full text-sm mb-8 mx-auto w-fit" style={{ border: '1px solid var(--border-hover)', backgroundColor: 'var(--purple-glow)', color: 'var(--purple-light)' }}>
             <Sparkles size={14} /> Built for Auth0 Authorized to Act Hackathon 2026
          </div>
        </div>

        <h1 className="font-syne font-extrabold text-5xl md:text-6xl text-center max-w-[800px] leading-tight z-10 flex flex-col items-center">
          <span className="animate-fade-up stagger-1 block" style={{ color: 'var(--text-primary)' }}>Your AI Agent.</span>
          <span className="animate-fade-up stagger-2 block mt-2" style={{ 
              backgroundImage: 'linear-gradient(135deg, #7C3AED, #ec4899, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundSize: '200% auto',
              animation: 'gradientShift 4s ease infinite, fadeSlideUp 0.6s ease 150ms forwards'
            }}>Your Rules.</span>
          <span className="animate-fade-up stagger-3 block mt-2" style={{ color: 'var(--text-primary)' }}>Zero Credential Exposure.</span>
        </h1>

        <p className="animate-fade-up stagger-4 text-center text-lg mt-6 max-w-[580px] z-10" style={{ color: 'var(--text-secondary)' }}>
          A secure zero-trust middleware enabling agents to take real-world actions without ever holding the keys. 
        </p>

        <div className="animate-fade-up stagger-5 flex items-center gap-4 mt-10 z-10 flex-wrap justify-center">
          <a href="/auth/login" className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-semibold transition-all hover:scale-105 hover:-translate-y-1" style={{ backgroundColor: 'var(--purple)', boxShadow: '0 8px 30px var(--purple-glow)' }}>
            Launch Agent Control Center <ArrowRight size={18} />
          </a>
          <a href="#" className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold transition-all hover:-translate-y-1" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <Code size={18} /> View on GitHub
          </a>
        </div>

        <div className="animate-fade-up stagger-5 flex flex-wrap justify-center gap-3 mt-10 z-10">
           {[{icon: Shield, text: "Auth0 Token Vault"}, {icon: Zap, text: "Next.js 16"}, {icon: Lock, text: "Zero Stored Credentials"}, {icon: Eye, text: "Full Audit Trail"}].map((tag, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm transition-colors hover:border-[var(--purple)]" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                 <tag.icon size={14} color="var(--purple)" /> {tag.text}
              </div>
           ))}
        </div>

        {/* TERMINAL VISUAL */}
        <div className="animate-fade-up stagger-5 w-full max-w-[720px] mt-16 z-10 relative">
          <div className="absolute inset-0 rounded-2xl blur-2xl opacity-60" style={{ backgroundColor: 'var(--purple-glow)' }} />
          
          <div className="relative rounded-2xl overflow-hidden" style={{ backgroundColor: '#0d0d14', border: '1px solid var(--border)', boxShadow: '0 32px 64px rgba(0,0,0,0.3)' }}>
            <div className="h-11 px-4 flex items-center justify-between" style={{ backgroundColor: '#161622' }}>
               <div className="flex gap-2">
                 <div className="w-3 h-3 rounded-full bg-red-500" />
                 <div className="w-3 h-3 rounded-full bg-yellow-500" />
                 <div className="w-3 h-3 rounded-full bg-green-500" />
               </div>
               <div className="flex items-center gap-2 font-mono-jb text-xs text-slate-500">
                 <Terminal size={12} /> agent.log — live
               </div>
               <div className="flex items-center gap-2 text-xs font-medium text-emerald-500">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-live" /> LIVE
               </div>
            </div>
            
            <div className="p-6 min-h-[220px] font-mono-jb text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
               {terminalLines.map((line, idx) => (
                 <div key={idx} className="flex gap-3 mb-1 animate-fade-up" style={{ animationDuration: '200ms' }}>
                    <span style={{ color: line.color }}>{line.prefix}</span>
                    <span style={{ color: line.color }}>{line.text}</span>
                 </div>
               ))}
               <div className="flex gap-3 mt-1">
                 <span className="animate-blink">|</span>
               </div>
            </div>
          </div>
        </div>

        <ChevronDown size={24} className="mt-12 animate-bounce opacity-50 z-10" style={{ color: 'var(--text-muted)' }} />
      </section>

      {/* METRICS ROW */}
      <section className="w-full py-12 reveal" style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-16 gap-y-10">
          
          <div className="flex flex-col items-center text-center counter-box">
             <Shield size={24} className="mb-2" style={{ color: 'var(--purple)' }} />
             <div className="font-syne font-bold text-4xl mb-1 count-up" data-target="10,247" style={{ backgroundImage: 'linear-gradient(90deg, var(--purple), #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
               0
             </div>
             <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Credentials Protected</div>
          </div>

          <div className="flex flex-col items-center text-center counter-box">
             <Layers size={24} className="mb-2" style={{ color: 'var(--purple)' }} />
             <div className="font-syne font-bold text-4xl mb-1 count-up" data-target="3" style={{ color: 'var(--text-primary)' }}>
               0
             </div>
             <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Permission Tiers</div>
          </div>

          <div className="flex flex-col items-center text-center counter-box">
             <Lock size={24} className="mb-2" style={{ color: 'var(--purple)' }} />
             <div className="font-syne font-bold text-4xl mb-1 count-up" data-target="100" data-suffix="%" style={{ color: 'var(--text-primary)' }}>
               0%
             </div>
             <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Token Isolation Rate</div>
          </div>

          {/* Credential Leaks Box */}
          <div className="flex flex-col items-center text-center counter-box">
             <AlertCircle size={24} className="mb-2" style={{ color: 'var(--green)' }} />
             <div className="font-syne font-bold text-4xl mb-1 count-up" data-target="0" style={{ color: 'var(--green)' }}>
               0
             </div>
             <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Credential Leaks</div>
             <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>The number that matters most</div>
          </div>

        </div>
      </section>

      {/* PROBLEM VS SOLUTION SECTION */}
      <section className="py-28 max-w-[1100px] mx-auto px-6 reveal">
         <div className="flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--red)' }}>
            <AlertTriangle size={16} /> THE PROBLEM
         </div>
         <h2 className="font-syne font-extrabold text-4xl text-center mb-4" style={{ color: 'var(--text-primary)' }}>
            AI Agents Are Holding Keys<br/>They Should Never See
         </h2>
         <p className="text-center max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Traditional implementations give agents raw access tokens or API keys, violating zero-trust principles and creating massive blast radius vulnerabilities.
         </p>

         <div className="grid md:grid-cols-2 gap-8 mt-16">
            {/* PROBLEM CARD */}
            <div className="rounded-2xl overflow-hidden shadow-sm transition-transform hover:-translate-y-1" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(220,38,38,0.25)' }}>
               <div className="h-1 w-full" style={{ backgroundColor: 'var(--red)' }} />
               <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                     <ShieldOff size={24} style={{ color: 'var(--red)' }} />
                     <h3 className="font-semibold text-lg" style={{ color: 'var(--red)' }}>Without VaultProxy</h3>
                  </div>
                  
                  <div className="p-4 rounded-xl mb-6 font-mono-jb text-xs leading-loose" style={{ backgroundColor: '#0a0a0f' }}>
                     <div style={{ color: '#94a3b8' }}>POST /gmail/v1/users/me/messages</div>
                     <div className="flex items-center gap-2 mt-1" style={{ color: '#ef4444' }}>
                        <AlertCircle size={10} className="animate-blink" /> Authorization: Bearer ya29.a0AfH...
                     </div>
                     <div className="flex items-center gap-2" style={{ color: '#ef4444' }}>
                        <X size={10} className="animate-blink" /> X-Api-Key: AIzaSyD-9tSrke72...
                     </div>
                     <div className="mt-2" style={{ color: '#475569' }}>{"// Token sitting in process.env"}</div>
                     <div style={{ color: '#475569' }}>{"// One leak = full account access"}</div>
                  </div>

                  <div className="flex flex-col gap-3">
                     {[
                        "Raw credentials in environment variables",
                        "Agent holds tokens indefinitely",
                        "Full API access — no scope limits",
                        "Zero audit trail or visibility",
                        "Revoking requires rotating all credentials"
                     ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                           <X size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--red)' }} /> {item}
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* SOLUTION CARD */}
            <div className="rounded-2xl overflow-hidden transition-transform hover:-translate-y-1" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(16,185,129,0.25)', boxShadow: '0 0 40px rgba(124,58,237,0.1)' }}>
               <div className="h-1 w-full" style={{ backgroundColor: 'var(--purple)' }} />
               <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                     <ShieldCheck size={24} style={{ color: 'var(--green)' }} />
                     <h3 className="font-semibold text-lg" style={{ color: 'var(--green)' }}>With VaultProxy</h3>
                  </div>
                  
                  <div className="p-4 rounded-xl mb-6 font-mono-jb text-xs leading-loose" style={{ backgroundColor: '#0a0a0f' }}>
                     <div style={{ color: '#94a3b8' }}>POST /api/agent/run</div>
                     <div className="flex items-center gap-2 mt-1" style={{ color: '#10b981' }}>
                        <CheckCircle size={10} /> Authorization: Bearer eyJhbGci...
                     </div>
                     <div className="flex items-center gap-2" style={{ color: '#10b981' }}>
                        <CheckCircle size={10} /> X-Vault-Signature: hmac-sha256-✓
                     </div>
                     <div className="mt-2" style={{ color: '#10b981' }}>{"// Token never leaves Auth0 Vault"}</div>
                     <div style={{ color: '#475569' }}>{"// Agent receives: undefined"}</div>
                  </div>

                  <div className="flex flex-col gap-3">
                     {[
                        "Tokens stored in Auth0 Vault only",
                        "Fetched fresh per-action, discarded after",
                        "Scoped to minimum required permission",
                        "Immutable audit trail with fingerprints",
                        "Revoke instantly — no rotation needed"
                     ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                           <Check size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--green)' }} /> {item}
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-28 w-full reveal" style={{ backgroundColor: 'var(--bg-secondary)' }}>
         <div className="max-w-[1000px] mx-auto px-6">
            <div className="flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--purple)' }}>
               <Workflow size={16} /> HOW IT WORKS
            </div>
            <h2 className="font-syne font-extrabold text-4xl text-center mb-16" style={{ color: 'var(--text-primary)' }}>
               From Task to Execution<br/>In Three Secure Steps
            </h2>

            <div className="grid md:grid-cols-3 gap-6 relative">
               
               <div className="hidden md:block absolute top-[80px] left-[20%] w-[60%] h-px z-0" style={{ backgroundColor: 'var(--border)' }}>
                 <div className="absolute top-1/2 -translate-y-1/2 right-[50%] bg-white rounded-full"><ArrowRight size={16} /></div>
               </div>

               {[
                 {
                    icon: Key, iconColor: 'var(--purple)', num: "01", title: "Grant Once", 
                    desc: "Connect Google or Slack via OAuth. Auth0 Token Vault stores tokens securely. Your agent never sees them.",
                    pills: ["OAuth 2.0", "Token Vault", "Zero exposure"]
                 },
                 {
                    icon: Cpu, iconColor: 'var(--orange)', num: "02", title: "Agent Acts", 
                    desc: "Natural language tasks are parsed safely into strict programmatic intents before hitting any target APIs.",
                    pills: ["Intent parsing", "Risk scoring", "Policy check"]
                 },
                 {
                    icon: UserCheck, iconColor: 'var(--green)', num: "03", title: "You Stay in Control", 
                    desc: "VaultProxy intercepts dangerous tasks. It asks for your explicit permission or MFA before unlocking the Vault.",
                    pills: ["Human approval", "MFA verify", "Instant revoke"]
                 }
               ].map((card, i) => (
                 <div key={i} className="rounded-2xl p-8 relative overflow-hidden transition-transform hover:-translate-y-1 z-10 bg-card group" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="absolute top-4 right-4 font-syne font-extrabold text-7xl opacity-10 pointer-events-none" style={{ color: card.iconColor }}>{card.num}</div>
                    
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: 'var(--purple-glow)', border: `1px solid ${card.iconColor}` }}>
                       <card.icon size={24} style={{ color: card.iconColor }} />
                    </div>

                    <h3 className="font-syne font-bold text-xl mb-3" style={{ color: 'var(--text-primary)' }}>{card.title}</h3>
                    <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{card.desc}</p>

                    <div className="flex flex-wrap gap-2">
                       {card.pills.map((pill, idx) => (
                          <span key={idx} className="text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: 'var(--purple-glow)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                             {pill}
                          </span>
                       ))}
                    </div>
                 </div>
               ))}
               
            </div>
         </div>
      </section>

      {/* PERMISSION ENGINE */}
      <section className="py-28 max-w-[1100px] mx-auto px-6 reveal">
         <div className="flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-primary)' }}>
            <GitBranch size={16} /> PERMISSION ENGINE
         </div>
         <h2 className="font-syne font-extrabold text-4xl text-center mb-16" style={{ color: 'var(--text-primary)' }}>
            Three Tiers of Trust
         </h2>

         <div className="grid md:grid-cols-3 gap-6">
            
            {/* READ */}
            <div className="rounded-2xl overflow-hidden transition-transform hover:-translate-y-1" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
               <div className="h-1 w-full" style={{ backgroundImage: 'linear-gradient(90deg, #3b82f6, #06b6d4)' }} />
               <div className="p-8">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
                     <Eye size={24} style={{ color: '#3b82f6' }} />
                  </div>
                  <h3 className="font-syne font-bold text-xl mb-1" style={{ color: 'var(--text-primary)' }}>Read Actions</h3>
                  <div className="text-sm font-medium mb-4" style={{ color: '#3b82f6' }}>Auto-Approved</div>
                  
                  <div className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-full inline-flex font-medium" style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
                     <Zap size={14} /> Executes Immediately
                  </div>

                  <div className="mt-5 p-3 rounded-lg font-mono-jb text-xs text-center" style={{ backgroundColor: 'rgba(59,130,246,0.05)', color: '#94a3b8', border: '1px solid rgba(59,130,246,0.15)' }}>
                     gmail.read · calendar.read 
                  </div>

                  <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>Safe read-only calls execute seamlessly via the VaultProxy to fetch contextual data.</p>
                  
                  <div className="mt-6 pt-4 text-xs font-mono-jb text-center" style={{ color: 'var(--text-muted)', borderTop: '1px dashed var(--border)' }}>
                     READ → Vault → Execute → Discard
                  </div>
               </div>
            </div>

            {/* WRITE */}
            <div className="rounded-2xl overflow-hidden transition-transform hover:-translate-y-1" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
               <div className="h-1 w-full" style={{ backgroundImage: 'linear-gradient(90deg, #f59e0b, #ef4444)' }} />
               <div className="p-8">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(245,158,11,0.1)' }}>
                     <PenLine size={24} style={{ color: '#f59e0b' }} />
                  </div>
                  <h3 className="font-syne font-bold text-xl mb-1" style={{ color: 'var(--text-primary)' }}>Write Actions</h3>
                  <div className="text-sm font-medium mb-4" style={{ color: '#f59e0b' }}>Approval Required</div>
                  
                  <div className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-full inline-flex font-medium" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                     <Clock size={14} /> Pauses for Human
                  </div>

                  <div className="mt-5 p-3 rounded-lg font-mono-jb text-xs text-center" style={{ backgroundColor: 'rgba(245,158,11,0.05)', color: '#94a3b8', border: '1px solid rgba(245,158,11,0.15)' }}>
                     gmail.send · slack.post
                  </div>

                  <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>Mutating actions are actively blocked and quarantined until you approve them.</p>

                  <div className="mt-6 pt-4 text-xs font-mono-jb text-center" style={{ color: 'var(--text-muted)', borderTop: '1px dashed var(--border)' }}>
                     WRITE → Pause → Notify → Approve
                  </div>
               </div>
            </div>

            {/* DESTRUCTIVE */}
            <div className="relative rounded-2xl overflow-hidden transition-transform hover:-translate-y-1" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 0 40px rgba(220,38,38,0.1)' }}>
               <div className="absolute top-4 right-4 bg-red-500 text-white flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase">
                  <AlertTriangle size={12} /> STRICTEST
               </div>
               <div className="h-1 w-full" style={{ backgroundImage: 'linear-gradient(90deg, #ef4444, #7C3AED)' }} />
               <div className="p-8">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
                     <ShieldAlert size={24} style={{ color: '#ef4444' }} />
                  </div>
                  <h3 className="font-syne font-bold text-xl mb-1" style={{ color: 'var(--text-primary)' }}>Destructive</h3>
                  <div className="text-sm font-medium mb-4" style={{ color: '#ef4444' }}>MFA Required</div>
                  
                  <div className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-full inline-flex font-medium" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                     <Fingerprint size={14} className="animate-pulse" /> Step-Up Auth
                  </div>

                  <div className="mt-5 p-3 rounded-lg font-mono-jb text-xs text-center" style={{ backgroundColor: 'rgba(239,68,68,0.05)', color: '#94a3b8', border: '1px solid rgba(239,68,68,0.15)' }}>
                     gmail.delete · files.remove
                  </div>

                  <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>High-stakes deletions force a step-up Auth0 re-authentication flow.</p>

                  <div className="mt-6 pt-4 text-xs font-mono-jb text-center" style={{ color: 'var(--text-muted)', borderTop: '1px dashed var(--border)' }}>
                     DELETE → MFA → Verify → Execute
                  </div>
               </div>
            </div>

         </div>
      </section>

      {/* ATTACK TOGGLE */}
      <section className="py-28 w-full reveal" style={{ backgroundColor: 'var(--bg-secondary)' }}>
         <div className="max-w-[900px] mx-auto px-6">
            <h2 className="font-syne font-extrabold text-4xl text-center mb-8" style={{ color: 'var(--text-primary)' }}>
               See The Difference
            </h2>

            <div className="flex justify-center mb-12">
               <div className="inline-flex p-1 rounded-full" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <button 
                     onClick={() => setActiveToggle("vulnerable")}
                     className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold transition-all ${activeToggle === "vulnerable" ? "bg-red-500 text-white" : "text-slate-500"}`}
                  >
                     <ShieldOff size={16} /> Vulnerable Mode
                  </button>
                  <button 
                     onClick={() => setActiveToggle("protected")}
                     className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold transition-all ${activeToggle === "protected" ? "text-white" : "text-slate-500"}`}
                     style={{ backgroundColor: activeToggle === "protected" ? 'var(--purple)' : 'transparent' }}
                  >
                     <ShieldCheck size={16} /> Protected Mode
                  </button>
               </div>
            </div>

            <div className="relative">
               {activeToggle === "vulnerable" ? (
                  <div className="rounded-2xl overflow-hidden animate-fade-up" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(220,38,38,0.3)' }}>
                     <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: 'rgba(220,38,38,0.1)', borderBottom: '1px solid rgba(220,38,38,0.2)' }}>
                        <div className="flex items-center gap-3 text-red-500 font-semibold">
                           <ShieldOff size={20} /> VULNERABLE — Without VaultProxy
                        </div>
                        <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-1 rounded">INSECURE</span>
                     </div>
                     <div className="p-6 grid md:grid-cols-2 gap-8">
                        <div>
                           <div className="flex items-center gap-2 text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}><Terminal size={12}/> Agent Request</div>
                           <div className="p-4 rounded-xl font-mono-jb text-xs leading-loose" style={{ backgroundColor: '#0a0a0f' }}>
                              <div style={{ color: '#94a3b8' }}>POST /gmail/v1/messages</div>
                              <div className="text-red-500 animate-blink mt-1">Authorization: Bearer ya29.a0AfH6SMBx...</div>
                              <div className="text-red-500 animate-blink">X-Api-Key: AIzaSyD-9tSrke72Nm...</div>
                           </div>
                        </div>
                        <div>
                           <div className="flex items-center gap-2 text-xs font-semibold text-red-500 mb-3"><AlertCircle size={12}/> Token Exposed In:</div>
                           <div className="font-mono-jb text-xs text-red-500 flex flex-col gap-2">
                              {["process.env.GMAIL_TOKEN", "Agent runtime memory", "Server error logs", "Network request logs", "Memory dump files"].map((x, i)=>(
                                 <div key={i} className="flex gap-2 items-center"><X size={14}/> {x}</div>
                              ))}
                           </div>
                        </div>
                     </div>
                     <div className="m-6 p-4 rounded-lg flex gap-3 items-start" style={{ backgroundColor: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.15)' }}>
                        <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-red-500">One leaked token = full Gmail access. No way to revoke without rotating credentials.</span>
                     </div>
                  </div>
               ) : (
                  <div className="rounded-2xl overflow-hidden animate-fade-up" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(124,58,237,0.3)', boxShadow: '0 0 60px rgba(124,58,237,0.08)' }}>
                     <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: 'rgba(124,58,237,0.1)', borderBottom: '1px solid rgba(124,58,237,0.2)' }}>
                        <div className="flex items-center gap-3 font-semibold" style={{ color: 'var(--purple)' }}>
                           <ShieldCheck size={20} /> PROTECTED — With VaultProxy
                        </div>
                        <span className="text-[10px] font-bold text-white px-2 py-1 rounded" style={{ backgroundColor: 'var(--purple)' }}>SECURE</span>
                     </div>
                     <div className="p-6 grid md:grid-cols-2 gap-8">
                        <div>
                           <div className="flex items-center gap-2 text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}><Terminal size={12}/> Agent Request</div>
                           <div className="p-4 rounded-xl font-mono-jb text-xs leading-loose" style={{ backgroundColor: '#0a0a0f' }}>
                              <div style={{ color: '#94a3b8' }}>POST /api/agent/run</div>
                              <div className="text-emerald-500 mt-1">Authorization: Bearer eyJhbGci...</div>
                              <div className="text-emerald-500">X-Vault-Signature: sha256-verified</div>
                              <div className="text-slate-500">X-Request-ID: req_a4f2...</div>
                           </div>
                        </div>
                        <div>
                           <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500 mb-3"><CheckCircle size={12}/> Token Status:</div>
                           <div className="text-sm flex flex-col gap-3" style={{ color: 'var(--text-secondary)' }}>
                              {["Stored: Auth0 Vault only", "Agent receives: undefined", "Lifespan: Single request", "After use: Permanently discarded", "Audit log: Updated"].map((x, i)=>(
                                 <div key={i} className="flex gap-2 items-center"><Check size={16} className="text-emerald-500"/> {x}</div>
                              ))}
                           </div>
                        </div>
                     </div>
                     <div className="m-6 p-4 rounded-lg flex gap-3 items-center" style={{ backgroundColor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
                        <ShieldCheck size={24} className="text-emerald-500 shrink-0" />
                        <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Zero credential exposure. Revoke any connection instantly from dashboard.</span>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-28 max-w-[1100px] mx-auto px-6 reveal">
         <h2 className="font-syne font-extrabold text-4xl text-center mb-16" style={{ color: 'var(--text-primary)' }}>
            Everything You Need <br/> For Trustworthy AI Agents
         </h2>

         <div className="grid md:grid-cols-3 gap-6">
            {[
               { icon: Vault, title: "Token Vault Integration", desc: "Auth0 Token Vault stores all OAuth tokens. Zero credentials in your application code." },
               { icon: GitBranch, title: "Permission Engine", desc: "Deny-by-default rule engine classifies every action before execution." },
               { icon: UserCheck, title: "Human-in-the-Loop", desc: "High-risk actions pause and wait for explicit human approval via the dashboard." },
               { icon: Fingerprint, title: "Step-Up MFA", desc: "Destructive actions trigger Auth0 re-authentication. No exceptions." },
               { icon: ScrollText, title: "Immutable Audit Log", desc: "Every action logged with token fingerprint, duration, risk level, and result." },
               { icon: PlugZap, title: "Instant Revocation", desc: "Revoke any OAuth connection instantly. Takes effect on next agent request." }
            ].map((f, i) => (
               <div key={i} className="p-6 rounded-2xl transition-transform hover:-translate-y-1 hover:border-[var(--purple)]" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--purple-glow)' }}>
                     <f.icon size={24} style={{ color: 'var(--purple)' }} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
               </div>
            ))}
         </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-28 relative overflow-hidden reveal">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] blur-[100px] pointer-events-none rounded-[100%]" style={{ backgroundColor: 'var(--purple-glow)' }} />
         
         <div className="relative z-10 flex flex-col items-center text-center px-6">
            <h2 className="font-syne font-extrabold text-5xl md:text-6xl max-w-2xl leading-tight" style={{ color: 'var(--text-primary)' }}>
               Ready to Give Your AI Agent a Leash?
            </h2>
            <p className="mt-6 text-xl max-w-xl" style={{ color: 'var(--text-secondary)' }}>
               Launch the Agent Control Center and see the Token Vault proxy in action in under 2 minutes.
            </p>
            
            <a href="/auth/login" className="mt-10 flex items-center gap-2 px-10 py-4 rounded-xl text-white font-semibold text-lg transition-all hover:scale-105 hover:-translate-y-1" style={{ backgroundColor: 'var(--purple)', boxShadow: '0 8px 40px var(--purple-glow)' }}>
               Launch Agent Control Center <ArrowRight size={20} />
            </a>

            <div className="flex flex-wrap justify-center gap-6 mt-6">
               {[
                  "No setup needed for demo",
                  "Powered by Auth0 Token Vault",
                  "Open source — MIT License"
               ].map((text, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                     <Check size={16} style={{ color: 'var(--green)' }} /> {text}
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 px-6" style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
         <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">
            <div>
               <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--purple)' }}>
                  <Shield size={20} fill="currentColor" fillOpacity={0.2} />
                  <span className="font-logo text-xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, var(--purple), var(--purple-light))' }}>VaultProxy</span>
               </div>
               <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Secure middleware for AI agents.</p>
               <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Built for Auth0 Authorized to Act Hackathon 2026</p>
               
               <div className="flex gap-4">
                  <a href="#" className="transition-colors hover:text-[var(--purple)]" style={{ color: 'var(--text-muted)' }}><Code size={20} /></a>
                  <a href="#" className="transition-colors hover:text-[var(--purple)]" style={{ color: 'var(--text-muted)' }}><Globe size={20} /></a>
               </div>
            </div>

            <div>
               <h4 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Product</h4>
               <div className="flex flex-col gap-3">
                  {["Dashboard", "Run Agent", "Approvals", "Token Vault", "Audit Logs"].map((link, i) => (
                     <a key={i} href="#" className="text-sm transition-colors hover:text-[var(--purple)]" style={{ color: 'var(--text-secondary)' }}>{link}</a>
                  ))}
               </div>
            </div>

            <div>
               <h4 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Built With</h4>
               <div className="flex flex-col gap-3">
                  {[
                     { i: Shield, t: "Auth0 Token Vault" },
                     { i: Zap, t: "Next.js 16" },
                     { i: Terminal, t: "TypeScript" },
                     { i: Layers, t: "Tailwind CSS" }
                  ].map((x, i) => (
                     <div key={i} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <x.i size={14} className="shrink-0" /> {x.t}
                     </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="max-w-6xl mx-auto mt-12 pt-8 flex flex-wrap justify-between gap-4" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>© 2026 VaultProxy. MIT License.</p>
            <p className="text-sm flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
               Made with <Heart size={14} fill="#ef4444" color="#ef4444" /> for the Auth0 Hackathon
            </p>
         </div>
      </footer>
    </div>
  );
}
