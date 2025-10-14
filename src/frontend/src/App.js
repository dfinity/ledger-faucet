import { html, render } from 'lit-html';
import { createActor } from 'declarations/faucet';
import icpLogo from '../assets/icp-logo.svg';
import infinityLogo from '../assets/logo.svg';
import { Principal } from '@dfinity/principal';

// Enum for ledger types
const LedgerType = {
  ICP: 'ICP',
  ICRC1: 'ICRC1'
};

// Validation helpers
const ValidationHelper = {
  isValidPrincipal: (text) => {
    try {
      Principal.fromText(text);
      return true;
    } catch {
      return false;
    }
  },
  
  isValidAccountIdentifier: (text) => {
    // Account identifiers are 64-character hexadecimal strings
    const hexPattern = /^[0-9a-fA-F]{64}$/;
    return hexPattern.test(text);
  },
  
  validateTESTICPInput: (text) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return { isValid: false, error: 'Please enter a Principal or Account Identifier.' };
    }
    
    const isPrincipal = ValidationHelper.isValidPrincipal(trimmed);
    const isAccountId = ValidationHelper.isValidAccountIdentifier(trimmed);
    
    if (isPrincipal || isAccountId) {
      return { isValid: true, format: isPrincipal ? 'principal' : 'accountId' };
    }
    
    return { 
      isValid: false, 
      error: 'Invalid format. Please enter a valid Principal or Account Identifier.' 
    };
  },
  
  validateTICRC1Input: (text) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return { isValid: false, error: 'Please enter a Principal.' };
    }
    
    if (ValidationHelper.isValidPrincipal(trimmed)) {
      return { isValid: true, format: 'principal' };
    }
    
    return { 
      isValid: false, 
      error: 'Invalid Principal format. Please enter a valid Principal (e.g., rdmx6-jaaaa-aaaah-qcaiq-cai).' 
    };
  }
};

class App {
  constructor() {
    // State for token selection
    this.selectedToken = 'TESTICP'; // Default to TESTICP
    
    // Initialize unified faucet backend
    console.log("faucet id");
    console.log(process.env.CANISTER_ID_FAUCET);
    this.faucetBackend = createActor(process.env.CANISTER_ID_FAUCET);
    
    this.greeting = '';
    this.isLoading = false;
    this.isError = false;
    this.isSuccess = false;
    
    this.#render();
  }

#handleTokenChange = (e) => {
    this.selectedToken = e.target.value;
    this.greeting = '';
    this.isError = false;
    this.isSuccess = false;
    
    // Clear the input field when switching token types
    const inputField = document.getElementById('recipient-input');
    if (inputField) {
      inputField.value = '';
    }
    
