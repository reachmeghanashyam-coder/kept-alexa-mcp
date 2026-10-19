import { CandidateItem, HouseholdItemRecord } from './types.js';

export const SEEDED_HOUSEHOLD_ITEMS: HouseholdItemRecord[] = [
  {
    id: 'item_owned_espresso_01',
    orderId: 'ORDER-102-NOV2024',
    productTitle: 'Breville Barista Express Espresso Machine (Brushed Stainless Steel)',
    brand: 'Breville',
    modelNumber: 'BES870XL',
    category: 'Kitchen Appliances',
    lifecycleState: 'OWNED_IN_HOME',
    purchaseDate: '2024-11-14T10:00:00.000Z',
    deliveryDate: '2024-11-16T14:30:00.000Z',
    verifiedSpecs: {
      portafilterSizeMm: 54,
      earCount: 3,
      groupHeadType: 'proprietary_54mm_breville',
      waterTankCapacityLiters: 2.0,
    },
    includedAccessories: [
      '54mm Stainless Steel Portafilter',
      'Single Wall & Dual Wall Filter Baskets (1 & 2 Cup)',
      'Stainless Steel Milk Jug',
      'Integrated Tamper',
    ],
    conditionNotes: 'Operating normally in main kitchen counter position',
    policyFixture: {
      returnWindowDays: 30,
      restockingFeePercent: 0,
      dropOffEligibility: {
        wholeFoodsBoxFree: true,
        upsDropoffBoxed: true,
        kohlsDropoffBoxFree: true,
      },
      sourceDocumentId: 'DOC-BREVILLE-SPEC-2024',
      sourceCitation: 'Breville BES870XL User Manual Specification Table p. 28 (54mm 3-ear portafilter)',
      isThirdPartySeller: false,
      termsVerified: true,
    },
    originLabel: 'DEMO_SEEDED_FIXTURE',
  },
  {
    id: 'item_owned_monitor_02',
    orderId: 'ORDER-234-FEB2025',
    productTitle: 'LG 27UP850-W 27-inch 4K UHD IPS Monitor with USB-C 90W PD',
    brand: 'LG',
    modelNumber: '27UP850-W',
    category: 'Electronics & Office',
    lifecycleState: 'OWNED_IN_HOME',
    purchaseDate: '2025-02-10T16:15:00.000Z',
    deliveryDate: '2025-02-12T11:00:00.000Z',
    verifiedSpecs: {
      screenSizeInches: 27,
      vesaPattern: '100x100',
      powerDeliveryWatts: 90,
      includedUsbCPowerCable: true,
    },
    includedAccessories: [
      'USB-C 90W 1m Video & Power Cable',
      'DisplayPort 1.4 Cable',
      'Original Desk Stand Base',
    ],
    policyFixture: {
      returnWindowDays: 30,
      restockingFeePercent: 0,
      dropOffEligibility: {
        wholeFoodsBoxFree: true,
        upsDropoffBoxed: true,
        kohlsDropoffBoxFree: false,
      },
      sourceDocumentId: 'DOC-LG-27UP850-SPEC',
      sourceCitation: 'LG Official Product Datasheet §Packaging Contents (Includes 90W USB-C 1m cable)',
      isThirdPartySeller: false,
      termsVerified: true,
    },
    originLabel: 'DEMO_SEEDED_FIXTURE',
  },
  {
    id: 'item_trial_kettle_03',
    orderId: 'ORDER-842-OCT2026',
    productTitle: 'Cosori Electric Gooseneck Glass Kettle 0.8L Rapid Boil',
    brand: 'Cosori',
    modelNumber: 'CO108-NK',
    category: 'Kitchen Appliances',
    lifecycleState: 'DELIVERED_IN_TRIAL',
    purchaseDate: '2026-10-15T09:20:00.000Z',
    deliveryDate: '2026-10-18T13:45:00.000Z',
    trialDeadlineDate: '2026-11-17T23:59:59.000Z', // 30-day trial active
    verifiedSpecs: {
      capacityLiters: 0.8,
      voltage: 120,
      material: 'Borosilicate Glass & 304 Stainless Steel',
    },
    includedAccessories: [
      'Glass Kettle Vessel',
      '360-Degree Swivel Power Base',
      'Quick Start Instruction Card',
    ],
    conditionNotes: 'Customer unboxed item with visible structural fracture on handle seam',
    policyFixture: {
      returnWindowDays: 30,
      restockingFeePercent: 0,
      dropOffEligibility: {
        wholeFoodsBoxFree: true,
        upsDropoffBoxed: true,
        kohlsDropoffBoxFree: true,
      },
      sourceDocumentId: 'DOC-AMZ-STD-RETURN-POL',
      sourceCitation: 'Amazon Standard Return Policy §Electronics & Small Appliances (Free Whole Foods drop-off, no box/label required)',
      isThirdPartySeller: false,
      termsVerified: true,
    },
    originLabel: 'DEMO_SEEDED_FIXTURE',
  },
  {
    id: 'item_trial_sweater_04',
    orderId: 'ORDER-842-OCT2026',
    productTitle: 'State Cashmere 100% Pure Merino Wool Turtleneck Sweater (Medium, Heather Charcoal)',
    brand: 'State Cashmere',
    modelNumber: 'SC-M-882',
    category: 'Apparel & Fashion',
    lifecycleState: 'DELIVERED_IN_TRIAL',
    purchaseDate: '2026-10-15T09:20:00.000Z',
    deliveryDate: '2026-10-18T13:45:00.000Z',
    trialDeadlineDate: '2026-11-17T23:59:59.000Z', // 30-day trial active
    verifiedSpecs: {
      size: 'Medium',
      material: '100% Merino Wool',
      color: 'Heather Charcoal',
    },
    includedAccessories: [
      'Original Manufacturer Hangtag',
      'Protective Zipper Garment Bag',
    ],
    conditionNotes: 'Unworn, pristine condition with tags intact; customer reports size Medium runs tight across shoulders',
    policyFixture: {
      returnWindowDays: 30,
      restockingFeePercent: 0,
      dropOffEligibility: {
        wholeFoodsBoxFree: true,
        upsDropoffBoxed: true,
        kohlsDropoffBoxFree: true,
      },
      sourceDocumentId: 'DOC-AMZ-FASH-POL-2026',
      sourceCitation: 'Amazon Fashion Free Return Policy §Garments (Eligible for Whole Foods box-free/label-free drop-off with tags attached)',
      isThirdPartySeller: false,
      termsVerified: true,
    },
    originLabel: 'DEMO_SEEDED_FIXTURE',
  },
];

