"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Bell,
  User,
  History,
  BarChart,
  Bot,
  AlertTriangle,
  ArrowRight,
  Lock,
  FileText,
  Activity,
  UserCheck
} from "lucide-react";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', color: '#cbd5e1', width: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── TopAppBar ────────────────────────────────────────────────────────── */}
      <header 
        style={{ 
          position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 100, height: '80px',
          backgroundColor: scrolled ? 'rgba(10, 10, 15, 0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(10px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : 'none',
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '-1px', color: '#fff', textTransform: 'uppercase', fontFamily: '"Syne", sans-serif' }}>
              VaultProxy
            </span>
            <nav className="hidden md:flex" style={{ gap: '24px' }}>
              <Link href="/dashboard" style={{ color: '#a78bfa', borderBottom: '2px solid #8b5cf6', fontSize: '14px', fontWeight: 500, height: '80px', display: 'flex', alignItems: 'center' }}>Terminal</Link>
              <Link href="/dashboard/agents" className="hover:text-white" style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 500, height: '80px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}>Agents</Link>
              <Link href="/dashboard/audit" className="hover:text-white" style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 500, height: '80px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}>Audit Log</Link>
              <Link href="/dashboard/policies" className="hover:text-white" style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 500, height: '80px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}>Policies</Link>
            </nav>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button style={{ color: '#a78bfa', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}>
              <Shield size={20} />
            </button>
            <button style={{ color: '#a78bfa', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}>
              <Bell size={20} />
            </button>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(124, 58, 237, 0.2)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              <User size={16} />
            </div>
          </div>
        </div>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', width: '100%', alignContent: 'center' }}>
        
        {/* ── Hero Section ────────────────────────────────────────────────────── */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '180px', paddingBottom: '100px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '99px', backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '32px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#4cd7f6', borderRadius: '50%', boxShadow: '0 0 8px #4cd7f6' }}></div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold', color: '#4cd7f6' }}>System Online</span>
              <span className="hidden md:inline" style={{ fontSize: '12px', color: '#94a3b8', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '12px', marginLeft: '4px' }}>v2.4.0 Deployment</span>
            </div>
            
            <h1 className="font-syne" style={{ fontSize: 'clamp(40px, 8vw, 88px)', fontWeight: 800, letterSpacing: '-2px', color: '#fff', marginBottom: '32px', lineHeight: 1.1 }}>
              AI Agents Shouldn&apos;t Have <br/>
              <span style={{ backgroundImage: 'linear-gradient(to right, #a78bfa, #4cd7f6)', WebkitBackgroundClip: 'text', color: 'transparent' }}>Permanent Access</span>
            </h1>
            
            <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '640px', margin: '0 auto 48px auto', lineHeight: 1.6 }}>
              VaultProxy creates a secure air-gap between your sensitive APIs and autonomous agents. Just-In-Time credentials, real-time human verification, and forensic audit logs.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'row', gap: '16px', marginBottom: '80px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/api/auth/login" style={{ padding: '16px 32px', backgroundColor: '#7c3aed', color: '#fff', fontWeight: 'bold', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                Start Secure <ArrowRight size={16} />
              </Link>
              <Link href="/demo" style={{ padding: '16px 32px', backgroundColor: '#111118', color: '#fff', fontWeight: 'bold', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '14px', textDecoration: 'none' }}>
                View Demo
              </Link>
            </div>
            
            {/* Dashboard Preview Component */}
            <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', borderRadius: '16px', padding: '24px', backgroundColor: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.4)' }}></div>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.4)' }}></div>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.4)' }}></div>
                </div>
                <div style={{ marginLeft: '16px', padding: '4px 12px', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.4)', fontSize: '10px', fontFamily: 'monospace', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={10} /> https://vault.proxy/terminal
                </div>
              </div>
              <div style={{ borderRadius: '8px', backgroundColor: '#050508', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', fontFamily: 'monospace', fontSize: '14px', color: '#cbd5e1', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#a78bfa' }}>❯</span>
                  <span style={{ color: '#94a3b8' }}>agent.run(&quot;Delete all drafts&quot;)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.7 }}>
                  <span style={{ color: '#64748b' }}>·</span>
                  <span style={{ color: '#64748b' }}>Analyzing intent...</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                  <AlertTriangle size={14} style={{ color: '#ef4444' }} />
                  <span style={{ color: '#f87171' }}>HIGH RISK: DESTRUCTIVE ACTION (gmail.delete)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '4px', marginTop: '8px' }}>
                  <Lock size={14} style={{ color: '#f87171' }} />
                  <span style={{ color: '#fca5a5', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px' }}>Awaiting 2FA / Passkey Verification...</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* ── Problem Section ─────────────────────────────────────────────────── */}
        <div style={{ width: '100%', backgroundColor: '#050508', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '100px 0' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', width: '100%' }}>
            <div className="grid lg:grid-cols-2 gap-16" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '64px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ color: '#f87171', fontFamily: '"Syne", sans-serif', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={16} /> Security Threat Analysis
                </div>
                <h2 className="font-syne" style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 'bold', color: '#fff', marginBottom: '32px', lineHeight: 1.2 }}>
                  The Hidden Risk of <br/>AI Automation
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '18px', marginBottom: '40px', lineHeight: 1.6 }}>
                  Traditional API keys are static. When you give an AI Agent a key, you&apos;re giving it permanent, unmonitored access to your most sensitive data. One prompt injection could compromise your entire infrastructure.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', gap: '16px', padding: '20px', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444' }}>
                    <AlertTriangle style={{ color: '#ef4444', flexShrink: 0, marginTop: '4px' }} size={24} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}>Static Key Exposure</h4>
                      <p style={{ fontSize: '14px', color: 'rgba(248, 113, 113, 0.8)', lineHeight: 1.6, margin: 0 }}>API keys stored in agent memory are vulnerable to extraction via clever prompting.</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', padding: '20px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', borderLeft: '4px solid #f59e0b' }}>
                    <Bot style={{ color: '#f59e0b', flexShrink: 0, marginTop: '4px' }} size={24} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}>Unbounded Execution</h4>
                      <p style={{ fontSize: '14px', color: 'rgba(251, 146, 60, 0.8)', lineHeight: 1.6, margin: 0 }}>Agents can perform destructive actions recursively without intermediate approval.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', width: '100%' }}>
                <div style={{ backgroundColor: '#0f0f1a', padding: '32px', borderRadius: '24px', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', flexDirection: 'column', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: '#ef4444', letterSpacing: '2px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.8 }}>
                        <div style={{ width: '6px', height: '6px', backgroundColor: '#ef4444', borderRadius: '50%' }}></div> Alert: Unauthorized Call
                      </div>
                      <h4 className="font-syne" style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', margin: 0 }}>Injection Detected</h4>
                    </div>
                    <Shield size={36} style={{ color: '#ef4444', opacity: 0.8 }} strokeWidth={1.5} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                    <div style={{ height: '6px', width: '100%', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '99px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ height: '100%', backgroundColor: '#ef4444', width: '98%', boxShadow: '0 0 10px #ef4444' }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8' }}>
                      <span>THREAT LEVEL: CRITICAL</span>
                      <span style={{ color: '#f87171' }}>98.2% CONFIDENCE</span>
                    </div>
                  </div>
                  
                  <div style={{ backgroundColor: '#050508', padding: '20px', borderRadius: '12px', fontFamily: 'monospace', fontSize: '12px', color: 'rgba(248, 113, 113, 0.9)', border: '1px solid rgba(239, 68, 68, 0.2)', lineHeight: 1.6, display: 'flex', flexDirection: 'column' }}>
                    <span><span style={{ color: '#64748b' }}>&gt; Agent attempted to:</span> <span style={{ color: '#fff' }}>&quot;DELETE FROM users WHERE admin = true&quot;</span></span>
                    <span style={{ marginTop: '16px' }}><span style={{ color: '#64748b' }}>&gt; Analysis:</span> Malicious Intent Detected</span>
                    <span style={{ marginTop: '8px' }}><span style={{ color: '#64748b' }}>&gt; Action:</span> <span style={{ fontWeight: 'bold', backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: '4px 8px', borderRadius: '4px', color: '#fca5a5' }}>REQUEST QUARANTINED</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Solution Section (Bento Grid) ──────────────────────────────────────── */}
        <div style={{ width: '100%', padding: '100px 0' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '80px', maxWidth: '768px', margin: '0 auto 80px auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h2 className="font-syne" style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 'bold', color: '#fff', marginBottom: '24px' }}>Zero-Trust for AI Agents</h2>
              <p style={{ color: '#94a3b8', fontSize: '18px', margin: 0 }}>VaultProxy sits between your AI and your infrastructure, enforcing strict security protocols for every single request.</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', width: '100%' }}>
              
              <div style={{ backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.05)', padding: '40px', borderRadius: '24px', display: 'flex', flexDirection: 'column' }}>
                <History style={{ color: '#a78bfa', marginBottom: '24px' }} size={40} strokeWidth={1.5} />
                <h3 className="font-syne" style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginBottom: '16px' }}>JIT Access Control</h3>
                <p style={{ color: '#94a3b8', marginBottom: 'auto', lineHeight: 1.6 }}>Credentials are generated on-the-fly and expire immediately after the AI task is completed. No more permanent keys living in agent logs.</p>
              </div>
              
              <div style={{ backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.05)', padding: '40px', borderRadius: '24px', display: 'flex', flexDirection: 'column' }}>
                <UserCheck style={{ color: '#4cd7f6', marginBottom: '24px' }} size={40} strokeWidth={1.5} />
                <h3 className="font-syne" style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginBottom: '16px' }}>Human-in-the-loop</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6 }}>High-risk actions require one-tap approval from a mobile device (2FA/MFA) before the agent can proceed.</p>
              </div>
              
              <div style={{ backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.05)', padding: '40px', borderRadius: '24px', display: 'flex', flexDirection: 'column' }}>
                <BarChart style={{ color: '#fb923c', marginBottom: '24px' }} size={40} strokeWidth={1.5} />
                <h3 className="font-syne" style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginBottom: '16px' }}>Risk Permissions</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6 }}>Automatically escalate security requirements based on the predicted impact of the agent&apos;s request using our intent parser.</p>
              </div>
              
              <div style={{ backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.05)', padding: '40px', borderRadius: '24px', display: 'flex', flexDirection: 'column' }}>
                <FileText style={{ color: '#a78bfa', marginBottom: '24px' }} size={40} strokeWidth={1.5} />
                <h3 className="font-syne" style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', marginBottom: '16px' }}>Full Forensic Audit</h3>
                <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: '24px' }}>Every prompt intent and API call made by your AI is recorded, correlated, and stored in an immutable ledger for compliance.</p>
                <div style={{ backgroundColor: '#0a0a0f', borderRadius: '12px', padding: '20px', fontFamily: 'monospace', fontSize: '10px', color: 'rgba(196, 181, 253, 0.8)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '12px', fontWeight: 'bold', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)' }}>LOG_ID: 982-PX</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ACT:</span><span style={{ color: '#cbd5e1' }}>gmail.send</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>SIG:</span><span style={{ color: '#4cd7f6', fontWeight: 'bold' }}>VERIFIED_MFA</span></div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── Final CTA ──────────────────────────────────────────────────────── */}
        <div style={{ width: '100%', paddingBottom: '100px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', width: '100%' }}>
            <div style={{ width: '100%', borderRadius: '40px', backgroundColor: '#111118', padding: '80px 48px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h2 className="font-syne" style={{ fontSize: 'clamp(32px, 5vw, 60px)', fontWeight: 'bold', color: '#fff', marginBottom: '32px', lineHeight: 1.2 }}>Ready to Secure Your <br/>Agentic Future?</h2>
              <p style={{ color: '#94a3b8', fontSize: '18px', marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px auto' }}>
                Join advanced security teams who are building the next generation of AI products with deterministic safety.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '24px', width: '100%' }}>
                <Link href="/api/auth/login" style={{ padding: '20px 40px', backgroundColor: '#fff', color: '#000', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '14px', textDecoration: 'none' }}>
                  Launch Console <ArrowRight size={16} />
                </Link>
                <Link href="/dashboard/audit" style={{ padding: '20px 40px', backgroundColor: '#0a0a0f', color: '#fff', fontWeight: 'bold', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '14px', textDecoration: 'none' }}>
                  View Audit Logs
                </Link>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
