'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Package,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Camera,
  Calendar,
  Code2,
  ExternalLink,
  Sparkles,
  Lock,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';

export default function KeptApp() {
  // Start with null so initial landing is clean, spacious, and idle (like Relayeo)
  const [activeScenario, setActiveScenario] = useState<'compat' | 'return' | 'unverified' | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mcpTrace, setMcpTrace] = useState<any>(null);
  const [showTraceDrawer, setShowTraceDrawer] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [showDecisionReceipt, setShowDecisionReceipt] = useState(false);

  // DOM Refs for Apple-grade smooth auto-scroll
  const resultsRef = useRef<HTMLDivElement>(null);
  const bentoGridRef = useRef<HTMLDivElement>(null);

  // Scenario 1 state (Compatibility check)
  const [compatResult, setCompatResult] = useState<any>(null);

  // Scenario 2 state (Order #842 multi-item resolution)
  const [returnPlan, setReturnPlan] = useState<any>(null);
  const [kettleAction, setKettleAction] = useState<'REPLACEMENT_FOR_DAMAGE' | 'RETURN_FOR_REFUND'>('REPLACEMENT_FOR_DAMAGE');
  const [sweaterAction, setSweaterAction] = useState<'RETURN_FOR_REFUND' | 'REPLACEMENT_FOR_DAMAGE'>('RETURN_FOR_REFUND');
  const [userConfirmedApproval, setUserConfirmedApproval] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [novaObservation, setNovaObservation] = useState<any>(null);

  // Level B: Custom Scenario Sandbox state
  const [showCustomSandbox, setShowCustomSandbox] = useState(false);
  const [customTitle, setCustomTitle] = useState('Normcore 54mm Bottomless Portafilter (3 Ears)');
  const [customCategory, setCustomCategory] = useState('Kitchen Appliances');
  const [customDiameter, setCustomDiameter] = useState('54');
  const [customEars, setCustomEars] = useState('3');
  const [customRestockingFee, setCustomRestockingFee] = useState('0');
  const [customTermsStated, setCustomTermsStated] = useState(true);
  const [customIsThirdParty, setCustomIsThirdParty] = useState(false);

  // Load inventory on mount, but DO NOT run any scenario yet!
  useEffect(() => {
    fetchInventory();
  }, []);

  // Apple-grade smooth auto-scroll down to results when active scenario changes
  useEffect(() => {
    if (activeScenario && resultsRef.current) {
      const timer = setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeScenario, compatResult, returnPlan]);

  // Clean dismiss and smooth return to the Bento overview
  function dismissScenario() {
    setActiveScenario(null);
    setCompatResult(null);
    setReturnPlan(null);
    setExecutionResult(null);
    setTimeout(() => {
      bentoGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }

  async function fetchInventory() {
    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'get_household_inventory', arguments: {} }),
      });
      const data = await res.json();
      if (data?.content?.[0]?.text) {
        const parsed = JSON.parse(data.content[0].text);
        setInventory(parsed.items || []);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  }

  async function resetDemo() {
    setLoading(true);
    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'reset_demo_state', arguments: {} }),
      });
      const data = await res.json();
      setMcpTrace({ tool: 'reset_demo_state', response: data });
      setActiveScenario(null);
      setExecutionResult(null);
      setReturnPlan(null);
      setCompatResult(null);
      setUserConfirmedApproval(false);
      setNovaObservation(null);
      await fetchInventory();
    } finally {
      setLoading(false);
    }
  }

  // Trigger Scenario 1: Compatibility Block
  async function triggerScenario1() {
    setActiveScenario('compat');
    setLoading(true);
    setExecutionResult(null);
    try {
      const candidate = {
        title: 'MATOW 58mm Bottomless Portafilter with Walnut Handle (2 Ears)',
        category: 'Kitchen Appliances',
        targetSpecs: { portafilterSizeMm: 58, earCount: 2 },
        sellerPolicy: { isThirdParty: true, restockingFeePercent: 15, returnWindowDays: 30, termsExplicitlyStated: true },
      };

      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'check_purchase_compatibility',
          arguments: { candidate },
        }),
      });
      const data = await res.json();
      const parsed = JSON.parse(data.content[0].text);
      setCompatResult(parsed);
      setMcpTrace({ tool: 'check_purchase_compatibility', input: { candidate }, output: parsed });
    } finally {
      setLoading(false);
    }
  }

  // Trigger Scenario 2: Multi-Item Return Resolution (Order #842)
  async function triggerScenario2() {
    setActiveScenario('return');
    setLoading(true);
    setExecutionResult(null);
    setUserConfirmedApproval(false);
    try {
      // Step A: Call Bedrock Nova visual inspection on kettle
      const novaRes = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'analyze_item_condition',
          arguments: { itemId: 'item_trial_kettle_03' },
        }),
      });
      const novaData = await novaRes.json();
      const parsedNova = JSON.parse(novaData.content[0].text);
      setNovaObservation(parsedNova.inspection);

      // Step B: Build consolidated return plan for both kettle and sweater
      const planRes = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'build_return_plan',
          arguments: {
            itemIds: ['item_trial_kettle_03', 'item_trial_sweater_04'],
            userActions: {
              item_trial_kettle_03: kettleAction,
              item_trial_sweater_04: sweaterAction,
            },
          },
        }),
      });
      const planData = await planRes.json();
      const parsedPlan = JSON.parse(planData.content[0].text);
      setReturnPlan(parsedPlan);

      setMcpTrace({
        workflow: 'multi_item_order_842_resolution',
        novaVisionCall: parsedNova,
        builtPlan: parsedPlan,
      });
    } finally {
      setLoading(false);
    }
  }

  // Trigger Scenario 3: Epistemic Honesty Refusal
  async function triggerScenario3() {
    setActiveScenario('unverified');
    setLoading(true);
    setExecutionResult(null);
    try {
      const candidate = {
        title: 'Universal Custom Espresso Dosing Ring & Needle Distribution Collar Tool',
        category: 'Kitchen Appliances',
        targetSpecs: {}, // Missing dimensions!
        sellerPolicy: { isThirdParty: true, termsExplicitlyStated: false },
      };

      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'check_purchase_compatibility',
          arguments: { candidate },
        }),
      });
      const data = await res.json();
      const parsed = JSON.parse(data.content[0].text);
      setCompatResult(parsed);
      setMcpTrace({ tool: 'check_purchase_compatibility', input: { candidate }, output: parsed });
    } finally {
      setLoading(false);
    }
  }

  // Trigger Custom Scenario Sandbox
  async function triggerCustomScenario() {
    setActiveScenario('compat');
    setLoading(true);
    setExecutionResult(null);
    try {
      const targetSpecs: Record<string, any> = {};
      if (customDiameter.trim()) {
        targetSpecs.portafilterSizeMm = parseFloat(customDiameter.trim());
      }
      if (customEars.trim()) {
        targetSpecs.earCount = parseInt(customEars.trim(), 10);
      }

      const candidate = {
        title: customTitle.trim() || 'Custom Tested Product',
        category: customCategory,
        targetSpecs: Object.keys(targetSpecs).length > 0 ? targetSpecs : {},
        sellerPolicy: {
          isThirdParty: customIsThirdParty,
          restockingFeePercent: parseFloat(customRestockingFee) || 0,
          termsExplicitlyStated: customTermsStated,
        },
      };

      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'check_purchase_compatibility',
          arguments: { candidate },
        }),
      });
      const data = await res.json();
      const parsed = JSON.parse(data.content[0].text);
      setCompatResult(parsed);
      setMcpTrace({ tool: 'check_purchase_compatibility', input: { candidate }, output: parsed });
    } finally {
      setLoading(false);
    }
  }

  // Approve & Execute Plan
  async function executeApprovedPlan() {
    if (!returnPlan || !userConfirmedApproval) return;
    setLoading(true);
    try {
      const approveRes = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'approve_return_plan',
          arguments: { planId: returnPlan.planId, userConfirmed: true },
        }),
      });
      const approvedData = await approveRes.json();
      const approvedPlan = JSON.parse(approvedData.content[0].text);

      const execRes = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'execute_return_plan',
          arguments: {
            planId: returnPlan.planId,
            authorizationToken: approvedPlan.authorizationToken,
          },
        }),
      });
      const execData = await execRes.json();
      const finalResult = JSON.parse(execData.content[0].text);
      setExecutionResult(finalResult);
      setMcpTrace({
        stage: 'authorization_and_execution',
        approvalResponse: approvedPlan,
        executionResult: finalResult,
      });
      await fetchInventory();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-obsidian-900 bg-glow-radial text-slate-100 flex flex-col font-sans pb-14">
      {/* Seamless Unified Top Navigation Bar */}
      <header className="w-full bg-transparent">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 pt-4 pb-2">
          {/* Left: Apple-grade Kept Brand Mark */}
          <div className="flex items-center gap-2.5 group cursor-default">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-b from-white/[0.14] to-white/[0.04] p-[1px] shadow-[0_2px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.25)] ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-105">
              <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-obsidian-950/90 backdrop-blur-md">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <defs>
                    <linearGradient id="kept-spine-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#00F0FF" />
                      <stop offset="100%" stopColor="#00A3FF" />
                    </linearGradient>
                    <linearGradient id="kept-arm-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00F0FF" />
                      <stop offset="100%" stopColor="#00E599" />
                    </linearGradient>
                  </defs>
                  {/* Anchor Pillar */}
                  <path d="M7.5 5.5v13" stroke="url(#kept-spine-grad)" />
                  {/* Right-Facing Forward Progress Arrow */}
                  <path d="M8 6.5L16.5 12L8 17.5" stroke="url(#kept-arm-grad)" />
                </svg>
              </div>
            </div>
            <span className="font-semibold tracking-tight text-white text-base">Kept</span>
          </div>

          {/* Right: Solid Emerald CTA */}
          <div className="flex items-center">
            <button
              onClick={() => setShowTraceDrawer(!showTraceDrawer)}
              className="rounded-full bg-accent-emerald px-4 py-1.5 text-xs font-bold text-obsidian-950 hover:brightness-110 transition-all shadow-md shadow-accent-emerald/25 flex items-center gap-1.5"
            >
              <Code2 className="h-3.5 w-3.5" />
              {showTraceDrawer ? 'Hide Trace' : 'Inspect MCP'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Naturally Filling Viewport */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 sm:pt-8 pb-12 flex flex-col items-center">
        {/* Category Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-accent-cyan/30 bg-accent-cyan/10 px-4 py-1.5 text-xs font-semibold text-accent-cyan tracking-wide mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan"></span>
          Alexa+ Commerce Guard
        </div>

        {/* Hero Title: Large, Commanding Display Scale Across 2 Lines */}
        <div className="text-center max-w-4xl mb-8 sm:mb-9">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.06] mb-3 text-white">
            Zero-Regret Orders.
            <br />
            <span className="bg-gradient-to-r from-accent-cyan via-accent-mint to-accent-emerald bg-clip-text text-transparent">
              Zero-Friction Returns.
            </span>
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-normal mt-4">
            Checks compatibility before you buy. Handles returns and replacements after they arrive.
          </p>
        </div>

        {/* Interactive Main Action Input Bar: Dynamically Synced with Active Scenario */}
        <div className="w-full max-w-lg mb-9 sm:mb-10">
          <div className="flex items-center justify-between rounded-full border border-white/10 bg-obsidian-800/80 p-2 shadow-xl backdrop-blur-xl hover:border-white/20 transition-all">
            <div className="flex items-center gap-2.5 pl-4 flex-1 min-w-0">
              <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                activeScenario === 'unverified'
                  ? 'bg-accent-amber animate-pulse'
                  : activeScenario === 'compat'
                  ? 'bg-accent-coral animate-pulse'
                  : 'bg-accent-emerald animate-pulse'
              }`}></span>
              <div className="flex items-center gap-2 truncate">
                <span className="text-sm font-semibold text-slate-200 shrink-0">
                  {activeScenario === 'unverified'
                    ? 'unverified-seller.test'
                    : activeScenario === 'compat'
                    ? '58mm-portafilter.fit'
                    : 'household-842'}
                </span>
                <span className="text-xs text-slate-400 font-mono truncate">
                  {activeScenario === 'unverified'
                    ? '• Universal Espresso Tool (Missing Specs)'
                    : activeScenario === 'compat'
                    ? '• Breville 54mm Spec Conflict'
                    : '• 4 items synced'}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                if (activeScenario === 'unverified') triggerScenario3();
                else if (activeScenario === 'compat') triggerScenario1();
                else triggerScenario2();
              }}
              disabled={loading}
              className={`rounded-full px-5 py-2 text-xs font-bold text-obsidian-950 hover:brightness-110 transition-all shadow-md flex items-center gap-1.5 shrink-0 disabled:opacity-50 ${
                activeScenario === 'unverified'
                  ? 'bg-gradient-to-r from-accent-amber to-amber-500 shadow-accent-amber/20'
                  : activeScenario === 'compat'
                  ? 'bg-gradient-to-r from-accent-cyan to-accent-coral shadow-accent-coral/20'
                  : 'bg-gradient-to-r from-accent-cyan to-accent-emerald shadow-accent-cyan/20'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Auditing...
                </>
              ) : (
                <>
                  {activeScenario === 'unverified'
                    ? 'Test Refusal ⟳'
                    : activeScenario === 'compat'
                    ? 'Check Fit ⟳'
                    : 'Check Orders ⟳'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Benchmark Scenario Section Label */}
        <div className="w-full max-w-4xl mb-4 flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Benchmark Demo Scenarios
          </span>
          <span className="text-xs font-mono text-slate-500">
            Click to test live MCP guardrails
          </span>
        </div>

        {/* Benchmark Scenario Bento Grid */}
        <div ref={bentoGridRef} className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Bento 1: Pre-Purchase Compatibility */}
          <div
            onClick={triggerScenario1}
            className={`group cursor-pointer rounded-2xl border p-6 sm:p-7 transition-all duration-300 backdrop-blur-xl flex flex-col justify-between min-h-[200px] relative ${
              activeScenario === 'compat'
                ? 'border-accent-cyan bg-obsidian-800/95 shadow-[0_0_35px_rgba(0,212,255,0.25)] ring-2 ring-accent-cyan/80 scale-[1.02]'
                : 'border-white/10 bg-obsidian-800/50 hover:border-white/20 hover:bg-obsidian-800/80 hover:translate-y-[-1px]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="whitespace-nowrap shrink-0 rounded-full border border-accent-cyan/30 bg-accent-cyan/10 px-2.5 py-0.5 text-[10px] font-semibold text-accent-cyan flex items-center gap-1.5">
                  {activeScenario === 'compat' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan animate-ping" />
                  )}
                  SPEC CHECK
                </span>
                <span className="whitespace-nowrap shrink-0 text-xs font-mono text-slate-500">Breville 54mm</span>
              </div>
              <h3 className="font-bold text-white text-base mb-2 group-hover:text-accent-cyan transition-colors">
                58mm-portafilter.fit
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Stops ordering 58mm portafilter for 54mm machine and flags 15% restocking fee.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-accent-cyan">
              <span>Test Incompatible Fit</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Bento 2: Multi-Item Order #842 Resolution */}
          <div
            onClick={triggerScenario2}
            className={`group cursor-pointer rounded-2xl border p-6 sm:p-7 transition-all duration-300 backdrop-blur-xl flex flex-col justify-between min-h-[200px] relative ${
              activeScenario === 'return'
                ? 'border-accent-emerald bg-obsidian-800/95 shadow-[0_0_35px_rgba(0,229,153,0.25)] ring-2 ring-accent-emerald/80 scale-[1.02]'
                : 'border-white/10 bg-obsidian-800/50 hover:border-white/20 hover:bg-obsidian-800/80 hover:translate-y-[-1px]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="whitespace-nowrap shrink-0 rounded-full border border-accent-emerald/30 bg-accent-emerald/10 px-2.5 py-0.5 text-[10px] font-semibold text-accent-emerald flex items-center gap-1.5">
                  {activeScenario === 'return' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald animate-ping" />
                  )}
                  ORDER #842
                </span>
                <span className="whitespace-nowrap shrink-0 text-xs font-mono text-slate-500">Bedrock Nova</span>
              </div>
              <h3 className="font-bold text-white text-base mb-2 group-hover:text-accent-emerald transition-colors">
                order-842.resolve
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inspects kettle crack via Nova Vision and routes 1-trip Whole Foods return.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-accent-emerald">
              <span>Resolve Order #842</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Bento 3: Epistemic Honesty Refusal */}
          <div
            onClick={triggerScenario3}
            className={`group cursor-pointer rounded-2xl border p-6 sm:p-7 transition-all duration-300 backdrop-blur-xl flex flex-col justify-between min-h-[200px] relative ${
              activeScenario === 'unverified'
                ? 'border-accent-amber bg-obsidian-800/95 shadow-[0_0_35px_rgba(245,158,11,0.25)] ring-2 ring-accent-amber/80 scale-[1.02]'
                : 'border-white/10 bg-obsidian-800/50 hover:border-white/20 hover:bg-obsidian-800/80 hover:translate-y-[-1px]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="whitespace-nowrap shrink-0 rounded-full border border-accent-amber/30 bg-accent-amber/10 px-2.5 py-0.5 text-[10px] font-semibold text-accent-amber flex items-center gap-1.5">
                  {activeScenario === 'unverified' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-amber animate-ping" />
                  )}
                  SAFE STOP
                </span>
                <span className="whitespace-nowrap shrink-0 text-xs font-mono text-slate-500">Missing Specs</span>
              </div>
              <h3 className="font-bold text-white text-base mb-2 group-hover:text-accent-amber transition-colors">
                unverified-seller.test
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Halts checkout when 3rd-party listing lacks millimeter dimensions.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-accent-amber">
              <span>Test Refusal Guard</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Level B: "Try Your Own Scenario" Sleek Bar */}
        <div className="w-full max-w-4xl mb-8">
          <div
            onClick={() => setShowCustomSandbox(!showCustomSandbox)}
            className={`group cursor-pointer rounded-2xl border transition-all duration-300 backdrop-blur-xl p-4 sm:p-4.5 flex items-center justify-between relative overflow-hidden ${
              showCustomSandbox
                ? 'border-accent-cyan/60 bg-obsidian-800/90 shadow-[0_0_30px_rgba(0,212,255,0.15)] ring-1 ring-accent-cyan/50'
                : 'border-white/10 bg-gradient-to-r from-obsidian-800/60 via-obsidian-800/40 to-obsidian-800/60 hover:border-accent-cyan/40 hover:bg-obsidian-800/80 hover:shadow-[0_4px_25px_rgba(0,0,0,0.4)]'
            }`}
          >
            {/* Subtle Accent Glow on Left Edge */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-cyan via-accent-mint to-accent-emerald opacity-60 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center gap-3.5 pl-1.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-emerald/10 border border-accent-cyan/30 text-accent-cyan group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] transition-all">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white tracking-tight group-hover:text-accent-cyan transition-colors">
                    Test your own product specification
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan font-medium">
                    Sandbox
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Input custom millimeter dimensions and seller fees to evaluate live MCP guardrails.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                showCustomSandbox
                  ? 'bg-white/10 text-slate-200 border border-white/20 hover:bg-white/15'
                  : 'bg-gradient-to-r from-accent-cyan to-accent-emerald text-obsidian-950 hover:brightness-110 shadow-accent-cyan/20'
              }`}>
                <span>{showCustomSandbox ? 'Close Sandbox' : 'Try →'}</span>
                {showCustomSandbox ? (
                  <ChevronUp className="h-3.5 w-3.5 transition-transform" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 group-hover:translate-y-0.5 transition-transform" />
                )}
              </span>
            </div>
          </div>

          {/* Expandable Custom Testing Workbench */}
          {showCustomSandbox && (
            <div className="mt-4 rounded-2xl border border-accent-cyan/30 bg-obsidian-900/90 p-6 backdrop-blur-2xl shadow-2xl space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-accent-cyan flex items-center gap-2">
                  <Code2 className="h-4 w-4" /> Custom Product Pre-Purchase Evaluator
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Target Host: Breville Barista Express (BES870XL • 54mm)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Candidate Title */}
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Candidate Product Title</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Normcore 54mm Bottomless Portafilter"
                    className="w-full rounded-xl border border-white/10 bg-obsidian-950 px-3.5 py-2 text-white placeholder-slate-600 focus:border-accent-cyan focus:outline-none"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Product Category</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-obsidian-950 px-3.5 py-2 text-white focus:border-accent-cyan focus:outline-none"
                  >
                    <option value="Kitchen Appliances">Kitchen Appliances (Espresso / Appliances)</option>
                    <option value="Electronics & Office">Electronics & Office (Cables / Displays)</option>
                    <option value="Automotive">Automotive (Unrelated Category Test)</option>
                  </select>
                </div>

                {/* Diameter */}
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">
                    Stated Diameter (mm) <span className="text-slate-500 font-mono text-[10px]">(leave blank to test Epistemic Safe Stop)</span>
                  </label>
                  <input
                    type="text"
                    value={customDiameter}
                    onChange={(e) => setCustomDiameter(e.target.value)}
                    placeholder="54 (compatible) or 58 (conflict) or blank (refusal)"
                    className="w-full rounded-xl border border-white/10 bg-obsidian-950 px-3.5 py-2 text-white placeholder-slate-600 focus:border-accent-cyan focus:outline-none font-mono"
                  />
                </div>

                {/* Ear Count */}
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">
                    Locking Ear Count <span className="text-slate-500 font-mono text-[10px]">(Breville uses 3 ears)</span>
                  </label>
                  <input
                    type="text"
                    value={customEars}
                    onChange={(e) => setCustomEars(e.target.value)}
                    placeholder="3 (compatible) or 2 (incompatible)"
                    className="w-full rounded-xl border border-white/10 bg-obsidian-950 px-3.5 py-2 text-white placeholder-slate-600 focus:border-accent-cyan focus:outline-none font-mono"
                  />
                </div>

                {/* Restocking Fee */}
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Seller Restocking Fee (%)</label>
                  <input
                    type="number"
                    value={customRestockingFee}
                    onChange={(e) => setCustomRestockingFee(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-white/10 bg-obsidian-950 px-3.5 py-2 text-white placeholder-slate-600 focus:border-accent-cyan focus:outline-none font-mono"
                  />
                </div>

                {/* Seller Policy Checkboxes */}
                <div className="flex flex-col justify-end gap-2 pb-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={customIsThirdParty}
                      onChange={(e) => setCustomIsThirdParty(e.target.checked)}
                      className="rounded border-white/20 bg-obsidian-950 text-accent-cyan focus:ring-accent-cyan"
                    />
                    <span>Third-Party Marketplace Seller</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={customTermsStated}
                      onChange={(e) => setCustomTermsStated(e.target.checked)}
                      className="rounded border-white/20 bg-obsidian-950 text-accent-cyan focus:ring-accent-cyan"
                    />
                    <span>Return terms explicitly stated by seller</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="text-slate-500">Quick Test Cases:</span>
                  <button
                    onClick={() => {
                      setCustomTitle('CAPMESSO 54mm Bottomless Portafilter (3 Ears)');
                      setCustomDiameter('54');
                      setCustomEars('3');
                      setCustomRestockingFee('0');
                      setCustomIsThirdParty(false);
                      setCustomTermsStated(true);
                    }}
                    className="text-accent-emerald hover:underline font-mono"
                  >
                    [Compatible 54mm]
                  </button>
                  <button
                    onClick={() => {
                      setCustomTitle('MATOW 58mm Bottomless Portafilter (2 Ears)');
                      setCustomDiameter('58');
                      setCustomEars('2');
                      setCustomRestockingFee('15');
                      setCustomIsThirdParty(true);
                      setCustomTermsStated(true);
                    }}
                    className="text-accent-coral hover:underline font-mono"
                  >
                    [Conflict 58mm + 15%]
                  </button>
                  <button
                    onClick={() => {
                      setCustomTitle('Universal Custom Espresso Dosing Tool');
                      setCustomDiameter('');
                      setCustomEars('');
                      setCustomRestockingFee('0');
                      setCustomIsThirdParty(true);
                      setCustomTermsStated(false);
                    }}
                    className="text-accent-amber hover:underline font-mono"
                  >
                    [Missing Specs Refusal]
                  </button>
                </div>

                <button
                  onClick={triggerCustomScenario}
                  disabled={loading}
                  className="rounded-full bg-gradient-to-r from-accent-cyan to-accent-emerald px-6 py-2.5 text-xs font-bold text-obsidian-950 hover:brightness-110 transition-all shadow-md shadow-accent-cyan/20 flex items-center gap-2 disabled:opacity-50 shrink-0"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Evaluating...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5" /> Run Live Guardrail Audit
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Audit & Execution Stage Header (Visible when a scenario is active) */}
        {activeScenario && (
          <div ref={resultsRef} className="w-full max-w-3xl mb-4 scroll-mt-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className={`flex h-2 w-2 rounded-full animate-pulse ${
                  activeScenario === 'unverified'
                    ? 'bg-accent-amber'
                    : activeScenario === 'compat'
                    ? 'bg-accent-coral'
                    : 'bg-accent-emerald'
                }`}></span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Live Audit & Protocol Evidence
                </span>
              </div>
              <button
                onClick={dismissScenario}
                className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10"
              >
                Dismiss Result ✕
              </button>
            </div>
          </div>
        )}



        {/* Scenario 1: Compatibility Incompatible Block */}
        {activeScenario === 'compat' && compatResult && (
          <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-obsidian-800/80 p-8 sm:p-10 backdrop-blur-xl shadow-2xl transition-all space-y-6">
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 rounded-full bg-accent-coral animate-ping"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-accent-coral">
                  ● Compatibility Conflict • Action Blocked Before Checkout
                </span>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400 font-mono">
                {compatResult.originLabel}
              </span>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{compatResult.candidateTitle}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{compatResult.reason}</p>
              </div>

              {/* Mismatched Attributes Table */}
              {compatResult.mismatchedAttributes && (
                <div className="rounded-2xl border border-white/5 bg-obsidian-950/60 p-5 space-y-3">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Specification Dimension Delta
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-slate-400 font-medium">Attribute</div>
                    <div className="text-accent-emerald font-semibold">Owned (Breville BES870XL)</div>
                    <div className="text-accent-coral font-semibold">Candidate Item</div>
                    {compatResult.mismatchedAttributes.map((m: any, idx: number) => (
                      <React.Fragment key={idx}>
                        <div className="text-slate-300 py-2 border-t border-white/5">{m.attribute}</div>
                        <div className="text-accent-emerald py-2 border-t border-white/5 font-mono">{m.ownedValue}</div>
                        <div className="text-accent-coral py-2 border-t border-white/5 font-mono">{m.candidateValue}</div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Seller Restocking Warning */}
              {compatResult.sellerRiskWarning && (
                <div className="flex items-start gap-3 rounded-2xl border border-accent-amber/30 bg-accent-amber/10 p-5 text-xs text-accent-amber">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Third-Party Seller Penalty Trap: </span>
                    {compatResult.sellerRiskWarning}
                  </div>
                </div>
              )}

              {/* Verified Alternative */}
              {compatResult.recommendedAlternative && (
                <div className="rounded-2xl border border-accent-cyan/30 bg-accent-cyan/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-accent-cyan uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" /> Verified Compatible Alternative
                    </div>
                    <div className="font-semibold text-white text-sm">
                      {compatResult.recommendedAlternative.title}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {compatResult.recommendedAlternative.verifiedSpec} • {compatResult.recommendedAlternative.returnPolicySummary}
                    </div>
                  </div>
                  <button className="shrink-0 rounded-full bg-accent-cyan px-5 py-2.5 text-xs font-bold text-obsidian-950 hover:brightness-110 transition-all">
                    Swap to Verified Match
                  </button>
                </div>
              )}
            </div>

            {/* Verifiable Decision Receipt (Expandable) */}
            <div className="rounded-2xl border border-white/10 bg-obsidian-950/70 overflow-hidden">
              <button
                onClick={() => setShowDecisionReceipt(!showDecisionReceipt)}
                className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors border-b border-white/5"
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-accent-cyan" />
                  Verifiable Decision Receipt • Audit Provenance
                </span>
                <span className="flex items-center gap-1.5 text-slate-500 font-normal text-[11px]">
                  {showDecisionReceipt ? 'Hide Receipt' : 'Inspect Receipt'}
                  {showDecisionReceipt ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </span>
              </button>

              {showDecisionReceipt && (
                <div className="p-5 space-y-3 text-xs font-mono text-slate-300 border-t border-white/5 bg-black/40">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-white/5">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Evaluation Request</span>
                      <span className="text-slate-200">Pre-Purchase Fit Check</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Household Ground Truth</span>
                      <span className="text-accent-emerald font-semibold">Breville BES870XL (54mm / 3-Ear)</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-white/5">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Enforced Rule</span>
                      <span className="text-accent-coral">RULE_DIMENSION_MISMATCH (54mm != 58mm)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Third-Party Risk Trap</span>
                      <span className="text-accent-amber">15% Restocking Fee On Open Accessory</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Data Provenance</span>
                      <span className="text-slate-400">Breville BES870XL Manual p.28 + Listing Spec</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Pre-Checkout Decision</span>
                      <span className="text-accent-coral font-bold">BLOCKED • PREVENTED WRONG ORDER</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>Source Citation: {compatResult.sourceEvidence}</span>
              <span className="text-accent-emerald font-semibold">Prevented 1 Incompatible Order</span>
            </div>
          </div>
        )}

        {/* Scenario 2: Multi-Item Return Resolution (Order #842) */}
        {activeScenario === 'return' && returnPlan && (
          <div className="w-full max-w-3xl space-y-8">
            <div className="rounded-3xl border border-white/10 bg-obsidian-800/80 p-8 sm:p-10 backdrop-blur-xl shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-accent-amber animate-pulse"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-accent-amber">
                    ● Audit Complete • 2 Items In 30-Day Trial Window
                  </span>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400 font-mono">
                  {returnPlan.originLabel}
                </span>
              </div>

              {/* Items Cards with High Contrast & Visual Hierarchy */}
              <div className="space-y-6">
                {/* Item 1: Kettle */}
                <div className="rounded-2xl border border-white/10 bg-obsidian-950/60 p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <span className="inline-block rounded-full bg-accent-coral/15 border border-accent-coral/30 px-3 py-0.5 text-xs font-semibold text-accent-coral mb-2">
                        Damaged Item Observed
                      </span>
                      <h4 className="font-bold text-white text-lg">Cosori Electric Gooseneck Glass Kettle 0.8L</h4>
                      <p className="text-xs text-slate-400">Order #ORDER-842-OCT2026 • Delivered Oct 18 (28d remaining in trial)</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs shrink-0">
                      <button
                        onClick={() => setKettleAction('REPLACEMENT_FOR_DAMAGE')}
                        className={`rounded-full px-3.5 py-1.5 font-semibold transition-all border ${
                          kettleAction === 'REPLACEMENT_FOR_DAMAGE'
                            ? 'border-accent-cyan bg-accent-cyan/20 text-accent-cyan'
                            : 'border-white/10 bg-white/5 text-slate-400'
                        }`}
                      >
                        Replace for Damage
                      </button>
                      <button
                        onClick={() => setKettleAction('RETURN_FOR_REFUND')}
                        className={`rounded-full px-3.5 py-1.5 font-semibold transition-all border ${
                          kettleAction === 'RETURN_FOR_REFUND'
                            ? 'border-accent-cyan bg-accent-cyan/20 text-accent-cyan'
                            : 'border-white/10 bg-white/5 text-slate-400'
                        }`}
                      >
                        Refund Only
                      </button>
                    </div>
                  </div>

                  {/* Bedrock Nova Visual Observation Card */}
                  {novaObservation && (
                    <div className="rounded-xl border border-accent-cyan/30 bg-accent-cyan/5 p-4 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-accent-cyan flex items-center gap-1.5">
                          <Camera className="h-3.5 w-3.5" /> Amazon Bedrock Nova Multimodal Visual Observation
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                            novaObservation.isLiveAwsCall
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-white/5 border-white/10 text-slate-400'
                          }`}>
                            {novaObservation.isLiveAwsCall ? 'Live AWS Bedrock' : 'Disclosed Local Grounding'}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">{novaObservation.latencyMs}ms</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-mono">
                        {novaObservation.summary}
                      </p>
                      {novaObservation.missingPartsNoted?.length > 0 && (
                        <div className="text-xs text-accent-amber flex items-center gap-1.5 font-medium">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          <span>Check: {novaObservation.missingPartsNoted.join(', ')} not in photo—pack base to avoid deduction.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Item 2: Sweater */}
                <div className="rounded-2xl border border-white/10 bg-obsidian-950/60 p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <span className="inline-block rounded-full bg-accent-emerald/15 border border-accent-emerald/30 px-3 py-0.5 text-xs font-semibold text-accent-emerald mb-2">
                        Pristine Tags Attached
                      </span>
                      <h4 className="font-bold text-white text-lg">State Cashmere 100% Pure Merino Wool Turtleneck (Medium)</h4>
                      <p className="text-xs text-slate-400">Order #ORDER-842-OCT2026 • Delivered Oct 18 (28d remaining in trial)</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs shrink-0">
                      <button
                        onClick={() => setSweaterAction('RETURN_FOR_REFUND')}
                        className={`rounded-full px-3.5 py-1.5 font-semibold transition-all border ${
                          sweaterAction === 'RETURN_FOR_REFUND'
                            ? 'border-accent-cyan bg-accent-cyan/20 text-accent-cyan'
                            : 'border-white/10 bg-white/5 text-slate-400'
                        }`}
                      >
                        Return for Refund
                      </button>
                      <button
                        onClick={() => setSweaterAction('REPLACEMENT_FOR_DAMAGE')}
                        className={`rounded-full px-3.5 py-1.5 font-semibold transition-all border ${
                          sweaterAction === 'REPLACEMENT_FOR_DAMAGE'
                            ? 'border-accent-cyan bg-accent-cyan/20 text-accent-cyan'
                            : 'border-white/10 bg-white/5 text-slate-400'
                        }`}
                      >
                        Size Exchange
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    Policy Grounding: Item matches Amazon Fashion apparel returns criteria; eligible for box-free, label-free drop-off at Whole Foods customer desk with original hangtags attached.
                  </div>
                </div>

                {/* Consolidated Drop-off Pathway Box */}
                <div className="rounded-2xl border border-accent-emerald/30 bg-accent-emerald/10 p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-accent-emerald flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> Proposed Single-Trip Consolidation
                    </span>
                    <span className="text-xs font-semibold text-slate-200">0 Boxes • 0 Labels Needed</span>
                  </div>
                  <div className="text-base font-bold text-white">
                    {returnPlan.consolidatedTripSummary.suggestedLocation}
                  </div>
                  <p className="text-xs text-slate-300">
                    Both items share Whole Foods Market as an eligible drop-off route. Consolidates 2 separate carrier drop-offs into 1 trip. Requires customer authorization to generate digital return pass.
                  </p>
                </div>
              </div>

              {/* Server-Side Cryptographic Approval Gate */}
              <div className="pt-6 border-t border-white/10 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userConfirmedApproval}
                    onChange={(e) => setUserConfirmedApproval(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-obsidian-950 text-accent-cyan focus:ring-accent-cyan"
                  />
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <span className="font-bold text-white">Customer Authorization Confirmation: </span>
                    I confirm the proposed actions (1 replacement for damaged kettle, 1 refund for sweater) and authorize Kept to issue a cryptographically signed plan token.
                  </div>
                </label>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <button
                    onClick={executeApprovedPlan}
                    disabled={!userConfirmedApproval || loading || executionResult !== null}
                    className="w-full sm:w-auto rounded-full bg-gradient-to-r from-accent-cyan to-accent-emerald px-8 py-3 text-xs font-bold text-obsidian-950 hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-accent-cyan/20 flex items-center justify-center gap-2"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    {executionResult ? 'Authorization Bound & Plan Prepared' : 'Approve & Issue Server-Bound Authorization'}
                  </button>

                  {/* Calendar export is gated strictly on confirmed plan readiness */}
                  {executionResult ? (
                    <a
                      href={`/api/calendar?deadline=${returnPlan.calendarDeadline}&location=${encodeURIComponent(
                        returnPlan.consolidatedTripSummary.suggestedLocation
                      )}`}
                      download="kept-return-deadline.ics"
                      className="flex items-center gap-1.5 text-xs text-accent-cyan hover:underline py-2 font-semibold"
                    >
                      <Calendar className="h-3.5 w-3.5" /> Download .ics Calendar Reminder
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500 flex items-center gap-1.5 py-2">
                      <Calendar className="h-3.5 w-3.5 opacity-40" /> Calendar export available upon approval
                    </span>
                  )}
                </div>
              </div>

              {/* Verifiable Decision Receipt for Scenario 2 (Expandable) */}
              <div className="rounded-2xl border border-white/10 bg-obsidian-950/70 overflow-hidden">
                <button
                  onClick={() => setShowDecisionReceipt(!showDecisionReceipt)}
                  className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors border-b border-white/5"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-accent-emerald" />
                    Verifiable Decision Receipt • Order #842 Provenance
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-500 font-normal text-[11px]">
                    {showDecisionReceipt ? 'Hide Receipt' : 'Inspect Receipt'}
                    {showDecisionReceipt ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </span>
                </button>

                {showDecisionReceipt && (
                  <div className="p-5 space-y-3 text-xs font-mono text-slate-300 border-t border-white/5 bg-black/40">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-white/5">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Evaluation Request</span>
                        <span className="text-slate-200">Consolidated Resolution (Order #842)</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Household Items In Scope</span>
                        <span className="text-accent-emerald font-semibold">2 Delivered Items (Kettle + Sweater)</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-white/5">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Multimodal Vision Engine</span>
                        <span className={novaObservation?.isLiveAwsCall ? 'text-emerald-400' : 'text-slate-400'}>
                          {novaObservation?.isLiveAwsCall ? 'Live AWS Bedrock (Nova Vision)' : 'Disclosed Grounded Defect Model'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Observed Evidence</span>
                        <span className="text-accent-amber">Handle crack detected; power base missing</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Authorization Status</span>
                        <span className={executionResult ? 'text-accent-emerald font-bold' : 'text-slate-400'}>
                          {executionResult ? 'HMAC-SHA256 Signed & Bound' : 'Pending Customer Checkbox Approval'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Drop-Off Destination</span>
                        <span className="text-white">Whole Foods Market (Box-Free / Label-Free)</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Verified: Amazon Std Small Appliance & Fashion Return Terms</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Execution Confirmation Card with Masked Token */}
            {executionResult && (
              <div className="rounded-3xl border border-accent-emerald/40 bg-accent-emerald/10 p-6 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-accent-emerald" />
                  <h4 className="font-bold text-white text-base">Plan Authorized & Prepared on MCP Server</h4>
                </div>
                <div className="space-y-2 text-xs text-slate-300 font-mono">
                  <div>Status: <span className="text-accent-emerald font-bold">RETURN_PREPARED</span></div>
                  <div>Plan Hash: <span className="text-slate-400">{executionResult.plan.planHash?.slice(0, 16)}... (SHA-256 Verified)</span></div>
                  <div>Authorization Status: <span className="text-accent-cyan">Cryptographically Signed (auth_plan_••••••••)</span></div>
                  <div>Lifecycle State: Household records updated to <span className="text-accent-emerald font-semibold">RETURN_PREPARED</span></div>
                  <div className="pt-2 text-[11px] text-slate-400 font-sans">
                    Digital return pass generated. Present QR code at Whole Foods Customer Service desk.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scenario 3: Epistemic Honesty / Missing Specs Refusal */}
        {activeScenario === 'unverified' && compatResult && (
          <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-obsidian-800/80 p-8 sm:p-10 backdrop-blur-xl shadow-2xl transition-all space-y-6">
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-accent-amber animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-accent-amber">
                  ● Epistemic Honesty Guardrail • Refusal to Hallucinate Missing Specs
                </span>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400 font-mono">
                {compatResult.originLabel}
              </span>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{compatResult.candidateTitle}</h3>
                <p className="text-sm text-slate-300 leading-relaxed font-mono bg-obsidian-950/60 p-5 rounded-2xl border border-white/5">
                  {compatResult.reason}
                </p>
              </div>

              {compatResult.sellerRiskWarning && (
                <div className="flex items-start gap-3 rounded-2xl border border-accent-coral/30 bg-accent-coral/10 p-5 text-xs text-accent-coral">
                  <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Unverified Seller Terms: </span>
                    {compatResult.sellerRiskWarning}
                  </div>
                </div>
              )}
            </div>

            {/* Verifiable Decision Receipt for Scenario 3 (Expandable) */}
            <div className="rounded-2xl border border-white/10 bg-obsidian-950/70 overflow-hidden">
              <button
                onClick={() => setShowDecisionReceipt(!showDecisionReceipt)}
                className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors border-b border-white/5"
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-accent-amber" />
                  Verifiable Decision Receipt • Epistemic Guardrail Provenance
                </span>
                <span className="flex items-center gap-1.5 text-slate-500 font-normal text-[11px]">
                  {showDecisionReceipt ? 'Hide Receipt' : 'Inspect Receipt'}
                  {showDecisionReceipt ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </span>
              </button>

              {showDecisionReceipt && (
                <div className="p-5 space-y-3 text-xs font-mono text-slate-300 border-t border-white/5 bg-black/40">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-white/5">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Evaluation Request</span>
                      <span className="text-slate-200">Pre-Purchase Fit Check</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Candidate Item</span>
                      <span className="text-white">Universal Dosing Ring & Needle Collar</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-white/5">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Target Listing Data</span>
                      <span className="text-accent-amber">Omits Millimeter Collar Diameter</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Guardrail Enforced</span>
                      <span className="text-accent-coral font-semibold">REFUSAL_TO_HALLUCINATE</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Data Provenance</span>
                      <span className="text-slate-400">Merchant Page Inspection (Unverified 3rd-Party)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Decision Outcome</span>
                      <span className="text-accent-amber font-bold">SAFE STOP • ZERO-ASSUMPTION BOUNDARY</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>Source: {compatResult.sourceEvidence}</span>
              <span className="text-accent-amber font-semibold">Safe Stop Enforced</span>
            </div>
          </div>
        )}
      </main>

      {/* Sleek Refined Utility Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500/80 font-normal border-t border-white/5 pt-5">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-400/90">Kept</span>
          <span className="text-slate-600/60">•</span>
          <span>Alexa+ Commerce Guard</span>
        </div>

        <div>
          <span>Amazon Developer Hackathon 2026</span>
        </div>
      </footer>

      {/* Slide-out MCP Trace & Sources Drawer */}
      {showTraceDrawer && (
        <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] border-l border-white/10 bg-obsidian-950/95 p-6 backdrop-blur-2xl overflow-y-auto shadow-2xl flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-accent-cyan" />
              <span className="font-bold text-white text-sm">Live MCP Protocol Trace & Sources</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={resetDemo}
                disabled={loading}
                className="text-xs text-accent-cyan hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                Reset State
              </button>
              <button
                onClick={() => setShowTraceDrawer(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>

          <div className="space-y-4 text-xs font-mono text-slate-300 flex-1">
            <div className="rounded-xl border border-white/5 bg-obsidian-900 p-3">
              <div className="text-accent-cyan font-bold mb-1">MCP Streamable HTTP Endpoint</div>
              <div className="text-slate-400">POST http://localhost:3001/mcp</div>
              <div className="text-slate-400">Protocol Spec: 2025-11-25</div>
            </div>

            <div className="rounded-xl border border-white/5 bg-obsidian-900 p-3">
              <div className="text-accent-emerald font-bold mb-1">Active JSON-RPC Payload</div>
              <pre className="overflow-x-auto text-[11px] text-slate-300">
                {JSON.stringify(mcpTrace, null, 2)}
              </pre>
            </div>

            <div className="rounded-xl border border-white/5 bg-obsidian-900 p-3">
              <div className="text-accent-amber font-bold mb-1">Seeded Household Ledger State</div>
              <pre className="overflow-x-auto text-[11px] text-slate-400">
                {JSON.stringify({ householdId: 'HOUSEHOLD-842', totalItems: inventory.length }, null, 2)}
              </pre>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