export const BENCHMARK_CANDIDATES: Record<string, CandidateItem> = {
  incompatiblePortafilter: {
    id: 'cand_58mm_portafilter',
    title: 'MATOW 58mm Bottomless Portafilter with Walnut Handle (2 Ears)',
    brand: 'MATOW',
    category: 'Kitchen Appliances',
    targetSpecs: {
      portafilterSizeMm: 58,
      earCount: 2,
    },
    sellerPolicy: {
      isThirdParty: true,
      restockingFeePercent: 15,
      returnWindowDays: 30,
      termsExplicitlyStated: true,
    },
  },
  duplicateCable: {
    id: 'cand_usbc_90w_cable',
    title: 'Anker Powerline III USB-C to USB-C 100W Charging & 4K Display Cable (1m)',
    brand: 'Anker',
    category: 'Electronics & Office',
    targetSpecs: {
      cableType: 'USB-C to USB-C',
      powerDeliveryWatts: 100,
      lengthMeters: 1.0,
    },
    sellerPolicy: {
      isThirdParty: false,
      restockingFeePercent: 0,
      returnWindowDays: 30,
      termsExplicitlyStated: true,
    },
  },
  unverifiedThirdPartyItem: {
    id: 'cand_unverified_grinder_collar',
    title: 'Universal Custom Espresso Dosing Ring & Needle Distribution Collar Tool',
    brand: 'Generic Third Party Seller',
    category: 'Kitchen Appliances',
    targetSpecs: {}, // Missing dimensions
    sellerPolicy: {
      isThirdParty: true,
      termsExplicitlyStated: false, // Missing return policy terms
    },
  },
};
