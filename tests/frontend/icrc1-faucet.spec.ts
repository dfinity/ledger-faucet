import { test } from '@playwright/test';
import { 
  setupFaucetTest, 
  cleanupFaucetTest, 
  requestTokensFromFaucet, 
  FaucetTestConfig 
} from './test-utils.js';

const ICRC1_CONFIG: FaucetTestConfig = {
  identifier: 'uqqxf-5h777-77774-qaaaa-cai',
  canisterUrl: 'http://nqoci-rqaaa-aaaap-qp53q-cai.localhost:4943/',
  deployCommand: 'just deploy',
  tokenType: 'TICRC1',
  balanceCommand: (identifier: string) => 
    `dfx canister call ticrc1-ledger icrc1_balance_of '(record { owner = principal "${identifier}"})'`,
  parseBalance: (result: string) => {
    const balanceMatch = result.match(/([0-9_]+)/);
    if (!balanceMatch) {
      throw new Error(`Could not parse balance from result: ${result}`);
    }
    return parseInt(balanceMatch[1].replace(/_/g, ''));
  },
  expectedBalance: 1_000_000_000 // 1 billion tokens
};

test.describe('ICRC1 Faucet End-to-End Test', () => {
  test.beforeAll(async () => {
    await setupFaucetTest();
  });

  test('should request tokens and verify balance increase', async ({ page }) => {
    await requestTokensFromFaucet(page, ICRC1_CONFIG);
  });
  
  test.afterAll(async () => {
    cleanupFaucetTest();
  });
}); 
