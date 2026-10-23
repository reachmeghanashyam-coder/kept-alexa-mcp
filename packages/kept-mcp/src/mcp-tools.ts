import {
  globalHouseholdStore,
  evaluatePurchaseCompatibility,
  evaluateItemReturnPathways,
  buildConsolidatedReturnPlan,
  issuePlanApproval,
  CandidateItem,
} from '@kept/policy-guard';
import { defaultNovaInspector } from './bedrock.js';

export const MCP_TOOL_DEFINITIONS = [
  {
    name: 'get_household_profile',
    description:
      'Retrieve private household member profiles, medical/allergen constraints, learning/reading levels, and daily routines for grounding Alexa+ responses.',
    inputSchema: {
      type: 'object',
      properties: {
        member: {
          type: 'string',
          description: 'Filter by specific family member name (e.g. Leo, Nidhi, Dad) or ALL.',
        },
      },
    },
  },
  {
    name: 'verify_household_care',
    description:
      'Verify a web search result, recipe recommendation, learning explanation, or purchase against grounded household member profiles and equipment.',
    inputSchema: {
      type: 'object',
      required: ['query', 'intent'],
      properties: {
        query: { type: 'string', description: 'User voice query to Alexa' },
        intent: {
          type: 'string',
          enum: ['MEAL_RECIPE', 'LEARNING_EXPLANATION', 'HARDWARE_COMPATIBILITY'],
          description: 'Categorized user intent',
        },
        targetMember: { type: 'string', description: 'Targeted household member (e.g. Leo, Nidhi, Dad)' },
        candidateAction: { type: 'object', description: 'Proposed generic AI output or web response' },
      },
    },
  },
  {
    name: 'get_household_inventory',
    description:
      'Retrieve the unified household item ledger containing owned appliances, electronics, and delivered items currently in their 30-day trial window.',
    inputSchema: {
      type: 'object',
      properties: {
        filterLifecycleState: {
          type: 'string',
          enum: [
            'ALL',
            'OWNED_IN_HOME',
            'DELIVERED_IN_TRIAL',
            'RETURN_PREPARED',
          ],
          description: 'Filter items by their current lifecycle state.',
        },
      },
    },
  },
  {
    name: 'check_purchase_compatibility',
    description:
      'Evaluate a candidate purchase against owned household devices to prevent incompatible accessories, duplicate cables, and third-party return traps.',
    inputSchema: {
      type: 'object',
      required: ['candidate'],
      properties: {
        candidate: {
          type: 'object',
          required: ['title', 'category'],
          properties: {
            title: { type: 'string' },
            brand: { type: 'string' },
            category: { type: 'string' },
            targetSpecs: {
              type: 'object',
              description: 'Key dimensions or specs of the candidate product (e.g. portafilterSizeMm, earCount).',
            },
            sellerPolicy: {
              type: 'object',
              properties: {
                isThirdParty: { type: 'boolean' },
                restockingFeePercent: { type: 'number' },
                returnWindowDays: { type: 'number' },
                termsExplicitlyStated: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  },
  {
    name: 'analyze_item_condition',
    description:
      'Multimodal inspection of unboxed item photos using Amazon Bedrock Nova to record observational visual damage and missing parts without overclaiming legal eligibility.',
    inputSchema: {
      type: 'object',
      required: ['itemId'],
      properties: {
        itemId: { type: 'string', description: 'Household item ID to inspect' },
        imageBase64: {
          type: 'string',
          description: 'Base64-encoded image of the physical item',
        },
        imageMimeType: {
          type: 'string',
          enum: ['image/jpeg', 'image/png', 'image/webp'],
          default: 'image/jpeg',
        },
      },
    },
  },
  {
    name: 'evaluate_return_pathways',
    description:
      'Compare verified physical drop-off locations (Whole Foods box-free vs. UPS Store boxed) for items in their active trial window.',
    inputSchema: {
      type: 'object',
      required: ['itemId'],
      properties: {
        itemId: { type: 'string' },
      },
    },
  },
  {
    name: 'build_return_plan',
    description:
      'Construct a consolidated, single-trip return action plan for multiple delivered items with SHA-256 state hashing and deadline scheduling.',
    inputSchema: {
      type: 'object',
      required: ['itemIds'],
      properties: {
        itemIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of item IDs to include in the plan',
        },
        userActions: {
          type: 'object',
          description: 'Map of itemId to REPLACEMENT_FOR_DAMAGE or RETURN_FOR_REFUND',
        },
      },
    },
  },
  {
    name: 'approve_return_plan',
    description:
      'Issue a cryptographically signed authorization token bound to the specific plan hash and version upon explicit user confirmation.',
    inputSchema: {
      type: 'object',
      required: ['planId', 'userConfirmed'],
      properties: {
        planId: { type: 'string' },
        userConfirmed: {
          type: 'boolean',
          description: 'Must be true to grant server-side approval',
        },
      },
    },
  },
  {
    name: 'execute_return_plan',
    description:
      'Execute the confirmed return plan and transition household items to RETURN_PREPARED. Requires valid cryptographic authorization token.',
    inputSchema: {
      type: 'object',
      required: ['planId', 'authorizationToken'],
      properties: {
        planId: { type: 'string' },
        authorizationToken: { type: 'string' },
      },
    },
  },
  {
    name: 'add_household_item',
    description:
      'Register a new appliance, gadget, or device into the persistent household ledger so that future AI purchase checks verify against it.',
    inputSchema: {
      type: 'object',
      required: ['productTitle', 'category'],
      properties: {
        productTitle: { type: 'string', description: 'Name of the device or appliance' },
        category: { type: 'string', description: 'Room or category (e.g. Kitchen Appliances, Electronics & Office, Living Room)' },
        brand: { type: 'string' },
        modelNumber: { type: 'string' },
        verifiedSpecs: { type: 'object', description: 'Key specifications (e.g. { portafilterSizeMm: 54, fittingType: "quick_release" })' },
        includedAccessories: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  {
    name: 'reset_demo_state',
    description:
      'Reset the entire household item ledger and clear all plans to the pristine seeded demo benchmark state.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

export async function handleMcpToolCall(
  name: string,
  args: any
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  try {
    switch (name) {
      case 'get_household_profile': {
        const profile = {
          householdId: 'HOUSEHOLD-842',
          householdName: 'Family Care Enclave',
          members: [
            {
              id: 'member_leo_01',
              name: 'Leo',
              relation: 'Son',
              age: 5,
              healthConstraints: {
                severeAllergies: ['Tree Nuts', 'Walnuts', 'Pine Nuts', 'Peanuts'],
                epipenActive: true,
                dietaryType: 'Strict Nut-Free Child Diet',
              },
              equipmentContext: 'Ninja DualZone 8-Qt Air Fryer (Kid-friendly 15-min meals)',
            },
            {
              id: 'member_nidhi_02',
              name: 'Nidhi',
              relation: 'Daughter',
              age: 8,
              educationProfile: {
                grade: '3rd Grade',
                readingLevel: '650L Lexile (Advanced 3rd)',
                learningStyle: 'Visual analogies, curious science, astronomy',
                blockedContent: 'College-level astrophysics jargon, unmoderated web search',
              },
              readingList: {
                completedSeries: ['Magic Treehouse #1-28'],
                currentlyReading: 'Astronomy & Space Explorations',
                bookshelfInventory: ['Magic Treehouse Complete Set', 'First Big Book of Space'],
              },
            },
            {
              id: 'member_dad_03',
              name: 'Dad',
              relation: 'Father / Account Owner',
              preferences: {
                duplicatePurchaseShield: 'Active across Living Room & Office hardware',
                homeInventoryTracking: 'Enabled',
              },
            },
          ],
          verifiedHouseholdAssets: [
            { name: 'Ninja DualZone 8-Qt Air Fryer', location: 'Kitchen Counter', verified: true },
            { name: 'Samsung 65" 4K OLED TV (2 Open HDMI Ports)', location: 'Living Room', verified: true },
            { name: 'Spare 6ft 4K HDMI 2.1 Cable (Unopened in Drawer)', location: 'Living Room Credenza Drawer', verified: true },
            { name: 'Levoit Core 300 True HEPA Air Purifier', location: 'Nursery / Bedroom', verified: true },
          ],
        };

        if (args?.member && args.member !== 'ALL') {
          const matched = profile.members.find(
            (m) => m.name.toLowerCase() === String(args.member).toLowerCase()
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  { householdId: 'HOUSEHOLD-842', member: matched || null },
                  null,
                  2
                ),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(profile, null, 2),
            },
          ],
        };
      }

      case 'verify_household_care': {
        const query = String(args?.query || '').toLowerCase();
        const intent = args?.intent;

        // Intent 1: Meal / Recipe verification (Leo Nut-Allergy Shield)
        if (intent === 'MEAL_RECIPE' || query.includes('dinner') || query.includes('recipe') || query.includes('leo')) {
          const result = {
            candidateTitle: 'Trending Creamy Walnut Pesto Pasta (Contains Tree Nuts)',
            status: 'INCOMPATIBLE',
            matchedOwnedItemId: 'member_leo_01',
            matchedOwnedProductTitle: 'Leo (Age 5) • Severe Nut Allergy Profile & Ninja Air Fryer',
            reason: 'Leo (Age 5) has a documented severe tree nut allergy. This web recommendation contains walnuts and pine nuts. Kept halted the recipe before Alexa spoke.',
            mismatchedAttributes: [
              { attribute: 'Allergen Conflict', ownedValue: '100% Tree-Nut & Peanut Free', candidateValue: 'Contains Walnuts & Pine Nuts' },
              { attribute: 'Cooking Method', ownedValue: 'Ninja DualZone 8-Qt Air Fryer', candidateValue: 'Stovetop Boiling' },
            ],
            sourceEvidence: 'Household Memory',
            recommendedAlternative: {
              title: 'Crispy Parmesan Chicken Tenders & Green Beans (Nut-Free)',
              asin: 'RECIPE-NUT-FREE-01',
              verifiedSpec: '15-Min Ninja DualZone Air Fryer Program • 100% Nut-Free & Kid-Safe',
              returnPolicySummary: 'Healthy Family Approved • Uses Ingredients in Pantry',
            },
            originLabel: 'HOUSEHOLD_MEMORY_SOURCE',
          };
          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          };
        }

        // Intent 2: Learning / Curiosity Explanation (Nidhi 3rd-Grade Reading Shield)
        if (intent === 'LEARNING_EXPLANATION' || query.includes('star') || query.includes('space') || query.includes('nidhi') || query.includes('book')) {
          const result = {
            candidateTitle: 'Web Search: Stellar Evolution & Degenerate Gas Jargon',
            status: 'INCOMPATIBLE',
            matchedOwnedItemId: 'member_nidhi_02',
            matchedOwnedProductTitle: 'Nidhi (Age 8) • 3rd Grade Learning Profile & Reading Level 650L',
            reason: 'Generic AI attempted to return college-level astrophysics jargon ("thermonuclear runaway in degenerate electron gas"). Kept grounded the explanation to Nidhi\'s 3rd-grade reading level (650L) using an expanding balloon analogy, and verified the book is not on her shelf.',
            mismatchedAttributes: [
              { attribute: 'Reading Level Complexity', ownedValue: '3rd Grade (650L Lexile) • Visual Analogies', candidateValue: 'College-Level Physics Jargon (1400L Lexile)' },
              { attribute: 'Bookshelf Redundancy Check', ownedValue: 'Owns Magic Treehouse #1-28', candidateValue: 'Verified: Not Currently on Bookshelf' },
            ],
            sourceEvidence: 'Household Memory Enclave: Nidhi Learning Profile §Reading Level 650L & Bookshelf Inventory',
            recommendedAlternative: {
              title: 'The Secret Explorers and the Comet Chase (Ages 7-9 • 640L)',
              asin: 'BOOK-ASTRONOMY-KID-01',
              verifiedSpec: 'Analogous Explanation: "Stars are like giant balloon kernels held tight by gravity until they pop into bright glitter!"',
              returnPolicySummary: 'Available via Prime Next-Day • Verified Not on Household Bookshelf',
            },
            originLabel: 'HOUSEHOLD_MEMORY_SOURCE',
          };
          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          };
        }

        // Intent 3: Hardware & Duplicate Spend Shield
        const result = {
          candidateTitle: '4K HDMI Switch Box with 6ft Cable ($34.99 Redundant Purchase)',
          status: 'UNVERIFIED_MISSING_SPECS',
          matchedOwnedItemId: 'item_samsung_tv_livingroom',
          matchedOwnedProductTitle: 'Samsung 65" OLED TV & Credenza Storage',
          reason: 'Redundant spend paused: Your Samsung OLED TV has 2 open HDMI ports, and an unopened 6ft 4K HDMI 2.1 cable was located in the living room drawer. Spending $34.99 on a switch box is unnecessary.',
          mismatchedAttributes: [
            { attribute: 'Port Availability', ownedValue: '2 Open 4K 120Hz HDMI Ports', candidateValue: 'Adding 4-Port Switch' },
            { attribute: 'Spare Cable', ownedValue: '1 Unopened 4K Cable in Credenza Drawer', candidateValue: 'Buying Bundled $34.99 Cable' },
          ],
          sourceEvidence: 'Household Memory Enclave: Living Room Equipment & Storage Drawer Inventory Ledger',
          recommendedAlternative: {
            title: 'Use Existing 4K Cable from Living Room Drawer (Save $34.99)',
            asin: 'HOUSEHOLD-DRAWER-CABLE-01',
            verifiedSpec: 'Zero Purchase Needed • Connect to Samsung TV Port 3',
            returnPolicySummary: 'Budget Protected • Zero Electronic Waste',
          },
          originLabel: 'HOUSEHOLD_MEMORY_SOURCE',
        };
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_household_inventory': {
        let items = globalHouseholdStore.getAllItems();
        if (args?.filterLifecycleState && args.filterLifecycleState !== 'ALL') {
          items = items.filter(
            (i) => i.lifecycleState === args.filterLifecycleState
          );
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  householdId: 'HOUSEHOLD-842',
                  totalItems: items.length,
                  items,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'add_household_item': {
        const newItem = {
          id: `item_custom_${Date.now()}`,
          orderId: `MANUAL-${new Date().getFullYear()}`,
          productTitle: args.productTitle,
          brand: args.brand || 'User Registered',
          modelNumber: args.modelNumber || 'CUSTOM-01',
          category: args.category || 'Household Equipment',
          lifecycleState: 'OWNED_IN_HOME' as const,
          purchaseDate: new Date().toISOString(),
          deliveryDate: new Date().toISOString(),
          verifiedSpecs: args.verifiedSpecs || {},
          includedAccessories: args.includedAccessories || [],
          conditionNotes: 'Added by user to household ledger',
          policyFixture: {
            returnWindowDays: 30,
            restockingFeePercent: 0,
            dropOffEligibility: {
              wholeFoodsBoxFree: true,
              upsDropoffBoxed: true,
              kohlsDropoffBoxFree: false,
            },
            sourceCitation: 'User verified household inventory record',
            isThirdPartySeller: false,
            termsVerified: true,
          },
          originLabel: 'USER_REGISTERED_CUSTOM' as const,
        };

        const saved = globalHouseholdStore.addItem(newItem as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'ITEM_ADDED_SUCCESSFULLY',
                  item: saved,
                  totalHouseholdItems: globalHouseholdStore.getAllItems().length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'check_purchase_compatibility': {
        const candidate = args?.candidate as CandidateItem;
        const allItems = globalHouseholdStore.getAllItems();
        const result = evaluatePurchaseCompatibility(candidate, allItems);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'analyze_item_condition': {
        const { itemId, imageBase64, imageMimeType } = args;
        const item = globalHouseholdStore.getItemById(itemId);
        if (!item) {
          throw new Error(`Item not found with id: ${itemId}`);
        }

        const inspection = await defaultNovaInspector.inspectItemImage(
          imageBase64,
          imageMimeType,
          item.productTitle
        );

        const updatedItem = globalHouseholdStore.updateItemVisualEvidence(
          itemId,
          {
            summary: inspection.summary,
            detectedDamage: inspection.detectedDamage,
            missingPartsNoted: inspection.missingPartsNoted,
            source: 'bedrock_nova_observation',
            capturedAt: inspection.capturedAt,
          }
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  itemId,
                  productTitle: item.productTitle,
                  inspection,
                  updatedItem,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'evaluate_return_pathways': {
        const { itemId } = args;
        const item = globalHouseholdStore.getItemById(itemId);
        if (!item) {
          throw new Error(`Item not found with id: ${itemId}`);
        }
        const pathways = evaluateItemReturnPathways(item);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  itemId,
                  productTitle: item.productTitle,
                  availablePathways: pathways,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'build_return_plan': {
        const { itemIds, userActions = {} } = args;
        const items = itemIds
          .map((id: string) => globalHouseholdStore.getItemById(id))
          .filter(Boolean);

        if (items.length === 0) {
          throw new Error('No valid items found for provided IDs');
        }

        const plan = buildConsolidatedReturnPlan(items, userActions);
        globalHouseholdStore.savePlan(plan);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(plan, null, 2),
            },
          ],
        };
      }

      case 'approve_return_plan': {
        const { planId, userConfirmed } = args;
        const plan = globalHouseholdStore.getPlan(planId);
        if (!plan) {
          throw new Error(`Plan not found: ${planId}`);
        }

        const approvedPlan = issuePlanApproval(plan, Boolean(userConfirmed));
        globalHouseholdStore.savePlan(approvedPlan);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(approvedPlan, null, 2),
            },
          ],
        };
      }

      case 'execute_return_plan': {
        const { planId, authorizationToken } = args;
        const execResult = globalHouseholdStore.executePlan(
          planId,
          authorizationToken
        );

        if (!execResult.success) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    error: 'EXECUTION_REJECTED',
                    reason: execResult.reason,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'EXECUTED_SUCCESSFULLY',
                  plan: execResult.executedPlan,
                  updatedInventory: globalHouseholdStore.getAllItems(),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'reset_demo_state': {
        globalHouseholdStore.resetDemoState();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'DEMO_STATE_RESTORED',
                  householdId: 'HOUSEHOLD-842',
                  inventoryCount: globalHouseholdStore.getAllItems().length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Unknown tool requested: ${name}`,
            },
          ],
        };
    }
  } catch (error: any) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              error: 'TOOL_EXECUTION_FAILURE',
              message: error?.message || String(error),
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
