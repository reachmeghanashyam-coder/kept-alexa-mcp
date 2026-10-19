'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

export default function DropGuardApp() {
  // Start with null so initial landing is clean, spacious, and idle (like Relayeo)
  const [activeScenario, setActiveScenario] = useState<'compat' | 'return' | 'unverified' | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mcpTrace, setMcpTrace] = useState<any>(null);
  const [showTraceDrawer, setShowTraceDrawer] = useState(false);
  const [customQuery, setCustomQuery] = useState('');

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
    <div className="min-h-screen bg-obsidian-900 bg-glow-radial text-slate-100 flex flex-col font-sans pb-24">
      {/* Floating Top Navbar with Generous Padding */}
      <header className="sticky top-6 z-40 mx-auto w-full max-w-5xl px-4 mb-16">
        <div className="flex items-center justify-between rounded-full border border-white/10 bg-obsidian-800/80 px-6 py-3.5 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-accent-cyan to-accent-emerald text-obsidian-950 font-black text-sm">
              DG
            </div>
            <span className="font-bold tracking-tight text-white text-lg">DropGuard</span>
            <span className="hidden sm:inline-flex items-center rounded-full border border-accent-cyan/30 bg-accent-cyan/10 px-2.5 py-0.5 text-xs font-semibold text-accent-cyan">
              ENGINE v2025.11
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 rounded-full border border-white/5 bg-obsidian-950/60 px-3.5 py-1.5 text-xs text-slate-300">
              <span className="h-2 w-2 rounded-full bg-accent-emerald animate-pulse"></span>
              Household #842 Connected ({inventory.length} Items)
            </div>

            <button
              onClick={resetDemo}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              Reset Demo
            </button>

            <button
              onClick={() => setShowTraceDrawer(!showTraceDrawer)}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent-cyan to-accent-emerald px-4 py-1.5 text-xs font-bold text-obsidian-950 hover:brightness-110 transition-all shadow-lg shadow-accent-cyan/20"
            >
              <Code2 className="h-3.5 w-3.5" />
              {showTraceDrawer ? 'Hide Trace' : 'Inspect MCP'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section with Generous Breathing Room & Large Typography */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 flex flex-col items-center">
        {/* Category Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-accent-cyan/30 bg-accent-cyan/10 px-4 py-1.5 text-xs font-semibold text-accent-cyan tracking-wide mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan"></span>
          Alexa+ Commerce & Ownership Bridge • Powered by Model Context Protocol
        </div>

        {/* Hero Title Matching Relayeo Reference */}
        <div className="text-center max-w-4xl mb-12">
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6 text-white">
            Let's Check Your Orders
            <br />
            <span className="bg-gradient-to-r from-accent-cyan via-accent-mint to-accent-emerald bg-clip-text text-transparent">
              Before AI Systems Ship Them
            </span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            One living household record that stops incompatible purchases before checkout and turns damaged unboxings into a verified, 1-trip return plan.
          </p>
        </div>

        {/* Interactive Main Action Input Bar (Just like Relayeo's search bar) */}
        <div className="w-full max-w-2xl mb-6">
          <div className="flex items-center justify-between rounded-full border border-white/10 bg-obsidian-800/90 p-2 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3 pl-4 flex-1">
              <span className="h-2.5 w-2.5 rounded-full bg-accent-emerald"></span>
              <span className="text-sm font-medium text-slate-200">
                Connected: household-842.amazon.com
              </span>
            </div>
            <button
              onClick={triggerScenario2}
              disabled={loading}
              className="rounded-full bg-gradient-to-r from-accent-cyan to-accent-emerald px-6 py-2.5 text-xs font-bold text-obsidian-950 hover:brightness-110 transition-all shadow-md shadow-accent-cyan/20 flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Running Audit...
                </>
              ) : (
                <>Check My Orders ⟳</>
              )}
            </button>
          </div>
        </div>

        {/* Benchmark Scenario Pills with Generous Spacing */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs text-slate-400 mb-16">
          <span>Or benchmark demo scenarios:</span>
          <button
            onClick={triggerScenario1}
            className={`rounded-full px-4 py-1.5 font-medium transition-all border ${
              activeScenario === 'compat'
                ? 'border-accent-cyan bg-accent-cyan/15 text-accent-cyan shadow-md shadow-accent-cyan/20'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            58mm-portafilter.fit →
          </button>
          <button
            onClick={triggerScenario2}
            className={`rounded-full px-4 py-1.5 font-medium transition-all border ${
              activeScenario === 'return'
                ? 'border-accent-cyan bg-accent-cyan/15 text-accent-cyan shadow-md shadow-accent-cyan/20'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            order-842.resolve →
          </button>
          <button
            onClick={triggerScenario3}
            className={`rounded-full px-4 py-1.5 font-medium transition-all border ${
              activeScenario === 'unverified'
                ? 'border-accent-amber bg-accent-amber/15 text-accent-amber shadow-md shadow-accent-amber/20'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            unverified-seller.test →
          </button>
        </div>



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
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-accent-cyan flex items-center gap-1.5">
                          <Camera className="h-3.5 w-3.5" /> Amazon Bedrock Nova Multimodal Visual Observation
                        </span>
                        <span className="text-slate-400 font-mono">Latency: {novaObservation.latencyMs}ms</span>
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
                    Policy Verified: Eligible for box-free, label-free drop-off at Whole Foods with original hangtags attached.
                  </div>
                </div>

                {/* Consolidated Drop-off Pathway Box */}
                <div className="rounded-2xl border border-accent-emerald/30 bg-accent-emerald/10 p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-accent-emerald flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> Single-Trip Drop-Off Consolidated
                    </span>
                    <span className="text-xs font-semibold text-slate-200">0 Boxes • 0 Labels Needed</span>
                  </div>
                  <div className="text-base font-bold text-white">
                    {returnPlan.consolidatedTripSummary.suggestedLocation}
                  </div>
                  <p className="text-xs text-slate-300">
                    Both items are verified eligible for customer-service counter drop-off. Present digital pass on your phone or Alexa app.
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
                    <span className="font-bold text-white">User Authorization Confirmation: </span>
                    I confirm the requested actions (1 replacement for damaged kettle, 1 refund for sweater) and authorize DropGuard to issue a cryptographically signed plan token.
                  </div>
                </label>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <button
                    onClick={executeApprovedPlan}
                    disabled={!userConfirmedApproval || loading}
                    className="w-full sm:w-auto rounded-full bg-gradient-to-r from-accent-cyan to-accent-emerald px-8 py-3 text-xs font-bold text-obsidian-950 hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-accent-cyan/20 flex items-center justify-center gap-2"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Approve & Issue Server-Bound Authorization
                  </button>

                  <a
                    href={`/api/calendar?deadline=${returnPlan.calendarDeadline}&location=${encodeURIComponent(
                      returnPlan.consolidatedTripSummary.suggestedLocation
                    )}`}
                    download="dropguard-return-deadline.ics"
                    className="flex items-center gap-1.5 text-xs text-accent-cyan hover:underline py-2"
                  >
                    <Calendar className="h-3.5 w-3.5" /> Download .ics Calendar Reminder
                  </a>
                </div>
              </div>
            </div>

            {/* Execution Confirmation Card */}
            {executionResult && (
              <div className="rounded-3xl border border-accent-emerald/40 bg-accent-emerald/10 p-6 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-accent-emerald" />
                  <h4 className="font-bold text-white text-base">Plan Authorized & Executed on MCP Server</h4>
                </div>
                <div className="space-y-2 text-xs text-slate-300 font-mono">
                  <div>Status: <span className="text-accent-emerald font-bold">EXECUTED_SUCCESSFULLY</span></div>
                  <div>Plan Hash: <span className="text-slate-400">{executionResult.plan.planHash}</span></div>
                  <div>Authorization Token: <span className="text-accent-cyan">{executionResult.plan.authorizationToken}</span></div>
                  <div>Lifecycle State: All items transitioned to <span className="text-accent-emerald font-semibold">RETURN_PREPARED</span></div>
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

            <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>Source: {compatResult.sourceEvidence}</span>
              <span className="text-accent-amber font-semibold">Safe Stop Enforced</span>
            </div>
          </div>
        )}
      </main>

      {/* Slide-out MCP Trace & Sources Drawer */}
      {showTraceDrawer && (
        <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] border-l border-white/10 bg-obsidian-950/95 p-6 backdrop-blur-2xl overflow-y-auto shadow-2xl flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-accent-cyan" />
              <span className="font-bold text-white text-sm">Live MCP Protocol Trace & Sources</span>
            </div>
            <button
              onClick={() => setShowTraceDrawer(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
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
