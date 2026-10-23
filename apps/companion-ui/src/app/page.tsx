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
    <div className="min-h-screen bg-obsidian-900 bg-glow-radial text-slate-100 flex flex-col font-sans pb-2">
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
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 sm:pt-6 pb-4 flex flex-col justify-center items-center">
        {/* Category Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-accent-cyan/30 bg-accent-cyan/10 px-4 py-1.5 text-xs font-semibold text-accent-cyan tracking-wide mb-5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan"></span>
          KEPT — FOR ALEXA+
        </div>

        {/* Hero Title: Large, Commanding Display Scale Across 2 Lines */}
        <div className="text-center max-w-4xl mb-7 sm:mb-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] mb-3.5 text-white">
            Your home, remembered.
            <br />
            <span className="bg-gradient-to-r from-accent-cyan via-accent-mint to-accent-emerald bg-clip-text text-transparent">
              Your purchases, better informed.
            </span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-normal mt-3">
            Kept connects what you own with what you&apos;re considering buying and what needs attention after delivery.
          </p>
        </div>

        {/* Persistent Household Context Indicator Bar (Non-decorative status indicators) */}
        <div className="w-full max-w-4xl mb-7 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-white/10 bg-obsidian-800/75 px-4 py-2.5 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="h-2 w-2 rounded-full bg-accent-cyan"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Your Household (#842)
              </span>
              <span className="text-[11px] text-slate-500 font-mono hidden md:inline">
                • {inventory.length || 4} synced items
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
              {/* Indicator 1: Owned Equipment Context */}
              <div
                className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition-all duration-300 cursor-default ${
                  activeScenario === 'compat'
                    ? 'border-accent-cyan/70 bg-accent-cyan/15 text-white shadow-[0_0_20px_rgba(0,212,255,0.2)]'
                    : activeScenario === 'unverified'
                    ? 'border-accent-amber/70 bg-accent-amber/15 text-white shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                    : 'border-white/10 bg-white/[0.03] text-slate-300'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    activeScenario === 'compat'
                      ? 'bg-accent-cyan animate-ping'
                      : activeScenario === 'unverified'
                      ? 'bg-accent-amber animate-ping'
                      : 'bg-slate-400'
                  }`}
                />
                <span className="font-semibold text-white">Breville Barista Express</span>
                <span className="text-[11px] text-slate-400 font-mono">Owned · 54 mm fit</span>
              </div>

              {/* Indicator 2: Recent Order Context */}
              <div
                className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition-all duration-300 cursor-default ${
                  activeScenario === 'return'
                    ? 'border-accent-emerald/70 bg-accent-emerald/15 text-white shadow-[0_0_20px_rgba(0,229,153,0.2)]'
                    : 'border-white/10 bg-white/[0.03] text-slate-300'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    activeScenario === 'return'
                      ? 'bg-accent-emerald animate-ping'
                      : 'bg-slate-400'
                  }`}
                />
                <span className="font-semibold text-white">Order #842 (Kettle &amp; Sweater)</span>
                <span className="text-[11px] text-slate-400 font-mono">Delivered · 28d return window</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coherent Household Progression Section Label */}
        <div className="w-full max-w-4xl mb-3.5 flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            How Your Household Context Helps
          </span>
          <span className="text-xs text-slate-500">
            Select a scenario to see Kept in action
          </span>
        </div>

        {/* Coherent 3-Step Bento Grid: 1. Before Buying -> 2. Missing Info -> 3. After Delivery */}
        <div ref={bentoGridRef} className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          {/* Card 1: Before Buying (Check compatibility against what you own) */}
          <div
            onClick={triggerScenario1}
            className={`group cursor-pointer rounded-2xl border p-5 sm:p-6 transition-all duration-300 backdrop-blur-xl flex flex-col justify-between min-h-[190px] relative ${
              activeScenario === 'compat'
                ? 'border-accent-cyan bg-obsidian-800/95 shadow-[0_0_35px_rgba(0,212,255,0.25)] ring-2 ring-accent-cyan/80 scale-[1.01]'
                : 'border-white/10 bg-obsidian-800/50 hover:border-white/20 hover:bg-obsidian-800/80 hover:translate-y-[-1px]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3.5">
                <span className="whitespace-nowrap shrink-0 rounded-full border border-accent-cyan/30 bg-accent-cyan/10 px-2.5 py-0.5 text-[10px] font-semibold text-accent-cyan flex items-center gap-1.5">
                  {activeScenario === 'compat' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan animate-ping" />
                  )}
                  1. BEFORE BUYING
                </span>
                <span className="whitespace-nowrap shrink-0 text-[11px] font-mono text-slate-400">Uses: Breville 54 mm</span>
              </div>
              <h3 className="font-bold text-white text-base mb-1.5 group-hover:text-accent-cyan transition-colors">
                Buying a 58 mm Accessory
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Checks the listing against your 54 mm Breville and warns you about a 15% restocking fee before checkout.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-accent-cyan">
              <span>Check Compatibility</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Missing Information (Know when not to guess) */}
          <div
            onClick={triggerScenario3}
            className={`group cursor-pointer rounded-2xl border p-5 sm:p-6 transition-all duration-300 backdrop-blur-xl flex flex-col justify-between min-h-[190px] relative ${
              activeScenario === 'unverified'
                ? 'border-accent-amber bg-obsidian-800/95 shadow-[0_0_35px_rgba(245,158,11,0.25)] ring-2 ring-accent-amber/80 scale-[1.01]'
                : 'border-white/10 bg-obsidian-800/50 hover:border-white/20 hover:bg-obsidian-800/80 hover:translate-y-[-1px]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3.5">
                <span className="whitespace-nowrap shrink-0 rounded-full border border-accent-amber/30 bg-accent-amber/10 px-2.5 py-0.5 text-[10px] font-semibold text-accent-amber flex items-center gap-1.5">
                  {activeScenario === 'unverified' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-amber animate-ping" />
                  )}
                  2. MISSING INFO
                </span>
                <span className="whitespace-nowrap shrink-0 text-[11px] font-mono text-slate-400">Uses: Breville 54 mm</span>
              </div>
              <h3 className="font-bold text-white text-base mb-1.5 group-hover:text-accent-amber transition-colors">
                Seller Omitted the Size
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When a seller leaves out required millimeter dimensions, Kept refuses to guess and pauses the order.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-accent-amber">
              <span>See Safe Stop</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: After Delivery (Use evidence and order context to prepare a resolution) */}
          <div
            onClick={triggerScenario2}
            className={`group cursor-pointer rounded-2xl border p-5 sm:p-6 transition-all duration-300 backdrop-blur-xl flex flex-col justify-between min-h-[190px] relative ${
              activeScenario === 'return'
                ? 'border-accent-emerald bg-obsidian-800/95 shadow-[0_0_35px_rgba(0,229,153,0.25)] ring-2 ring-accent-emerald/80 scale-[1.01]'
                : 'border-white/10 bg-obsidian-800/50 hover:border-white/20 hover:bg-obsidian-800/80 hover:translate-y-[-1px]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3.5">
                <span className="whitespace-nowrap shrink-0 rounded-full border border-accent-emerald/30 bg-accent-emerald/10 px-2.5 py-0.5 text-[10px] font-semibold text-accent-emerald flex items-center gap-1.5">
                  {activeScenario === 'return' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald animate-ping" />
                  )}
                  3. AFTER DELIVERY
                </span>
                <span className="whitespace-nowrap shrink-0 text-[11px] font-mono text-slate-400">Uses: Order #842</span>
              </div>
              <h3 className="font-bold text-white text-base mb-1.5 group-hover:text-accent-emerald transition-colors">
                Damaged or Wrong-Size Order
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Uses photo evidence on a cracked kettle and sweater order context to prepare a combined return plan.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-accent-emerald">
              <span>Prepare Return Plan</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
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
                  Household Recommendation &amp; Verification
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
                  ● Will Not Fit • Purchase Prevented
                </span>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400 font-medium">
                Size Mismatch
              </span>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{compatResult.candidateTitle}</h3>
                <div className="text-sm text-slate-200 leading-relaxed bg-obsidian-950/60 p-5 rounded-2xl border border-white/5 space-y-2">
                  <p className="font-semibold text-white">This accessory does not fit your Breville Barista Express.</p>
                  <p className="text-slate-300 text-xs">
                    Your machine requires a 54 mm portafilter with 3 locking ears. This item is 58 mm with only 2 ears, so it will not lock into your group head.
                  </p>
                </div>
              </div>

              {/* Mismatched Attributes Table */}
              {compatResult.mismatchedAttributes && (
                <div className="rounded-2xl border border-white/5 bg-obsidian-950/60 p-5 space-y-3">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Size Comparison
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-slate-400 font-medium">Feature</div>
                    <div className="text-accent-emerald font-semibold">Your Machine (Breville)</div>
                    <div className="text-accent-coral font-semibold">Item You Picked</div>
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
                    <span className="font-bold">Avoid Return Fee: </span>
                    This 3rd-party seller charges a 15% restocking fee on opened accessories. Buying this would have cost you return penalties.
                  </div>
                </div>
              )}

              {/* Verified Alternative */}
              {compatResult.recommendedAlternative && (
                <div className="rounded-2xl border border-accent-cyan/30 bg-accent-cyan/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-accent-cyan uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" /> Recommended Matching Item
                    </div>
                    <div className="font-semibold text-white text-sm">
                      {compatResult.recommendedAlternative.title}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {compatResult.recommendedAlternative.verifiedSpec} • Free 30-Day Prime Returns
                    </div>
                  </div>
                  <button className="shrink-0 rounded-full bg-accent-cyan px-5 py-2.5 text-xs font-bold text-obsidian-950 hover:brightness-110 transition-all">
                    Swap to Matching Item
                  </button>
                </div>
              )}
            </div>

            {/* Kept Decision Record (Consistent Across All Scenarios) */}
            <div className="rounded-2xl border border-white/10 bg-obsidian-950/70 overflow-hidden">
              <button
                onClick={() => setShowDecisionReceipt(!showDecisionReceipt)}
                className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors border-b border-white/5 bg-white/[0.02]"
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-accent-cyan" />
                  Kept Decision Record
                </span>
                <span className="flex items-center gap-1.5 text-slate-500 font-normal text-[11px]">
                  {showDecisionReceipt ? 'Hide Record' : 'View Decision Record'}
                  {showDecisionReceipt ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </span>
              </button>

              {showDecisionReceipt && (
                <div className="p-5 space-y-3.5 text-xs text-slate-300 border-t border-white/5 bg-black/40">
                  {/* 1. What Kept Checked */}
                  <div className="pb-3 border-b border-white/5">
                    <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-1">
                      1. What Kept Checked
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400">Owned Equipment: </span>
                        <span className="text-accent-emerald font-semibold">Breville Barista Express (54 mm, 3 ears)</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Listing Checked: </span>
                        <span className="text-slate-200">58mm Bottomless Portafilter</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. What Kept Concluded */}
                  <div className="pb-3 border-b border-white/5">
                    <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-1">
                      2. What Kept Concluded
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400">Size Conflict: </span>
                        <span className="text-accent-coral font-medium">58 mm does not fit a 54 mm group head (3 ears ≠ 2 ears)</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Seller Policy: </span>
                        <span className="text-accent-amber font-medium">15% restocking fee on opened returns</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Recommended Next Step */}
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-1">
                      3. Recommended Next Step
                    </span>
                    <div className="text-xs text-slate-200 font-medium">
                      Verify a compatible 54 mm accessory before purchasing to avoid return fees and delivery waste.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>Source: Breville BES870XL Manual Specification Table (p. 28)</span>
              <span className="text-accent-emerald font-semibold">Saved $39.99 + 15% Return Penalty</span>
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
                    ● 2 Items Eligible for Free Return & Replacement
                  </span>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400 font-medium">
                  30-Day Window Active
                </span>
              </div>

              {/* Items Cards with High Contrast & Visual Hierarchy */}
              <div className="space-y-6">
                {/* Item 1: Kettle */}
                <div className="rounded-2xl border border-white/10 bg-obsidian-950/60 p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <span className="inline-block rounded-full bg-accent-coral/15 border border-accent-coral/30 px-3 py-0.5 text-xs font-semibold text-accent-coral mb-2">
                        Damaged Item Detected
                      </span>
                      <h4 className="font-bold text-white text-lg">Cosori Electric Gooseneck Glass Kettle 0.8L</h4>
                      <p className="text-xs text-slate-400">Order #ORDER-842-OCT2026 • Delivered Oct 18 (28 days left to return)</p>
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
                        Send Replacement
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
                          <Camera className="h-3.5 w-3.5" /> AI Photo Inspection (Bedrock Nova)
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                            novaObservation.isLiveAwsCall
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-white/5 border-white/10 text-slate-400'
                          }`}>
                            {novaObservation.isLiveAwsCall ? 'Live AWS Bedrock' : 'Verified Defect Model'}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">{novaObservation.latencyMs}ms</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {novaObservation.summary}
                      </p>
                      {novaObservation.missingPartsNoted?.length > 0 && (
                        <div className="text-xs text-accent-amber flex items-center gap-1.5 font-medium">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          <span>Reminder: The power base isn't in this photo. Make sure to pack it so you receive your full refund.</span>
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
                        Unworn • Tags Intact
                      </span>
                      <h4 className="font-bold text-white text-lg">State Cashmere 100% Pure Merino Wool Turtleneck (Medium)</h4>
                      <p className="text-xs text-slate-400">Order #ORDER-842-OCT2026 • Delivered Oct 18 (28 days left to return)</p>
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
                        Refund to Card
                      </button>
                      <button
                        onClick={() => setSweaterAction('REPLACEMENT_FOR_DAMAGE')}
                        className={`rounded-full px-3.5 py-1.5 font-semibold transition-all border ${
                          sweaterAction === 'REPLACEMENT_FOR_DAMAGE'
                            ? 'border-accent-cyan bg-accent-cyan/20 text-accent-cyan'
                            : 'border-white/10 bg-white/5 text-slate-400'
                        }`}
                      >
                        Exchange Size
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    Eligible for free box-free, label-free drop-off at Whole Foods with original hangtags attached.
                  </div>
                </div>

                {/* Consolidated Drop-off Pathway Box */}
                <div className="rounded-2xl border border-accent-emerald/30 bg-accent-emerald/10 p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-accent-emerald flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> 1-Trip Combined Return
                    </span>
                    <span className="text-xs font-semibold text-slate-200">No Boxes • No Printing Needed</span>
                  </div>
                  <div className="text-base font-bold text-white">
                    {returnPlan.consolidatedTripSummary.suggestedLocation}
                  </div>
                  <p className="text-xs text-slate-300">
                    Both items can be returned together in a single trip to Whole Foods. You don't need boxes or shipping labels—just show the digital return code.
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
                    <span className="font-bold text-white">Confirm Return Plan: </span>
                    I confirm these actions (1 replacement kettle sent, 1 refund for sweater) and authorize Kept to prepare my return pass.
                  </div>
                </label>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <button
                    onClick={executeApprovedPlan}
                    disabled={!userConfirmedApproval || loading || executionResult !== null}
                    className="w-full sm:w-auto rounded-full bg-gradient-to-r from-accent-cyan to-accent-emerald px-8 py-3 text-xs font-bold text-obsidian-950 hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-accent-cyan/20 flex items-center justify-center gap-2"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    {executionResult ? 'Return Pass Ready' : 'Confirm & Generate Return Pass'}
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
                      <Calendar className="h-3.5 w-3.5" /> Add Return Deadline to Calendar (.ics)
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500 flex items-center gap-1.5 py-2">
                      <Calendar className="h-3.5 w-3.5 opacity-40" /> Calendar reminder available after confirmation
                    </span>
                  )}
                </div>
              </div>

              {/* Kept Decision Record (Consistent Across All Scenarios) */}
              <div className="rounded-2xl border border-white/10 bg-obsidian-950/70 overflow-hidden">
                <button
                  onClick={() => setShowDecisionReceipt(!showDecisionReceipt)}
                  className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors border-b border-white/5 bg-white/[0.02]"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-accent-emerald" />
                    Kept Decision Record
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-500 font-normal text-[11px]">
                    {showDecisionReceipt ? 'Hide Record' : 'View Decision Record'}
                    {showDecisionReceipt ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </span>
                </button>

                {showDecisionReceipt && (
                  <div className="p-5 space-y-3.5 text-xs text-slate-300 border-t border-white/5 bg-black/40">
                    {/* 1. What Kept Checked */}
                    <div className="pb-3 border-b border-white/5">
                      <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-1">
                        1. What Kept Checked
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400">Order Evaluated: </span>
                          <span className="text-white font-semibold">Order #842 (Delivered Oct 18 · 28d left)</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Items & Evidence: </span>
                          <span className="text-slate-200">Kettle photo (Nova Vision) + Sweater (tags intact)</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. What Kept Concluded */}
                    <div className="pb-3 border-b border-white/5">
                      <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-1">
                        2. What Kept Concluded
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400">Inspection Result: </span>
                          <span className="text-accent-coral font-medium">Handle crack verified; power base missing in photo</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Routing Opportunity: </span>
                          <span className="text-accent-emerald font-medium">Both items eligible for 1 combined Whole Foods drop-off</span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Recommended Next Step */}
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-1">
                        3. Recommended Next Step
                      </span>
                      <div className="text-xs text-slate-200 font-medium">
                        {executionResult
                          ? 'Plan authorized and return pass generated. Present barcode at Whole Foods Customer Service desk.'
                          : 'Pack kettle power base, confirm proposed plan, and authorize Kept to generate your return pass.'}
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
                  <h4 className="font-bold text-white text-base">Return Authorized & Ready for Drop-Off</h4>
                </div>
                <div className="space-y-2 text-xs text-slate-300 font-mono">
                  <div>Status: <span className="text-accent-emerald font-bold">Ready to Drop Off</span></div>
                  <div>Security Token: <span className="text-accent-cyan">HMAC-SHA256 Signed (auth_plan_••••••••)</span></div>
                  <div>Trip Saved: <span className="text-accent-emerald font-semibold">2 returns consolidated into 1 trip</span></div>
                  <div className="pt-2 text-[11px] text-slate-400 font-sans">
                    Digital return pass generated. Simply show your phone at the Whole Foods Customer Service desk.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scenario 3: Epistemic Honesty / Missing Specs Refusal */}
        {/* Scenario 3: Missing Specs Safe Stop */}
        {activeScenario === 'unverified' && compatResult && (
          <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-obsidian-800/80 p-8 sm:p-10 backdrop-blur-xl shadow-2xl transition-all space-y-6">
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-accent-amber animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-accent-amber">
                  ● Size Not Listed • Checkout Paused
                </span>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400 font-medium">
                Unverified Listing
              </span>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{compatResult.candidateTitle}</h3>
                <div className="text-sm text-slate-200 leading-relaxed bg-obsidian-950/60 p-5 rounded-2xl border border-white/5 space-y-2">
                  <p className="font-semibold text-white">We paused this order because the seller hasn't provided dimensions.</p>
                  <p className="text-slate-300 text-xs">
                    Your Breville machine requires an exact 54 mm accessory with 3 locking ears. This seller didn't list any measurements, so Kept won't guess or risk ordering something that won't fit.
                  </p>
                </div>
              </div>

              {compatResult.sellerRiskWarning && (
                <div className="flex items-start gap-3 rounded-2xl border border-accent-coral/30 bg-accent-coral/10 p-5 text-xs text-accent-coral">
                  <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Third-Party Seller Alert: </span>
                    This seller has no published return policy. If this accessory doesn't fit, you may not be able to return it.
                  </div>
                </div>
              )}
            </div>

            {/* Kept Decision Record (Consistent Across All Scenarios) */}
            <div className="rounded-2xl border border-white/10 bg-obsidian-950/70 overflow-hidden">
              <button
                onClick={() => setShowDecisionReceipt(!showDecisionReceipt)}
                className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors border-b border-white/5 bg-white/[0.02]"
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-accent-amber" />
                  Kept Decision Record
                </span>
                <span className="flex items-center gap-1.5 text-slate-500 font-normal text-[11px]">
                  {showDecisionReceipt ? 'Hide Record' : 'View Decision Record'}
                  {showDecisionReceipt ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </span>
              </button>

              {showDecisionReceipt && (
                <div className="p-5 space-y-3.5 text-xs text-slate-300 border-t border-white/5 bg-black/40">
                  {/* 1. What Kept Checked */}
                  <div className="pb-3 border-b border-white/5">
                    <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-1">
                      1. What Kept Checked
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400">Owned Equipment: </span>
                        <span className="text-white font-semibold">Breville Barista Express (54 mm, 3 ears)</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Listing Checked: </span>
                        <span className="text-slate-200">Espresso Dosing Ring & Needle Collar</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. What Kept Concluded */}
                  <div className="pb-3 border-b border-white/5">
                    <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-1">
                      2. What Kept Concluded
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400">Missing Information: </span>
                        <span className="text-accent-amber font-medium">Seller omitted millimeter collar & diameter dimensions</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Kept Guardrail: </span>
                        <span className="text-accent-coral font-medium">Refuse to guess or hallucinate compatibility without verified specs</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Recommended Next Step */}
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-1">
                      3. Recommended Next Step
                    </span>
                    <div className="text-xs text-slate-200 font-medium">
                      Order paused. Ask the seller for confirmed millimeter specifications before purchasing.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>Source: Seller listing page lacks published millimeter dimensions</span>
              <span className="text-accent-amber font-semibold">Order Paused For Safety</span>
            </div>
          </div>
        )}
      </main>

      {/* Sleek Refined Utility Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500/80 font-normal border-t border-white/5 pt-4">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-400/90">Kept</span>
          <span className="text-slate-600/60">•</span>
          <span>Alexa+ Commerce & Returns Guardian</span>
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