    this.#render();
  };

  #triggerCoinAnimation() {
    // Create coins animation
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        const coin = document.createElement('div');
        coin.className = 'coin';
        coin.innerHTML = '●';
        coin.style.left = Math.random() * 100 + '%';
        coin.style.animationDelay = Math.random() * 0.5 + 's';
        coin.style.animationDuration = (Math.random() * 1 + 2) + 's';
        document.body.appendChild(coin);
        
        // Remove coin after animation
        setTimeout(() => {
          if (coin.parentNode) {
            coin.parentNode.removeChild(coin);
          }
        }, 3000);
      }, i * 100);
    }
  }

  #handleSubmit = async (e) => {
    e.preventDefault();
    const inputValue = document.getElementById('recipient-input').value.trim();
    
    // Frontend validation
    let validation;
    if (this.selectedToken === 'TESTICP') {
      validation = ValidationHelper.validateTESTICPInput(inputValue);
    } else if (this.selectedToken === 'TICRC1') {
      validation = ValidationHelper.validateTICRC1Input(inputValue);
    }
    
    if (!validation.isValid) {
      this.greeting = validation.error;
      this.isError = true;
      this.isSuccess = false;
      this.#render();
      return;
    }

    try {
      this.isLoading = true;
      this.isError = false;
      this.isSuccess = false;
      this.greeting = 'Processing your request...';
      this.#render();

      let result;
      
      if (this.selectedToken === 'TICRC1') {
        // TICRC1 always uses principal
        const principal = Principal.fromText(inputValue);
        result = await this.faucetBackend.transfer_icrc1(principal);
      } else if (this.selectedToken === 'TESTICP') {
        // TESTICP accepts both principals and account identifiers
        result = await this.faucetBackend.transfer_icp(inputValue);
      }

      this.greeting = result || `Success! 10 ${this.selectedToken} tokens have been transferred to your account.`;
      this.isError = false;
      this.isSuccess = true;
      this.#triggerCoinAnimation();
    } catch (error) {
      console.error(error);
      // If we reach here, it's likely a backend/network error since frontend validation passed
      this.greeting = `Error: Failed to transfer tokens. ${error.message || 'Please try again later.'}`;
      this.isError = true;
      this.isSuccess = false;
    } finally {
      this.isLoading = false;
      this.#render();
    }
  };

  #render() {
    // Determine current input type and placeholder
    const currentInputType = this.selectedToken === 'TESTICP' ? 'Principal or Account Identifier' : 'Principal';
    const currentPlaceholder = this.selectedToken === 'TESTICP' 
      ? 'e.g. d4685b31b51450508aff0d02b4f023b2a7d1f74b...'
      : 'e.g. rdmx6-jaaaa-aaaah-qcaiq-cai';

    let body = html`
      <div class="logo-header">
        <img src="${icpLogo}" alt="ICP Logo" class="header-logo" />
      </div>
      
      <main>
        <h1>Test Token Faucet</h1>
        <p>Get 10 test tokens for development and testing</p>
        
        <!-- Token Selection -->
        <div class="token-selection">
          <h3>Select Token Type:</h3>
          <div class="token-options">
            <label class="token-option ${this.selectedToken === 'TESTICP' ? 'selected' : ''}">
              <input 
                type="radio" 
                name="token" 
                value="TESTICP" 
                ?checked=${this.selectedToken === 'TESTICP'}
                @change=${this.#handleTokenChange}
                ?disabled=${this.isLoading}
              />
              <span class="token-label">
                <strong>TESTICP</strong>
                <small>Test ICP tokens</small>
              </span>
            </label>
            <label class="token-option ${this.selectedToken === 'TICRC1' ? 'selected' : ''}">
              <input 
                type="radio" 
                name="token" 
                value="TICRC1" 
                ?checked=${this.selectedToken === 'TICRC1'}
                @change=${this.#handleTokenChange}
                ?disabled=${this.isLoading}
              />
              <span class="token-label">
                <strong>TICRC1</strong>
                <small>Test ICRC-1 tokens</small>
              </span>
            </label>
          </div>
        </div>
        
        <form action="#">
          <label for="recipient-input">Enter your ${currentInputType}:</label>
          <input 
            id="recipient-input" 
            alt="${currentInputType}" 
            type="text" 
            placeholder="${currentPlaceholder}"
            ?disabled=${this.isLoading}
          />
          <button type="submit" ?disabled=${this.isLoading}>
            ${this.isLoading ? 'Processing...' : `Request ${this.selectedToken} Tokens`}
          </button>
        </form>
        
        <section id="message" class="${this.isError ? 'error' : this.isSuccess ? 'success' : ''}">${this.greeting}</section>
        
        <!-- Footer with resource links -->
        <footer class="footer">
          <div class="footer-github">
            <a href="https://github.com/dfinity/ledger-faucet/" target="_blank" rel="noopener noreferrer" class="footer-link">
              <svg class="footer-icon github-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Source code on GitHub
            </a>
          </div>
          
          <div class="footer-canisters">
            <a href="https://dashboard.internetcomputer.org/canister/xafvr-biaaa-aaaai-aql5q-cai" target="_blank" rel="noopener noreferrer" class="footer-link">
              <svg class="footer-icon dashboard-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
              TESTICP Ledger Canister
            </a>
            
            <a href="https://dashboard.internetcomputer.org/canister/3jkp5-oyaaa-aaaaj-azwqa-cai" target="_blank" rel="noopener noreferrer" class="footer-link">
              <svg class="footer-icon dashboard-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
              TICRC1 Ledger Canister
            </a>
          </div>
        </footer>
      </main>
      
      <div class="hosted-by">
        <a href="https://dashboard.internetcomputer.org/canister/nqoci-rqaaa-aaaap-qp53q-cai" target="_blank" rel="noopener noreferrer" class="hosted-link">
          Proudly hosted on the <img src="${infinityLogo}" alt="Internet Computer" class="hosted-logo" /> Internet Computer
        </a>
      </div>
    `;
    render(body, document.getElementById('root'));
    document
      .querySelector('form')
      .addEventListener('submit', this.#handleSubmit);
  }
}

export default App;
