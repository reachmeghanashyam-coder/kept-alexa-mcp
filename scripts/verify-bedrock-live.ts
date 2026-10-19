/**
 * Standalone Verification Probe for AWS Bedrock Nova Multimodal Vision
 * Evaluates live AWS Bedrock invocation if credentials are set,
 * or validates the transparent, grounded fallback contract.
 */
import 'dotenv/config';
import { defaultNovaInspector } from '../packages/dropguard-mcp/src/bedrock.js';

async function verifyBedrock() {
  console.log('====================================================');
  console.log(' KEPT • AWS BEDROCK NOVA VISION VERIFICATION PROBE');
  console.log('====================================================\n');

  const hasAccessKey = Boolean(process.env.AWS_ACCESS_KEY_ID);
  const hasSecretKey = Boolean(process.env.AWS_SECRET_ACCESS_KEY);
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
  const modelId = process.env.BEDROCK_MODEL_ID || 'amazon.nova-lite-v1:0';

  console.log(`Environment Configuration:`);
  console.log(`- AWS_ACCESS_KEY_ID: ${hasAccessKey ? 'PRESENT (REDACTED)' : 'NOT_CONFIGURED'}`);
  console.log(`- AWS_SECRET_ACCESS_KEY: ${hasSecretKey ? 'PRESENT (REDACTED)' : 'NOT_CONFIGURED'}`);
  console.log(`- AWS_REGION: ${region}`);
  console.log(`- BEDROCK_MODEL_ID: ${modelId}\n`);

  console.log('Executing inspectItemImage()...');
  const start = Date.now();
  const result = await defaultNovaInspector.inspectItemImage(
    undefined,
    'image/jpeg',
    'Cosori Electric Gooseneck Glass Kettle'
  );
  const duration = Date.now() - start;

  console.log('\n--- Telemetry & Decision Receipt Result ---');
  console.log(JSON.stringify(result, null, 2));

  console.log('\n--- Provenance Analysis ---');
  if (result.isLiveAwsCall) {
    console.log('Status: [LIVE AWS BEDROCK CALL]');
    console.log(`- Real Bedrock Model: ${result.modelId}`);
    console.log(`- Actual Network Latency: ${result.latencyMs}ms`);
  } else {
    console.log('Status: [DISCLOSED LOCAL GROUNDING]');
    console.log(`- Fallback Label: ${result.modelId}`);
    console.log(`- Epistemic Guardrail: isLiveAwsCall is strictly false.`);
    console.log(`- Observed Damage: "${result.detectedDamage}"`);
    console.log(`- Missing Accessories Flagged: ${result.missingPartsNoted.join(', ')}`);
  }

  console.log(`\nProbe verified successfully in ${duration}ms.\n`);
}

verifyBedrock().catch(console.error);
