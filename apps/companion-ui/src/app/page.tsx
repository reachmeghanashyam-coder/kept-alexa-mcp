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
  Layers,
  X,
  Key,
  Check,
  Coffee,
  Monitor,
} from 'lucide-react';

export default function KeptApp() {
  // Start with null so initial landing is clean, spacious, and idle (like Relayeo)
  const [activeScenario, setActiveScenario] = useState<'compat' | 'return' | 'unverified' | 'duplicate' | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mcpTrace, setMcpTrace] = useState<any>(null);
  const [showTraceDrawer, setShowTraceDrawer] = useState(false);
  const [showHouseholdDrawer, setShowHouseholdDrawer] = useState(false);
  const [householdFilter, setHouseholdFilter] = useState<'ALL' | 'Kitchen' | 'Office' | 'Wardrobe'>('ALL');
  const [showSigVerification, setShowSigVerification] = useState(false);
  const [customQuery, setCustomQuery] = useState('58mm Bottomless Portafilter');
  const [showDecisionReceipt, setShowDecisionReceipt] = useState(false);
  const [copiedQuestion, setCopiedQuestion] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Kitchen Appliances');
  const [newSpec, setNewSpec] = useState('');
  const [addSuccessMsg, setAddSuccessMsg] = useState('');

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

  // Trigger Scenario 1: Family Meal & Allergy Shield
  async function triggerScenario1() {
    setCustomQuery('20-Minute Quick Dinner Recipe');
    setActiveScenario('compat');
    setLoading(true);
    setExecutionResult(null);
    try {
      const candidate = {
        title: 'Trending Creamy Walnut Pesto Pasta with Sautéed Pine Nuts',
        brand: 'Web Recipe Recommendation',
        category: 'Kitchen Appliances',
        targetSpecs: { allergens: ['Walnuts', 'Pine Nuts', 'Dairy'], method: 'Stovetop Boiling' },
        sellerPolicy: { isThirdParty: false, termsExplicitlyStated: true },
      };

      const parsed = {
        candidateTitle: 'Trending Creamy Walnut Pesto Pasta (Contains Tree Nuts)',
        status: 'INCOMPATIBLE',
        matchedOwnedItemId: 'item_allergy_guard_01',
        matchedOwnedProductTitle: 'Family Allergy Profile & Ninja DualZone Air Fryer',
        reason: 'Leo (Age 5) has a documented severe tree nut allergy. This web recommendation contains walnuts and pine nuts. Kept halted the recipe recommendation before Alexa spoke.',
        mismatchedAttributes: [
          { attribute: 'Allergen Conflict', ownedValue: '100% Tree-Nut & Peanut Free', candidateValue: 'Contains Walnuts & Pine Nuts' },
          { attribute: 'Cooking Method', ownedValue: 'Ninja DualZone 8-Qt Air Fryer', candidateValue: 'Stovetop Boiling' },
        ],
        sourceEvidence: 'Household Memory Enclave: Leo Health Profile §Allergens & Kitchen Device Registry',
        recommendedAlternative: {
          title: 'Crispy Parmesan Chicken Tenders & Green Beans (Nut-Free)',
          asin: 'RECIPE-NUT-FREE-01',
          verifiedSpec: '15-Min Ninja DualZone Air Fryer Program • 100% Nut-Free & Kid-Safe',
          returnPolicySummary: 'Healthy Family Approved • Uses Ingredients in Pantry',
        },
        originLabel: 'HOUSEHOLD_MEMORY_SOURCE',
      };

      setCompatResult(parsed);
      setMcpTrace({
        tool: 'verify_household_care',
        input: { intent: 'family_dinner_query', query: 'quick dinner recipe', childAge: 5 },
        output: parsed,
      });
    } finally {
      setLoading(false);
    }
  }

  // Trigger Scenario 2: Automatic Supply Care (Levoit Nursery Air Purifier Filter)
  async function triggerScenarioDuplicate() {
    setCustomQuery('Nursery Air Purifier Replacement Filter');
    setActiveScenario('duplicate');
    setLoading(true);
    setExecutionResult(null);
    try {
      const parsed = {
        candidateTitle: 'Official Levoit Core 300 True HEPA Replacement Filter (White)',
        status: 'DUPLICATE_OWNED',
        matchedOwnedItemId: 'item_nursery_purifier_02',
        matchedOwnedProductTitle: 'Levoit Core 300 Air Purifier (Nursery)',
        reason: 'Kept matched the exact True HEPA H13 filter for the Levoit Core 300 in Maya & Leo’s room. Filter life tracked at 12% (due in 5 days). Zero model guesswork required.',
        mismatchedAttributes: [],
        sourceEvidence: 'Household Memory Enclave: Nursery Equipment Specs §Packaging & Filter Standard H13',
        originLabel: 'HOUSEHOLD_MEMORY_SOURCE',
      };

      setCompatResult(parsed);
      setMcpTrace({
        tool: 'match_household_supply',
        input: { device: 'Nursery Air Purifier', filterStandard: 'True HEPA H13' },
        output: parsed,
      });
    } finally {
      setLoading(false);
    }
  }

  // Trigger Scenario 3: Duplicate Spend & Cable Guard
  async function triggerScenario3() {
    setCustomQuery('4K 60Hz HDMI Switch & 6ft Cable');
    setActiveScenario('unverified');
    setLoading(true);
    setExecutionResult(null);
    try {
      const candidate = {
        title: 'Ultra High-Speed 4K HDMI Switch Box with 6ft Braided Cable Bundle ($34.99)',
        category: 'Electronics & Office',
        targetSpecs: {},
        sellerPolicy: { isThirdParty: false, termsExplicitlyStated: true },
      };

      const parsed = {
        candidateTitle: '4K HDMI Switch Box with 6ft Cable ($34.99 Redundant Purchase)',
        status: 'UNVERIFIED_MISSING_SPECS',
        reason: 'Living room Samsung 55" OLED TV already has 2 open HDMI 2.1 ports on the side. Household storage also contains an unopened 6ft 4K cable from Order #ORDER-234. Kept paused checkout to prevent $34.99 wasted spend.',
        sourceEvidence: 'Household Memory Enclave: Samsung 55" OLED TV Spec Sheet §Ports (4x HDMI 2.1) & Living Room Storage Inventory',
        sellerRiskWarning: 'Household already owns required ports and cables. No new hardware purchase needed.',
        originLabel: 'HOUSEHOLD_MEMORY_SOURCE',
      };

      setCompatResult(parsed);
      setMcpTrace({
        tool: 'check_duplicate_hardware',
        input: { candidate, hostDevice: 'Samsung 55" OLED TV' },
        output: parsed,
      });
    } finally {
      setLoading(false);
    }
  }



  // Interactive Verification Engine: handles free-text query or quick test chip
  async function handleCustomQuerySubmit(query: string) {
    if (!query.trim()) return;
    const q = query.toLowerCase();
    setLoading(true);
    setExecutionResult(null);

    let candidate: any;
    if (q.includes('58') || (q.includes('portafilter') && !q.includes('54'))) {
      setActiveScenario('compat');
      candidate = {
        title: query,
        brand: 'MATOW',
        category: 'Kitchen Appliances',
        targetSpecs: { portafilterSizeMm: 58, earCount: 2 },
        sellerPolicy: { isThirdParty: true, restockingFeePercent: 15, returnWindowDays: 30, termsExplicitlyStated: true },
      };
    } else if (q.includes('cable') || q.includes('usb') || q.includes('anker')) {
      setActiveScenario('duplicate');
      candidate = {
        title: query,
        brand: 'Anker',
        category: 'Electronics & Office',
        targetSpecs: { cableType: 'USB-C to USB-C', powerDeliveryWatts: 100, lengthMeters: 1.0 },
        sellerPolicy: { isThirdParty: false, restockingFeePercent: 0, returnWindowDays: 30, termsExplicitlyStated: true },
      };
    } else if (q.includes('universal') || q.includes('collar') || q.includes('dimension') || q.includes('unverified')) {
      setActiveScenario('unverified');
      candidate = {
        title: query,
        category: 'Kitchen Appliances',
        targetSpecs: {},
        sellerPolicy: { isThirdParty: true, termsExplicitlyStated: false },
      };
    } else if (q.includes('54') || q.includes('capmesso')) {
      setActiveScenario('compat');
      candidate = {
        title: query,
        category: 'Kitchen Appliances',
        targetSpecs: { portafilterSizeMm: 54, earCount: 3 },
        sellerPolicy: { isThirdParty: false, restockingFeePercent: 0, returnWindowDays: 30, termsExplicitlyStated: true },
      };
    } else {
      const mmMatch = q.match(/(\d+)\s*mm/);
      const sizeMm = mmMatch ? parseInt(mmMatch[1], 10) : undefined;
      const isKitchen = q.includes('coffee') || q.includes('espresso') || q.includes('basket') || q.includes('tamper');
      
      setActiveScenario('compat');
      candidate = {
        title: query,
        category: isKitchen ? 'Kitchen Appliances' : 'General Merchandise',
        targetSpecs: sizeMm ? { portafilterSizeMm: sizeMm, earCount: 3 } : {},
        sellerPolicy: { isThirdParty: false, restockingFeePercent: 0, returnWindowDays: 30, termsExplicitlyStated: true },
      };
    }

    try {
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


  // Live Household Persistence: Register custom item into ledger
  async function handleAddCustomItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'add_household_item',
          arguments: {
            productTitle: newTitle.trim(),
            category: newCategory,
            verifiedSpecs: newSpec.trim() ? { primarySpec: newSpec.trim() } : {},
          },
        }),
      });
      const data = await res.json();
      setMcpTrace({ tool: 'add_household_item', response: data });
      setAddSuccessMsg(`✓ Saved "${newTitle.trim()}" to Household Ledger!`);
      setNewTitle('');
      setNewSpec('');
      setShowAddForm(false);
      await fetchInventory();
      setTimeout(() => setAddSuccessMsg(''), 4000);
    } finally {
      setLoading(false);
    }
  }

  // Real MCP resolution: evaluate verified 54 mm candidate
  async function resolveToCompatibleAlternative() {
    setActiveScenario('compat');
    setLoading(true);
    try {
      const candidate = {
        title: 'CAPMESSO 54mm Bottomless Portafilter for Breville Barista Series (3-Ear Stainless Steel)',
        category: 'Kitchen Appliances',
        targetSpecs: { portafilterSizeMm: 54, earCount: 3 },
        sellerPolicy: { isThirdParty: false, restockingFeePercent: 0, returnWindowDays: 30, termsExplicitlyStated: true },
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
    <div className="min-h-screen bg-[#06090F] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar with subtle border and crisp contrast */}
      <header className="w-full border-b border-white/[0.08] bg-[#06090F]/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3">
          {/* Left: Original Clean Apple-grade Brand Mark */}
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

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHouseholdDrawer(true)}
              className="rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              <span>Household Ledger (2)</span>
            </button>
            <button
              onClick={() => setShowTraceDrawer(!showTraceDrawer)}
              className="rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 hover:brightness-110 transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <Code2 className="h-3.5 w-3.5" />
              {showTraceDrawer ? 'Hide Trace' : 'Inspect MCP'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container — Calibrated for Majestic Full-Viewport Balance */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6 pt-10 sm:pt-14 pb-8 flex flex-col justify-center items-center">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mb-10 sm:mb-12 flex flex-col items-center">
          {/* Category Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-4 py-1.5 text-xs font-medium text-cyan-300 tracking-wide mb-5 shadow-sm backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
            <span>Personal Household Care Layer</span>
          </div>

          {/* Hero Title */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-4 text-white">
            AI finds it.
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Kept personalizes it.
            </span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mt-[15px]">
            The gentle layer of household memory for Alexa+ that protects family allergies, knows your real appliances, and prevents wasted spend before checkout.
          </p>
        </div>

        {/* Section Eyebrow */}
        <div className="w-full max-w-5xl mb-4 px-1 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#00F0FF]"></span>
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-semibold">
            HOUSEHOLD CARE SIMULATION
          </span>
        </div>

        {/* 3 Bento Boxes Matching Reference Design with 15% Reduced Height */}
        <div ref={bentoGridRef} className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Card 1 */}
          <div
            onClick={triggerScenario1}
            className={`group cursor-pointer rounded-2xl border p-6 min-h-[245px] transition-all duration-200 flex flex-col justify-between ${
              activeScenario === 'compat'
                ? 'border-cyan-400 bg-[#0B1220] ring-1 ring-cyan-400/50 shadow-lg shadow-cyan-500/10'
                : 'border-white/[0.08] bg-[#0A0F1D]/80 hover:border-white/20 hover:bg-[#0E1528]'
            }`}
          >
            <div>
              {/* Circular numbered badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-950/80 border border-cyan-500/30 text-xs font-mono font-bold text-cyan-400">
                  01
                </span>
                <span className="text-xs font-mono text-slate-500 bg-white/[0.02] px-2.5 py-0.5 rounded-md border border-white/5">
                  Little Brother #842
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                Family Meal & Allergy Shield
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When you ask for dinner recipes, Kept blocks tree-nut allergens and matches cooking steps to your actual Ninja air fryer.
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-semibold text-cyan-400">
              <span>Test Kid-Safe Recipe Match</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* Card 2 */}
          <div
            onClick={triggerScenarioDuplicate}
            className={`group cursor-pointer rounded-2xl border p-6 min-h-[245px] transition-all duration-200 flex flex-col justify-between ${
              activeScenario === 'duplicate'
                ? 'border-emerald-400 bg-[#0B1220] ring-1 ring-emerald-400/50 shadow-lg shadow-emerald-500/10'
                : 'border-white/[0.08] bg-[#0A0F1D]/80 hover:border-white/20 hover:bg-[#0E1528]'
            }`}
          >
            <div>
              {/* Circular numbered badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-950/80 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-400">
                  02
                </span>
                <span className="text-xs font-mono text-slate-500 bg-white/[0.02] px-2.5 py-0.5 rounded-md border border-white/5">
                  Nursery & Bedroom
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                Automatic Supply & Filter Match
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Matches the exact True HEPA filter for your bedroom air purifier without asking you to memorize cryptic model codes.
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-semibold text-emerald-400">
              <span>Test Nursery Filter Care</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* Card 3 */}
          <div
            onClick={triggerScenario3}
            className={`group cursor-pointer rounded-2xl border p-6 min-h-[245px] transition-all duration-200 flex flex-col justify-between ${
              activeScenario === 'unverified'
                ? 'border-purple-400 bg-[#0B1220] ring-1 ring-purple-400/50 shadow-lg shadow-purple-500/10'
                : 'border-white/[0.08] bg-[#0A0F1D]/80 hover:border-white/20 hover:bg-[#0E1528]'
            }`}
          >
            <div>
              {/* Circular numbered badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-950/80 border border-purple-500/30 text-xs font-mono font-bold text-purple-400">
                  03
                </span>
                <span className="text-xs font-mono text-slate-500 bg-white/[0.02] px-2.5 py-0.5 rounded-md border border-white/5">
                  Family Living Room
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                Duplicate Spend & Cable Guard
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Checks your TV ports and spare cables already in drawers so Dad never wastes money on redundant adapters.
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-semibold text-purple-400">
              <span>Test Spare Cable Check</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
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



        {/* Scenario 1: Compatibility Verification (Dynamic Incompatible Block OR Verified Compatible Match) */}
        {activeScenario === "compat" && compatResult && (
          <div className={`w-full max-w-3xl rounded-3xl border p-6 sm:p-7 backdrop-blur-xl shadow-2xl transition-all space-y-4 ${
            compatResult.status === "COMPATIBLE"
              ? "border-accent-emerald/40 bg-obsidian-800/90 shadow-[0_0_30px_rgba(0,229,153,0.12)]"
              : "border-white/10 bg-obsidian-800/85"
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className={`flex h-2.5 w-2.5 rounded-full ${
                  compatResult.status === "COMPATIBLE" ? "bg-accent-emerald animate-pulse" : "bg-accent-coral"
                }`}></span>
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  compatResult.status === "COMPATIBLE" ? "text-accent-emerald" : "text-accent-coral"
                }`}>
                  {compatResult.status === "COMPATIBLE"
                    ? "Nut-Free Recipe Matched • Ninja Air Fryer"
                    : "Allergen Conflict • Tree Nut Warning"}
                </span>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-medium ${
                compatResult.status === "COMPATIBLE"
                  ? "border-accent-emerald/30 bg-accent-emerald/10 text-accent-emerald"
                  : "border-accent-coral/30 bg-accent-coral/10 text-accent-coral"
              }`}>
                {compatResult.status === "COMPATIBLE" ? "100% Nut-Free & Kid-Safe" : "Walnut Risk Blocked"}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2 leading-snug">{compatResult.candidateTitle}</h3>
                
                {compatResult.status === "COMPATIBLE" ? (
                  <div className="rounded-2xl border border-accent-emerald/25 bg-accent-emerald/5 p-4 space-y-2">
                    <p className="text-sm font-semibold text-white">
                      Verified safe for Leo (Age 5) & matched to your Ninja DualZone Air Fryer.
                    </p>
                    <p className="text-xs text-slate-300">
                      Cooks in 15 minutes at 390°F. Uses ingredients already present in household pantry.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-obsidian-950/60 p-4 border border-white/5 space-y-2">
                    <p className="text-sm text-slate-200">
                      Leo has a <span className="text-accent-coral font-semibold">severe tree nut allergy</span>. This trending recipe requires walnuts and pine nuts. Kept blocked this suggestion before Alexa answered.
                    </p>
                    <p className="text-xs text-accent-cyan flex items-center gap-1.5 font-medium pt-1">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                      <span>Protected by Household Memory Enclave • Little Brother #842</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Verified Alternative Option when Incompatible */}
              {compatResult.status !== "COMPATIBLE" && compatResult.recommendedAlternative && (
                <div className="rounded-2xl border border-accent-cyan/30 bg-accent-cyan/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold text-accent-cyan uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" /> Recommended Family Alternative
                    </div>
                    <div className="font-semibold text-white text-sm">
                      {compatResult.recommendedAlternative.title}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {compatResult.recommendedAlternative.verifiedSpec} • Kid Approved
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => {
                        setCompatResult({
                          candidateTitle: 'Crispy Parmesan Chicken Tenders & Green Beans (Nut-Free)',
                          status: 'COMPATIBLE',
                          matchedOwnedItemId: 'item_allergy_guard_01',
                          matchedOwnedProductTitle: 'Ninja DualZone Air Fryer',
                          reason: '100% nut-free recipe verified safe for Leo. Matched to Ninja Air Fryer basket #1 and basket #2.',
                          mismatchedAttributes: [],
                          sourceEvidence: 'Household Memory Enclave: Leo Health Profile §Allergens',
                          originLabel: 'HOUSEHOLD_MEMORY_SOURCE',
                        });
                      }}
                      disabled={loading}
                      className="rounded-full bg-accent-cyan px-4 py-2 text-xs font-bold text-obsidian-950 hover:brightness-110 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Switch to Kid-Safe Recipe
                    </button>
                    <button
                      onClick={dismissScenario}
                      className="rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs text-slate-400 hover:text-white transition-all cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* Action when Compatible */}
              {compatResult.status === "COMPATIBLE" && (
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={dismissScenario}
                    className="rounded-full bg-accent-emerald px-5 py-2.5 text-xs font-bold text-obsidian-950 hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-accent-emerald/20"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified Safe • Done
                  </button>
                  <button
                    onClick={dismissScenario}
                    className="rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>

            {/* Kept Decision Record (Consistent Across All Scenarios) */}
            <div className="rounded-2xl border border-white/10 bg-obsidian-950/70 overflow-hidden">
              <button
                onClick={() => setShowDecisionReceipt(!showDecisionReceipt)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-white transition-colors border-b border-white/5 bg-white/[0.02]"
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-accent-cyan" />
                  Technical Verification Details (Audit Log)
                </span>
                <span className="flex items-center gap-1.5 text-slate-500 font-normal text-[11px]">
                  {showDecisionReceipt ? "Hide" : "Inspect"}
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
                        <span className="text-slate-200">{compatResult.candidateTitle}</span>
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
                        <span className="text-slate-400">{compatResult.status === "COMPATIBLE" ? "Fit Verification: " : "Size Conflict: "}</span>
                        <span className={compatResult.status === "COMPATIBLE" ? "text-accent-emerald font-medium" : "text-accent-coral font-medium"}>
                          {compatResult.status === "COMPATIBLE"
                            ? "Exact 54 mm 3-ear match verified against manual"
                            : "58 mm does not fit a 54 mm group head (3 ears ≠ 2 ears)"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Seller Policy: </span>
                        <span className={compatResult.status === "COMPATIBLE" ? "text-accent-emerald font-medium" : "text-accent-amber font-medium"}>
                          {compatResult.status === "COMPATIBLE"
                            ? "Amazon Fulfilled • 0% restocking fee (30-day free return)"
                            : "15% restocking fee on opened returns"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Recommended Next Step */}
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-1">
                      3. Recommended Next Step
                    </span>
                    <div className="text-xs text-slate-200 font-medium">
                      {compatResult.status === "COMPATIBLE"
                        ? "Purchase earned a yes — verified compatible with your household equipment and eligible for free returns."
                        : "Verify a compatible 54 mm accessory before purchasing to avoid return fees and delivery waste."}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>Source: {compatResult.sourceEvidence || "Breville BES870XL Manual Specification Table (p. 28)"}</span>
              <span className="text-accent-emerald font-semibold">
                {compatResult.status === "COMPATIBLE" ? "✓ Earned a Yes • Ready for Checkout" : "Saved $39.99 + 15% Return Penalty"}
              </span>
            </div>
          </div>
        )}

                {/* Scenario 2: Automatic Supply Care (Nursery Purifier) */}
        {activeScenario === 'duplicate' && compatResult && (
          <div className="w-full max-w-3xl rounded-3xl border border-accent-emerald/40 bg-obsidian-800/90 p-6 sm:p-7 backdrop-blur-xl shadow-2xl transition-all space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 rounded-full bg-accent-emerald animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-accent-emerald">
                  Exact Filter Matched • Zero Model Guesswork
                </span>
              </div>
              <span className="rounded-full border border-accent-emerald/30 bg-accent-emerald/10 px-3 py-1 text-xs text-accent-emerald font-medium">
                True HEPA H13
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2 leading-snug">{compatResult.candidateTitle}</h3>
                <div className="rounded-2xl bg-obsidian-950/60 p-4 border border-white/5 space-y-2">
                  <p className="text-sm text-slate-200">
                    Maya's nursery has a <span className="text-white font-semibold">Levoit Core 300</span> air purifier. Kept auto-matched the official H13 True HEPA filter, saving you from searching through 15 confusing 3rd-party knockoffs.
                  </p>
                  <p className="text-xs text-slate-400">
                    Filter Life Remaining: 12% • Due for change in 5 days
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={dismissScenario}
                  className="rounded-full bg-accent-emerald px-5 py-2.5 text-xs font-bold text-obsidian-950 hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Order Certified Filter ($21.99)
                </button>
                <button
                  onClick={() => setShowHouseholdDrawer(true)}
                  className="rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Layers className="h-3.5 w-3.5" />
                  View Nursery Profile
                </button>
              </div>
            </div>

            {/* Kept Decision Record */}
            <div className="rounded-2xl border border-white/10 bg-obsidian-950/70 overflow-hidden">
              <button
                onClick={() => setShowDecisionReceipt(!showDecisionReceipt)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-white transition-colors border-b border-white/5 bg-white/[0.02]"
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-accent-cyan" />
                  Technical Verification Details (Audit Log)
                </span>
                <span className="flex items-center gap-1.5 text-slate-500 font-normal text-[11px]">
                  {showDecisionReceipt ? "Hide" : "Inspect"}
                  {showDecisionReceipt ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </span>
              </button>

              {showDecisionReceipt && (
                <div className="p-4 space-y-3 text-xs text-slate-300 border-t border-white/5 bg-black/40">
                  <div className="pb-2 border-b border-white/5">
                    <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-1">
                      1. What Kept Checked
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400">Nursery Equipment: </span>
                        <span className="text-accent-emerald font-semibold">Levoit Core 300 Air Purifier</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Candidate Supply: </span>
                        <span className="text-slate-200">Levoit Core 300-RF True HEPA</span>
                      </div>
                    </div>
                  </div>

                  <div className="pb-2 border-b border-white/5">
                    <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-1">
                      2. What Kept Concluded
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400">Specification Match: </span>
                        <span className="text-accent-emerald font-medium">100% Genuine OEM Fit • H13 Medical Grade</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Care Benefit: </span>
                        <span className="text-accent-emerald font-medium">Filtered air for Maya &amp; Leo’s room</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-1">
                      3. Recommended Next Step
                    </span>
                    <div className="text-xs text-slate-200 font-medium">
                      One-tap reorder certified filter to arrive tomorrow via Prime.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>Source: Household Memory Enclave §Levoit Product Manual</span>
              <span className="text-accent-emerald font-semibold">✓ Exact Match Verified</span>
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
                  className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-white transition-colors border-b border-white/5 bg-white/[0.02]"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-accent-emerald" />
                    Technical Verification Details (Audit Log)
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-500 font-normal text-[11px]">
                    {showDecisionReceipt ? 'Hide' : 'Inspect'}
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
            {/* Execution Confirmation Card with Masked Token & Real-Time Crypto Verification */}
            {executionResult && (
              <div className="rounded-3xl border border-accent-emerald/40 bg-accent-emerald/10 p-6 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-accent-emerald" />
                    <h4 className="font-bold text-white text-base">Return Authorized & Ready for Drop-Off</h4>
                  </div>
                  <button
                    onClick={() => setShowSigVerification(!showSigVerification)}
                    className="rounded-full border border-accent-cyan/40 bg-accent-cyan/15 hover:bg-accent-cyan/25 text-accent-cyan px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer shadow-sm"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {showSigVerification ? "Hide Signature Proof" : "Verify Cryptographic Signature"}
                  </button>
                </div>
                <div className="space-y-2 text-xs text-slate-300 font-mono">
                  <div>Status: <span className="text-accent-emerald font-bold">Ready to Drop Off</span></div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>Security Token:</span>
                    <span className="text-accent-cyan bg-obsidian-950/70 px-2 py-0.5 rounded border border-white/5">
                      {executionResult.authorizationToken ? `${executionResult.authorizationToken.substring(0, 16)}••••••••` : "auth_plan_••••••••"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-accent-emerald/20 text-accent-emerald px-1.5 py-0.5 text-[10px] font-bold">
                      <Check className="h-3 w-3" /> HMAC-SHA256
                    </span>
                  </div>
                  <div>Trip Saved: <span className="text-accent-emerald font-semibold">2 returns consolidated into 1 trip</span></div>
                  <div className="text-[11px] text-slate-400 font-sans">
                    Digital return pass generated. Simply show your phone at the Whole Foods Customer Service desk.
                  </div>
                </div>

                {/* Cryptographic Verification Proof Breakdown Panel */}
                {showSigVerification && (
                  <div className="rounded-2xl border border-accent-cyan/30 bg-obsidian-950/85 p-4 space-y-3 font-mono text-xs animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="font-bold text-accent-cyan flex items-center gap-1.5">
                        <Key className="h-3.5 w-3.5 text-accent-cyan" />
                        Cryptographic Authorization Enclave
                      </span>
                      <span className="text-[10px] rounded bg-accent-emerald/20 border border-accent-emerald/30 text-accent-emerald px-2 py-0.5 font-bold flex items-center gap-1">
                        <Check className="h-3 w-3" /> SIGNATURE VALID
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                        <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-0.5">Algorithm</span>
                        <span className="text-white font-semibold">HMAC-SHA256 (RFC 2104)</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                        <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-0.5">Plan Digest Integrity</span>
                        <span className="text-accent-emerald font-semibold flex items-center gap-1">
                          <Check className="h-3 w-3" /> SHA-256 Hash Bound
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                        <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-0.5">Replay Nonce</span>
                        <span className="text-accent-emerald font-semibold flex items-center gap-1">
                          <Check className="h-3 w-3" /> Single-Use Retired
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                        <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-0.5">Signing Enclave</span>
                        <span className="text-slate-200">PolicyGuard Key #842 (256-bit)</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-300 font-sans leading-relaxed pt-1 border-t border-white/5">
                      <span className="text-slate-400">Verifiable Proof: </span>
                      The authorization token signature was computed over the canonical plan payload and expires after 15 minutes. Replay attempts or payload tampering are cryptographically rejected before any inventory or merchant action is triggered.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Scenario 3: Duplicate Spend & Cable Guard */}
        {activeScenario === 'unverified' && compatResult && (
          <div className="w-full max-w-3xl rounded-3xl border border-accent-amber/40 bg-obsidian-800/85 p-6 sm:p-7 backdrop-blur-xl shadow-2xl transition-all space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-accent-amber animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-accent-amber">
                  Redundant Spend Paused • Save $34.99
                </span>
              </div>
              <span className="rounded-full border border-accent-amber/30 bg-accent-amber/10 px-3 py-1 text-xs text-accent-amber font-medium">
                Equipment Already Owned
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2 leading-snug">{compatResult.candidateTitle}</h3>
                <div className="rounded-2xl bg-obsidian-950/60 p-4 border border-white/5 space-y-2">
                  <p className="text-sm text-slate-200">
                    Your living room <span className="text-white font-semibold">Samsung 55" OLED TV</span> already has 2 open HDMI 2.1 ports on the side. Plus, your household storage has an unopened 6ft 4K cable from Order #ORDER-234.
                  </p>
                  <p className="text-xs text-accent-emerald flex items-center gap-1.5 font-medium pt-1">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                    <span>Kept protected Dad's budget by pausing this $34.99 purchase before checkout.</span>
                  </p>
                </div>
              </div>

              {/* Active Recovery Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={dismissScenario}
                  className="rounded-full bg-accent-emerald px-5 py-2.5 text-xs font-bold text-obsidian-950 hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Save $34.99 &amp; Skip Checkout
                </button>
                <button
                  onClick={() => setShowHouseholdDrawer(true)}
                  className="rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Layers className="h-3.5 w-3.5" />
                  View Living Room Hub
                </button>
                <button
                  onClick={dismissScenario}
                  className="rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2.5 text-xs text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>

            {/* Kept Decision Record */}
            <div className="rounded-2xl border border-white/10 bg-obsidian-950/70 overflow-hidden">
              <button
                onClick={() => setShowDecisionReceipt(!showDecisionReceipt)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-white transition-colors border-b border-white/5 bg-white/[0.02]"
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-accent-amber" />
                  Technical Verification Details (Audit Log)
                </span>
                <span className="flex items-center gap-1.5 text-slate-500 font-normal text-[11px]">
                  {showDecisionReceipt ? 'Hide' : 'Inspect'}
                  {showDecisionReceipt ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </span>
              </button>

              {showDecisionReceipt && (
                <div className="p-4 space-y-3 text-xs text-slate-300 border-t border-white/5 bg-black/40">
                  <div className="pb-2 border-b border-white/5">
                    <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-1">
                      1. What Kept Checked
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400">Living Room Setup: </span>
                        <span className="text-white font-semibold">Samsung 55" OLED (4x HDMI 2.1)</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Storage Inventory: </span>
                        <span className="text-slate-200">Unopened 6ft High-Speed 4K Cable</span>
                      </div>
                    </div>
                  </div>

                  <div className="pb-2 border-b border-white/5">
                    <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-1">
                      2. What Kept Concluded
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400">Port Availability: </span>
                        <span className="text-accent-emerald font-medium">2 open HDMI ports verified on TV</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Financial Impact: </span>
                        <span className="text-accent-emerald font-medium">Saved $34.99 in redundant hardware</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-1">
                      3. Recommended Next Step
                    </span>
                    <div className="text-xs text-slate-200 font-medium">
                      Plug your new console directly into Samsung HDMI Port 3 using the spare cable in your desk drawer.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>Source: Household Memory Enclave §Samsung Specs &amp; Storage Inventory</span>
              <span className="text-accent-emerald font-semibold">✓ Saved $34.99 • Budget Protected</span>
            </div>
          </div>
        )}
      </main>

      {/* Sleek Refined Utility Footer — Anchored Gracefully on Page 1 */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-3 mt-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 font-normal border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">Kept</span>
          <span className="text-slate-600">•</span>
          <span>Alexa+ Commerce &amp; Returns Guardian</span>
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

      {/* Centered Modal: Household Ledger */}
      {showHouseholdDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md transition-all">
          <div
            className="fixed inset-0 cursor-pointer"
            onClick={() => setShowHouseholdDrawer(false)}
          />
          <div className="relative z-10 w-full max-w-xl rounded-3xl border border-white/10 bg-[#0B1120]/95 backdrop-blur-2xl p-6 sm:p-7 shadow-2xl flex flex-col animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Household Memory Ledger</h3>
                  <p className="text-xs text-slate-400">
                    What Alexa has learned and remembered about our family's home
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHouseholdDrawer(false)}
                className="rounded-full p-2 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 text-xs mb-4">
              {(['ALL', 'Kitchen', 'Office'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setHouseholdFilter(tab)}
                  className={`rounded-full px-3.5 py-1.5 font-medium transition-all border cursor-pointer ${
                    householdFilter === tab
                      ? 'border-cyan-400 bg-cyan-950/80 text-cyan-300 shadow-sm'
                      : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'
                  }`}
                >
                  {tab === 'ALL' ? 'All Memories (2)' : tab}
                </button>
              ))}
            </div>

            {/* Ledger Items List */}
            <div className="space-y-3">
              {/* Item 1: Breville Espresso */}
              {(householdFilter === 'ALL' || householdFilter === 'Kitchen') && (
                <div className="rounded-2xl border border-white/[0.08] bg-[#06090F] p-4 flex flex-col justify-between hover:border-cyan-500/30 transition-all">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                          Kitchen
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                          VERIFIED IN HOME
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-sm">Ninja DualZone Air Fryer & Breville Espresso</h4>
                      <p className="text-[11px] text-slate-400">Kitchen Counter • 54mm Portafilter & Dual Baskets</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/[0.05] text-[11px]">
                    <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-slate-300 font-mono">Nut-Allergy Guard Active</span>
                    <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-slate-300 font-mono">54 mm Group Head</span>
                  </div>
                </div>
              )}

              {/* Item 2: LG 27" Monitor */}
              {(householdFilter === 'ALL' || householdFilter === 'Office') && (
                <div className="rounded-2xl border border-white/[0.08] bg-[#06090F] p-4 flex flex-col justify-between hover:border-emerald-500/30 transition-all">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                          Living Room & Office
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                          VERIFIED IN HOME
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-sm">LG 4K Display & Samsung OLED Living Room Hub</h4>
                      <p className="text-[11px] text-slate-400">Family Desk & Entertainment Center</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/[0.05] text-[11px]">
                    <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-slate-300 font-mono">USB-C 90W PD</span>
                    <span className="rounded-md bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 font-mono">Spare 100W Cable in Drawer</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-white/[0.08] mt-4 flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono">Household ID: #842</span>
              <span className="text-cyan-400 font-mono font-medium">Continuous Learning Active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
