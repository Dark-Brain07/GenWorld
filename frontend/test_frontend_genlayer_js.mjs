import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

const CONTRACT_ADDRESS = '0xCf6B224440958F0360AbaE1e2b453c0cE24Ea8C2';

async function main() {
  console.log('='.repeat(75));
  console.log('  TESTING FRONTEND TRANSACTION EXECUTION VIA GENLAYER-JS PIPELINE ');
  console.log('='.repeat(75));

  // 1. Create a fresh session account for the frontend user
  const account = createAccount();
  const counterparty = createAccount();
  console.log(`[+] Frontend Session Signer Address: ${account.address}`);
  console.log(`[+] Counterparty Address:            ${counterparty.address}`);

  const client = createClient({
    chain: studionet,
    account: account,
  });

  // 2. Read Protocol via view call
  console.log('\n[*] Reading get_protocol() from StudioNet...');
  const protocol = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_protocol',
    args: [],
  });
  console.log(`[+] Protocol output: ${protocol}`);

  // 3. Define a new multi-stakeholder session
  const testSessionId = `frontend_live_${Date.now().toString(36)}`;
  const domain = [
    {
      id: "grid_frequency",
      meaning: "Frequency stability standard for power distribution",
      values: [50, 60]
    },
    {
      id: "backup_cooling",
      meaning: "Auxiliary cooling mode for server cluster",
      values: ["evaporative", "liquid_nitrogen"]
    }
  ];

  console.log(`\n[+] Dispatching write transaction: create_session('${testSessionId}')...`);
  const createTxHash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'create_session',
    args: [testSessionId, [account.address, counterparty.address], JSON.stringify(domain)],
  });

  console.log(`[+] create_session Transaction Broadcast Hash: ${createTxHash}`);
  console.log(`[+] Explorer URL: https://explorer-studio.genlayer.com/tx/${createTxHash}`);
  console.log('[*] Polling validator committee quorum until FINALIZED...');

  const createReceipt = await client.waitForTransactionReceipt({
    hash: createTxHash,
    status: 'FINALIZED',
    interval: 3000,
    retries: 90,
  });

  console.log('[+] create_session successfully FINALIZED with consensus on StudioNet!');

  // 4. Seal condition from the frontend account
  console.log(`\n[+] Dispatching write transaction: seal_conditions('${testSessionId}')...`);
  const sealTxHash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'seal_conditions',
    args: [testSessionId, ["Frequency standard must be 60 Hz to match turbine generators."]],
  });

  console.log(`[+] seal_conditions Transaction Broadcast Hash: ${sealTxHash}`);
  console.log(`[+] Explorer URL: https://explorer-studio.genlayer.com/tx/${sealTxHash}`);
  console.log('[*] Polling validator committee quorum until FINALIZED...');

  const sealReceipt = await client.waitForTransactionReceipt({
    hash: sealTxHash,
    status: 'FINALIZED',
    interval: 3000,
    retries: 90,
  });

  console.log('[+] seal_conditions successfully FINALIZED with consensus on StudioNet!');

  // 5. Query verified on-chain state
  console.log(`\n[*] Verifying on-chain state for '${testSessionId}'...`);
  const liveState = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_session',
    args: [testSessionId],
  });

  console.log('[+] Verified On-Chain State from GenLayer:');
  console.log(JSON.stringify(JSON.parse(liveState), null, 2));

  // 6. Query current negotiation state hash via get_state_hash
  console.log(`\n[*] Fetching get_state_hash('${testSessionId}') for optimistic concurrency verification...`);
  const liveStateHash = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_state_hash',
    args: [testSessionId],
  });
  console.log(`[+] Returned State Hash: ${liveStateHash}`);
  if (typeof liveStateHash !== 'string' || liveStateHash.length !== 64) {
    throw new Error(`Expected 64-char state hash string, got: ${liveStateHash}`);
  }
  console.log('[+] Confirmed valid 64-character SHA-256 state hash returned by GenLayer contract!');

  console.log('\n' + '='.repeat(75));
  console.log('  FRONTEND GENLAYER-JS LIVE TRANSACTION VERIFICATION COMPLETE! ');
  console.log('='.repeat(75));
}

main().catch((err) => {
  console.error('[-] Error executing frontend transaction test:', err);
  process.exit(1);
});
