import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const TEST_PRINCIPAL = 'uqqxf-5h777-77774-qaaaa-cai';
const CANISTER_URL = 'http://pwwqf-yaaaa-aaaap-qp5wq-cai.localhost:4943/';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to run shell commands with real-time output
function runCommand(command: string, showOutput: boolean = false): string {
  try {
    const options: any = {
      encoding: 'utf-8',
      cwd: path.join(__dirname, '../..'),
      timeout: 300000 // 5 minutes timeout for deployment
    };
    
    if (showOutput) {
      options.stdio = 'inherit';
    }
    
    const result = execSync(command, options);
    return result ? result.toString().trim() : '';
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error);
    throw error;
  }
}

// Helper function to start dfx in background
function startDfxBackground(): void {
  try {
    console.log('🔄 Starting dfx with clean state (background)...');
    execSync('dfx start --clean --background', {
      cwd: path.join(__dirname, '../..'),
      stdio: 'inherit',
      timeout: 120000 // 2 minutes timeout for startup
    });
  } catch (error) {
    console.error('Failed to start dfx:', error);
    throw error;
  }
}

test.describe('ICRC1 Faucet End-to-End Test', () => {
  test.beforeAll(async () => {
    startDfxBackground();
    console.log('✅ dfx started successfully');
    
    // Wait a bit for dfx to be fully ready
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('🚀 Deploying ICRC1 faucet...');
    runCommand('just deploy-icrc1', true); // Show output in real-time
    console.log('✅ Deployment completed');
    
    // Wait a bit for services to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));
  });

  test('should request tokens and verify balance increase', async ({ page }) => {
    // First verify the balance is zero before requesting tokens
    console.log('🔍 Checking initial account balance (should be zero)...');
    const initialBalanceCommand = `dfx canister call ticrc1-ledger icrc1_balance_of '(record { owner = principal "${TEST_PRINCIPAL}"})'`;
    const initialBalanceResult = runCommand(initialBalanceCommand);
    
    console.log(`📊 Initial balance result: ${initialBalanceResult}`);
    
    // Parse the initial balance (ICRC1 format: just a number)
    const initialBalanceMatch = initialBalanceResult.match(/([0-9_]+)/);
    if (!initialBalanceMatch) {
      throw new Error(`Could not parse initial balance from result: ${initialBalanceResult}`);
    }
    
    const initialBalance = parseInt(initialBalanceMatch[1].replace(/_/g, ''));
    console.log(`💰 Initial balance: ${initialBalance}`);
    
    // Verify initial balance is zero
    expect(initialBalance).toBe(0);
    console.log('✅ Confirmed initial balance is zero');
    
    console.log('🌐 Navigating to faucet website...');
    
    // Navigate to the faucet website
    await page.goto(CANISTER_URL);
    
    // Wait for the page to load and find the input field
    console.log('🔍 Looking for principal input field...');
    const principalInput = page.locator('input[type="text"]').first();
    await expect(principalInput).toBeVisible({ timeout: 10000 });
    
    // Fill in the principal
    console.log(`📝 Entering principal: ${TEST_PRINCIPAL}`);
    await principalInput.fill(TEST_PRINCIPAL);
    
    // Find and click the "Request Tokens" button
    console.log('🖱️ Clicking Request Tokens button...');
    const requestButton = page.locator('button').filter({ hasText: /request tokens/i });
    await expect(requestButton).toBeVisible();
    await requestButton.click();
    
    // Wait for the success dialog to appear
    console.log('⏳ Waiting for success dialog...');
    const successDialog = page.locator('text=Success!');
    await expect(successDialog).toBeVisible({ timeout: 30000 });
    
    console.log('✅ Success dialog appeared!');
    
    // Wait a bit more for the transaction to be processed
    await page.waitForTimeout(5000);
    
    // Verify the balance using dfx command
    console.log('💰 Checking account balance...');
    const balanceCommand = `dfx canister call ticrc1-ledger icrc1_balance_of '(record { owner = principal "${TEST_PRINCIPAL}"})'`;
    const balanceResult = runCommand(balanceCommand);
    
    console.log(`📊 Balance result: ${balanceResult}`);
    
    // Parse the balance from the result (ICRC1 format: just a number)
    const balanceMatch = balanceResult.match(/([0-9_]+)/);
    if (!balanceMatch) {
      throw new Error(`Could not parse balance from result: ${balanceResult}`);
    }
    
    const balance = parseInt(balanceMatch[1].replace(/_/g, ''));
    console.log(`🏦 Final balance: ${balance}`);
    
    // Verify that the balance is exactly 1 billion
    const expectedBalance = 1_000_000_000; // 1 billion
    expect(balance).toBe(expectedBalance);
    
    console.log(`🎉 Test completed successfully! Balance is exactly ${expectedBalance.toLocaleString()} (1 billion tokens).`);
  });
  
  test.afterAll(async () => {
    console.log('🧹 Cleaning up...');
    try {
      console.log('🛑 Stopping dfx...');
      runCommand('dfx stop', true);
      console.log('✅ dfx stopped successfully');
    } catch (error) {
      console.warn('⚠️ Failed to stop dfx, it may have already stopped:', error);
    }
  });
}); 
