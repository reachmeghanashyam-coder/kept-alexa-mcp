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
