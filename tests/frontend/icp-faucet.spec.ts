import { test } from '@playwright/test';
import { 
  setupFaucetTest, 
  cleanupFaucetTest, 
  requestTokensFromFaucet, 
  FaucetTestConfig 
} from './test-utils.js';

const ICP_ACCOUNT_CONFIG: FaucetTestConfig = {
  identifier: 'f0da8debe354b98d21be4fe41f0d5fbe403763f22cc6f6b6850cc390d8b33e77',
  canisterUrl: 'http://nqoci-rqaaa-aaaap-qp53q-cai.localhost:4943/',
  deployCommand: 'just deploy',
  tokenType: 'TESTICP',
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

const ICP_PRINCIPAL_CONFIG: FaucetTestConfig = {
  identifier: 'uqqxf-5h777-77774-qaaaa-cai',
  canisterUrl: 'http://nqoci-rqaaa-aaaap-qp53q-cai.localhost:4943/',
  deployCommand: 'just deploy',
  tokenType: 'TESTICP',
  balanceCommand: (identifier: string) => 
    `dfx canister call testicp-ledger icrc1_balance_of '(record { owner = principal "${identifier}"})'`,
  parseBalance: (result: string) => {
    const balanceMatch = result.match(/([0-9_]+)\s*:\s*nat/);
    if (!balanceMatch) {
      throw new Error(`Could not parse balance from result: ${result}`);
    }
    return parseInt(balanceMatch[1].replace(/_/g, ''));
  },
  balanceUnit: 'tokens',
  expectedBalance: 1_000_000_000 // 1 billion tokens
};

test.describe('ICP Faucet End-to-End Tests', () => {
    test.beforeAll(async () => {
      await setupFaucetTest();
    });

    test('should request TESTICP tokens using Account Identifier', async ({ page }) => {
      await requestTokensFromFaucet(page, ICP_ACCOUNT_CONFIG);
    });
    
    test('should request TESTICP tokens using Principal', async ({ page }) => {
      await requestTokensFromFaucet(page, ICP_PRINCIPAL_CONFIG);
    });
    
    test.afterAll(async () => {
      cleanupFaucetTest();
    });
}); 
