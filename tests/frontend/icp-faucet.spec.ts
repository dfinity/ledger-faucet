import { test } from '@playwright/test';
import { 
  setupFaucetTest, 
  cleanupFaucetTest, 
  requestTokensFromFaucet, 
  FaucetTestConfig 
} from './test-utils.js';

const ICP_CONFIG: FaucetTestConfig = {
  identifier: 'f0da8debe354b98d21be4fe41f0d5fbe403763f22cc6f6b6850cc390d8b33e77',
  canisterUrl: 'http://nqoci-rqaaa-aaaap-qp53q-cai.localhost:4943/',
  deployCommand: 'just deploy testicp',
  balanceCommand: (identifier: string) => 
    `dfx canister call testicp-ledger account_balance_dfx '(record { account = "${identifier}"})'`,
  parseBalance: (result: string) => {
    const balanceMatch = result.match(/e8s\s*=\s*([0-9_]+)/);
    if (!balanceMatch) {
      throw new Error(`Could not parse balance from result: ${result}`);
    }
    return parseInt(balanceMatch[1].replace(/_/g, ''));
  },
  balanceUnit: 'e8s',
  expectedBalance: 1_000_000_000 // 1 billion e8s
};

test.describe('ICP Faucet End-to-End Test', () => {
  test.beforeAll(async () => {
    await setupFaucetTest(ICP_CONFIG);
  });

  test('should request tokens and verify balance increase', async ({ page }) => {
    await requestTokensFromFaucet(page, ICP_CONFIG);
  });
  
  test.afterAll(async () => {
    cleanupFaucetTest();
  });
}); 
