"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  ShieldAlert,
  Zap,
  Check,
  X,
  Sun,
  Moon,
  Sparkles,
  PenLine,
  Key,
  Eye,
  ArrowRight,
  Terminal,
  Lock,
  Search,
  Activity,
  Fingerprint,
  Workflow,
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
  const [terminalLines, setTerminalLines] = useState<{ prefix: string; text: string; color: string }[]>([]);
  const [scrolled, setScrolled] = useState(false);

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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div className={`min-h-screen landing-page-wrapper w-full overflow-x-hidden flex flex-col ${isDark ? "dark" : ""}`}>
      {/* ANNOUNCEMENT */}
      {announcementVisible && (
        <div className="w-full h-10 flex shrink-0 items-center justify-center bg-purple-600 text-white text-xs font-bold z-50 sticky top-0 tracking-widest uppercase">
          <Sparkles size={14} className="mr-2" />
          VaultProxy &mdash; The Zero-Trust Protocol for AI Agents
          <button onClick={() => setAnnouncementVisible(false)} className="absolute right-4 opacity-70 hover:opacity-100 transition-opacity"><X size={16} /></button>
        </div>
      )}

      {/* NAVIGATION */}
      <nav className={`fixed w-full h-20 z-40 transition-all duration-500 ${scrolled ? 'backdrop-blur-xl border-b border-[var(--border)] bg-[var(--bg-primary)]/80' : ''}`} style={{ top: announcementVisible ? '40px' : '0' }}>
        <div className="max-w-7xl mx-auto h-full px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Shield size={22} className="text-white" />
             </div>
             <span className="text-2xl font-extrabold tracking-tighter text-[var(--text-primary)] font-syne">VaultProxy</span>
          </div>
          
          <div className="hidden md:flex items-center gap-10">
             {["Architecture", "Security", "How it Works"].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`} className="text-sm font-semibold text-[var(--text-secondary)] hover:text-purple-500 transition-colors uppercase tracking-widest">{item}</a>
             ))}
          </div>

          <div className="flex items-center gap-6">
            <button onClick={toggleTheme} className="p-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-all">
               {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600" />}
            </button>
            <a href="/dashboard" className="px-6 py-3 rounded-xl bg-purple-600 text-white font-bold text-sm shadow-xl shadow-purple-500/10 hover:scale-105 transition-transform active:scale-95">
               Launch Protocol
            </a>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section id="hero" className="relative min-h-screen pt-40 pb-20 flex flex-col items-center justify-center px-8 grid-bg shrink-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="z-10 text-center max-w-5xl flex flex-col items-center">
          <div className="px-5 py-2 rounded-full border border-purple-500/30 bg-purple-500/5 text-purple-400 text-xs font-black uppercase tracking-[0.3em] mb-10 animate-float flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            Authorized To Act &mdash; Hackathon 2026
          </div>
          
          <h1 className="text-6xl md:text-9xl font-extrabold mb-10 leading-[0.9] tracking-tighter text-[var(--text-primary)] font-syne">
            AI Action,<br/>
            <span className="italic font-normal opacity-50">Zero</span> <span className="gradient-text">Trust.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-[var(--text-secondary)] mb-14 max-w-3xl leading-relaxed font-medium">
             A high-performance middleware for identity-aware AI Agents. 
             Isolate <span className="text-purple-400">OAuth tokens</span> in the Auth0 Vault and never let agents touch raw credentials.
          </p>

          <div className="flex flex-wrap gap-5 mb-24 justify-center">
            <a href="/auth/login" className="px-10 py-5 rounded-2xl bg-purple-600 text-white font-black text-lg shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all flex items-center gap-3">
               Start Securing Agents <ArrowRight size={20} />
            </a>
            <a href="#" className="px-10 py-5 rounded-2xl border-2 border-[var(--border)] font-bold text-lg hover:bg-[var(--bg-secondary)] hover:border-purple-500/50 transition-all text-[var(--text-primary)]">
               Read Security Audit
            </a>
          </div>

          {/* TERMINAL UI */}
          <div className="w-full max-w-4xl rounded-3xl overflow-hidden border border-[var(--border)] shadow-3xl bg-[#08080c] relative group hover:scale-[1.01] transition-transform">
            <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors pointer-events-none" />
            <div className="h-14 bg-[#12121e] px-8 flex items-center justify-between border-b border-white/5">
               <div className="flex gap-2.5">
                 <div className="w-3.5 h-3.5 rounded-full bg-red-500/40" />
                 <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/40" />
                 <div className="w-3.5 h-3.5 rounded-full bg-green-500/40" />
               </div>
               <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500 font-bold">
                  <Terminal size={12} /> vault_proxy_runtime // status: active
               </div>
               <div className="w-20" />
            </div>
            <div className="p-10 font-mono text-sm md:text-base text-slate-400 min-h-[280px] text-left leading-relaxed">
               {terminalLines.map((line, i) => (
                 <div key={i} className="mb-2 reveal">
                   <span style={{ color: line.color }} className="mr-5 opacity-70">{line.prefix}</span>
                   <span className="text-[var(--text-primary)]">{line.text}</span>
                 </div>
               ))}
               <div className="mt-2 text-purple-500/50 flex items-center gap-2">
                  <span className="w-2 h-4 bg-purple-500 animate-pulse" />
                  <span className="text-xs uppercase tracking-widest font-bold">Awaiting Input...</span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ATTACK SURFACE SECTION */}
      <section id="architecture" className="py-40 w-full max-w-7xl mx-auto px-8 reveal shrink-0">
        <div className="text-center mb-24">
           <span className="text-xs font-black text-rose-500 uppercase tracking-[0.4em] mb-6 block">Defense Architecture</span>
           <h2 className="text-4xl md:text-6xl font-black font-syne mb-10 leading-tight">Eliminate The Attack Surface</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-10">
          <div className="p-12 rounded-[2.5rem] bg-rose-500/5 border border-rose-500/10 group hover:border-rose-500/30 transition-all relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/10 blur-[50px] rounded-full" />
            <ShieldOff className="text-rose-500 mb-10" size={48} strokeWidth={1.5} />
            <h3 className="text-3xl font-bold mb-8 font-syne">The Vulnerable Route</h3>
            <div className="p-6 rounded-2xl bg-black/60 font-mono text-xs text-rose-400 mb-10 border border-rose-500/20 leading-loose">
              <span className="opacity-40"># Memory Dump // Leak detected</span><br/>
              Authorization: Bearer <span className="px-1 bg-rose-500/20 rounded">ya29.a0AfH6SMB...</span><br/>
              <span className="text-rose-600 mt-2 block">Critical: Token exposed in plaintext environment</span>
            </div>
            <ul className="space-y-6 text-lg font-medium text-[var(--text-secondary)]">
               <li className="flex gap-4 items-center"><X size={20} className="text-rose-500 flex-shrink-0" /> Long-lived raw tokens in memory</li>
               <li className="flex gap-4 items-center"><X size={20} className="text-rose-500 flex-shrink-0" /> Zero control after agent assignment</li>
               <li className="flex gap-4 items-center"><X size={20} className="text-rose-500 flex-shrink-0" /> Lateral movement via stolen keys</li>
            </ul>
          </div>

          <div className="p-12 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/10 group hover:border-emerald-500/30 transition-all relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 blur-[50px] rounded-full" />
            <ShieldCheck className="text-emerald-500 mb-10" size={48} strokeWidth={1.5} />
            <h3 className="text-3xl font-bold mb-8 font-syne">The VaultProxy Way</h3>
             <div className="p-6 rounded-2xl bg-black/60 font-mono text-xs text-emerald-400 mb-10 border border-emerald-500/20 leading-loose">
              <span className="opacity-40"># Scoped Proxy // Secure Handshake</span><br/>
              X-Vault-Sig: <span className="px-1 bg-emerald-500/20 rounded">sha256_v2_7c3a...</span><br/>
              <span className="text-emerald-500 mt-2 block italic">Success: Ephemeral session active</span>
            </div>
            <ul className="space-y-6 text-lg font-medium text-[var(--text-secondary)]">
               <li className="flex gap-4 items-center"><Check size={20} className="text-emerald-500 flex-shrink-0" /> Tokens strictly isolated in Auth0</li>
               <li className="flex gap-4 items-center"><Check size={20} className="text-emerald-500 flex-shrink-0" /> Dynamic single-use token injection</li>
               <li className="flex gap-4 items-center"><Check size={20} className="text-emerald-500 flex-shrink-0" /> Real-time revocation of all sessions</li>
            </ul>
          </div>
        </div>
      </section>

      {/* METRICS SHOWDOWN */}
      <section className="py-32 bg-[var(--bg-secondary)] border-y border-[var(--border)] shrink-0">
         <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-16">
            {[
               { icon: Activity, label: "Real-time Monitoring", value: "24/7" },
               { icon: Lock, label: "Token Exposure", value: "0.0%" },
               { icon: Search, label: "Audit Resolution", value: "100%" },
               { icon: Globe, label: "Edge Propagation", value: "<10ms" }
            ].map((m, i) => (
               <div key={i} className="flex flex-col items-center text-center reveal">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center mb-8 shadow-inner">
                     <m.icon className="text-purple-500" size={28} />
                  </div>
                  <div className="text-5xl font-black font-syne mb-3 text-[var(--text-primary)]">{m.value}</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">{m.label}</div>
               </div>
            ))}
         </div>
      </section>

      {/* HOW IT WORKS DYNAMIC */}
      <section id="how-it-works" className="py-40 w-full reveal shrink-0 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-8">
           <div className="text-center max-w-3xl mx-auto mb-32">
              <span className="text-xs font-black text-purple-500 uppercase tracking-[0.4em] mb-6 block">Pipeline Workflow</span>
              <h2 className="text-4xl md:text-7xl font-black font-syne mb-10 leading-tight">Orchestrated Security</h2>
              <p className="text-xl text-[var(--text-secondary)]">A three-stage defense protocol protecting your digital identity from automated agent exploits.</p>
           </div>

           <div className="grid md:grid-cols-3 gap-12 relative">
             <div className="hidden lg:block absolute top-[120px] left-[15%] w-[70%] h-0.5 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent -z-10" />
             
             {[
               { step: "01", title: "Secure Handshake", icon: Key, color: "var(--purple)", desc: "Users link OAuth connections via Auth0. The master tokens remain encrypted in the manage-vault." },
               { step: "02", title: "Intent Interception", icon: Workflow, color: "#f59e0b", desc: "Our engine parses the agent's intent, scoring it against historical risk patterns and user policies." },
               { step: "03", title: "Single-Action Auth", icon: Zap, color: "#10b981", desc: "Upon approval or MFA, a temporary token is pulled from the vault, used once, and instantly discarded." }
             ].map((item, i) => (
                <div key={i} className="group relative">
                   <div className="p-12 rounded-[3rem] bg-[var(--bg-card)] border border-[var(--border)] hover:border-purple-500/50 transition-all hover:-translate-y-2 h-full flex flex-col items-center text-center">
                     <div className="w-20 h-20 rounded-[2rem] bg-[var(--bg-primary)] border border-white/5 flex items-center justify-center mb-10 shadow-2xl group-hover:scale-110 transition-transform">
                        <item.icon size={32} style={{ color: item.color }} />
                     </div>
                     <span className="text-6xl font-black opacity-5 absolute top-10 right-12 group-hover:opacity-10 transition-opacity font-syne">{item.step}</span>
                     <h3 className="text-2xl font-bold mb-6 font-syne">{item.title}</h3>
                     <p className="text-[var(--text-secondary)] leading-relaxed font-medium">{item.desc}</p>
                   </div>
                </div>
             ))}
           </div>
        </div>
      </section>

      {/* TRUST TIERS SECTION */}
      <section id="security" className="py-40 w-full max-w-7xl mx-auto px-8 reveal shrink-0">
        <div className="flex flex-col md:flex-row items-end justify-between mb-24 gap-10">
           <div className="max-w-2xl">
              <span className="text-xs font-black text-emerald-500 uppercase tracking-[0.4em] mb-6 block">Permission Matrix</span>
              <h2 className="text-4xl md:text-7xl font-black font-syne leading-[0.95] text-[var(--text-primary)]">The Anatomy of a Trust Tier</h2>
           </div>
           <div className="px-6 py-3 rounded-2xl bg-purple-600/10 border border-purple-500/20 text-purple-400 text-sm font-bold flex items-center gap-3">
              <Activity size={18} /> Engine V3.2 Active
           </div>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
           {[
             { title: "Read Intelligence", badge: "Non-Intrusive", icon: Eye, color: "#3b82f6", desc: "Safe contextual fetching like email summaries or calendar views. Executes immediately via the edge proxy." },
             { title: "Write Permission", badge: "Quarantined", icon: PenLine, color: "#f59e0b", desc: "Mutating actions like sending messages or posting updates. Pauses for human confirmation in the dashboard." },
             { title: "Destructive Flow", badge: "Hard-Locked", icon: ShieldAlert, color: "#ef4444", desc: "High-stakes deletions or data transfers. Triggers an Auth0 MFA Challenge to prove physical presence." }
           ].map((tier, i) => (
             <div key={i} className="rounded-[2.5rem] border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden transition-all hover:border-[var(--purple)] group">
                <div className="h-2 w-full" style={{ background: tier.color }} />
                <div className="p-12">
                   <div className="w-16 h-16 rounded-2xl bg-[var(--bg-primary)] flex items-center justify-center mb-8 border border-white/5">
                      <tier.icon size={32} style={{ color: tier.color }} />
                   </div>
                   <h3 className="text-2xl font-black mb-3 font-syne">{tier.title}</h3>
                   <div className="inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-10 bg-white/5 border border-white/10" style={{ color: tier.color }}>{tier.badge}</div>
                   <p className="text-lg text-[var(--text-secondary)] leading-relaxed font-medium mb-12">{tier.desc}</p>
                   
                   <div className="pt-10 border-t border-white/5">
                      <div className="flex items-center gap-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
                         <Fingerprint size={16} /> Verified By Vault
                      </div>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </section>

      {/* FINAL CTA ENHANCED */}
      <section className="py-60 w-full relative overflow-hidden bg-black shrink-0">
         <div className="absolute inset-0 grid-bg opacity-20" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-purple-600/10 blur-[160px] rounded-full pointer-events-none" />
         
         <div className="relative z-10 max-w-5xl mx-auto px-8 text-center flex flex-col items-center">
           <Sparkles className="text-purple-500 mb-10 animate-float" size={64} />
           <h2 className="text-5xl md:text-9xl font-black mb-14 font-syne leading-[0.8] tracking-tighter text-white">Stop Leaking<br/><span className="text-purple-600">Digital Identity.</span></h2>
           <p className="text-xl md:text-2xl mb-16 font-medium text-slate-400 max-w-3xl leading-relaxed">
              Deploy the Agent Control Center in under 60 seconds and experience the zero-trust revolution.
           </p>
           <div className="flex flex-col md:flex-row gap-6">
              <a href="/auth/login" className="px-14 py-7 rounded-[2rem] bg-white text-black font-black text-xl hover:scale-105 transition-all shadow-4xl flex items-center gap-4">
                 Get Instant Access <ArrowRight size={24} />
              </a>
              <div className="px-10 py-7 rounded-[2rem] border border-white/10 text-white font-bold text-lg flex items-center gap-4 bg-white/5 backdrop-blur-xl">
                 <div className="flex items-center -space-x-4">
                    {[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-slate-800" />)}
                 </div>
                 <span className="text-sm">Trusted by 10k+ Agents</span>
              </div>
           </div>
         </div>
      </section>

      {/* PREMIUM FOOTER */}
      <footer className="py-24 border-t border-[var(--border)] px-8 grid md:grid-cols-2 gap-20 items-center justify-between shrink-0 bg-[#06060a]">
         <div className="flex flex-col gap-6 items-start">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                  <Shield size={18} className="text-white" />
               </div>
               <span className="text-xl font-black font-syne text-[var(--text-primary)]">VaultProxy</span>
            </div>
            <p className="text-sm text-[var(--text-muted)] font-medium max-w-xs">
               Securing the intersection of Artificial Intelligence and Digital Identity.
            </p>
            <div className="font-bold opacity-30 uppercase tracking-[0.3em] text-[10px]">
               &copy; 2026 &mdash; Built for the Auth0 Global Hackathon
            </div>
         </div>

         <div className="flex flex-wrap justify-center md:justify-end gap-16">
           <div className="flex flex-col gap-5">
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Open Source</span>
              <div className="flex flex-col gap-3">
                 {["GitHub Repository", "MIT License", "Security.md"].map(t => <a key={t} href="#" className="text-sm font-medium text-[var(--text-muted)] hover:text-white transition-colors">{t}</a>)}
              </div>
           </div>
           <div className="flex flex-col gap-5">
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Developer</span>
              <div className="flex flex-col gap-3">
                 {["Documentation", "API Reference", "Architecture"].map(t => <a key={t} href="#" className="text-sm font-medium text-[var(--text-muted)] hover:text-white transition-colors">{t}</a>)}
              </div>
           </div>
         </div>
      </footer>
    </div>
  );
}
