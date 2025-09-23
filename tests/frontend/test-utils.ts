import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { expect, Page } from '@playwright/test';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface FaucetTestConfig {
  identifier: string;
  canisterUrl: string;
  deployCommand: string;
  tokenType: 'TESTICP' | 'TICRC1';
  balanceCommand: (identifier: string) => string;
  parseBalance: (result: string) => number;
  balanceUnit?: string;
  expectedBalance: number;
}

// Helper function to run shell commands with real-time output
export function runCommand(command: string, showOutput: boolean = false): string {
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
export function startDfxBackground(): void {
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

// Common setup function for faucet tests
export async function setupFaucetTest(): Promise<void> {
  startDfxBackground();
  console.log('✅ dfx started successfully');
  
  // Wait a bit for dfx to be fully ready
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  console.log('🚀 Deploying faucet with command: just deploy...');
  runCommand('just deploy', true); // Show output in real-time
  console.log('✅ Deployment completed');
  
  // Wait a bit for services to be ready
  await new Promise(resolve => setTimeout(resolve, 3000));
}

// Common cleanup function for faucet tests
export function cleanupFaucetTest(): void {
  console.log('🧹 Cleaning up...');
  try {
    console.log('🛑 Stopping dfx...');
    runCommand('dfx stop', true);
    console.log('✅ dfx stopped successfully');
  } catch (error) {
    console.warn('⚠️ Failed to stop dfx, it may have already stopped:', error);
  }
}

// Helper function to check and verify balance
export function verifyBalance(config: FaucetTestConfig, identifier: string, expectedBalance: number): number {
  const balanceCommand = config.balanceCommand(identifier);
  const balanceResult = runCommand(balanceCommand);
  
  console.log(`📊 Balance result: ${balanceResult}`);
  
  const balance = config.parseBalance(balanceResult);
  const unit = config.balanceUnit || '';
  console.log(`🏦 Balance: ${balance}${unit ? ' ' + unit : ''}`);
  
  expect(balance).toBe(expectedBalance);
  
  return balance;
}

// Common faucet token request flow
export async function requestTokensFromFaucet(page: Page, config: FaucetTestConfig): Promise<void> {
  // First verify the balance is zero before requesting tokens
  console.log('🔍 Checking initial account balance (should be zero)...');
  const initialBalance = verifyBalance(config, config.identifier, 0);
  console.log('✅ Confirmed initial balance is zero');
  
  console.log('🌐 Navigating to faucet website...');
  
  // Navigate to the faucet website
  await page.goto(config.canisterUrl);
  
  // Wait for the page to load
  console.log('⏳ Waiting for page to load...');
  await page.waitForLoadState('networkidle');
  
  // Select the correct token type
  console.log(`🎯 Selecting token type: ${config.tokenType}...`);
  const tokenButton = page.locator(`label.token-option`).filter({ has: page.locator(`input[value="${config.tokenType}"]`) });
  await expect(tokenButton).toBeVisible({ timeout: 10000 });
  await tokenButton.click();
  
  // Wait for the input field to be ready
  console.log('🔍 Looking for input field...');
  const input = page.locator('input[type="text"]#recipient-input');
  await expect(input).toBeVisible({ timeout: 10000 });
  
  // Fill in the identifier
  console.log(`📝 Entering identifier: ${config.identifier}`);
  await input.fill(config.identifier);
  
  // Find and click the "Request Tokens" button
  console.log(`🖱️ Clicking Request ${config.tokenType} Tokens button...`);
  const requestButton = page.locator('button').filter({ hasText: new RegExp(`request ${config.tokenType} tokens`, 'i') });
  await expect(requestButton).toBeVisible();
  await requestButton.click();
  
  // Wait for the success dialog to appear
  console.log('⏳ Waiting for success dialog...');
  const successDialog = page.locator('text=Success!');
  await expect(successDialog).toBeVisible({ timeout: 30000 });
  
  console.log('✅ Success dialog appeared!');
  
  // Wait a bit more for the transaction to be processed
  await page.waitForTimeout(5000);
  
  // Verify the final balance
  console.log('💰 Checking final account balance...');
  const finalBalance = verifyBalance(config, config.identifier, config.expectedBalance);
  
  console.log(`🎉 Test completed successfully! Balance is exactly ${finalBalance.toLocaleString()}${config.balanceUnit ? ' ' + config.balanceUnit : ''}.`);
} 
