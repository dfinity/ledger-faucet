import { html, render } from 'lit-html';
import { createActor } from 'declarations/faucet';
import logo from './logo2.svg';
import { Principal } from '@dfinity/principal';

// Enum for ledger types
const LedgerType = {
  ICP: 'ICP',
  ICRC1: 'ICRC1'
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
    
    if (!inputValue) {
      const inputTypeLabel = this.selectedToken === 'TESTICP' ? 'Account Identifier' : 'Principal';
      this.greeting = `Please enter a valid ${inputTypeLabel}.`;
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
        // TESTICP always uses account identifier
        result = await this.faucetBackend.transfer_icp(inputValue);
      }

      this.greeting = result || `Success! 10 ${this.selectedToken} tokens have been transferred to your account.`;
      this.isError = false;
      this.isSuccess = true;
      this.#triggerCoinAnimation();
    } catch (error) {
      console.error(error);
      const inputTypeLabel = this.selectedToken === 'TESTICP' ? 'Account Identifier' : 'Principal';
      this.greeting = `Error: Invalid ${inputTypeLabel} format. Please check and try again.`;
      this.isError = true;
      this.isSuccess = false;
    } finally {
      this.isLoading = false;
      this.#render();
    }
  };

  #render() {
    // Determine current input type and placeholder
    const currentInputType = this.selectedToken === 'TESTICP' ? 'Account Identifier' : 'Principal';
    const currentPlaceholder = this.selectedToken === 'TESTICP' 
      ? 'e.g. d4685b31b51450508aff0d02b4f023b2a7d1f74b...'
      : 'e.g. rdmx6-jaaaa-aaaah-qcaiq-cai';

    let body = html`
      <main>
        <h1>IC Token Faucet</h1>
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
        
        <div class="info">
          <p><strong>Instructions:</strong></p>
          <ul>
            <li>Select your preferred token type</li>
            <li>Enter your Internet Computer ${currentInputType}</li>
            <li>Click "Request ${this.selectedToken} Tokens" to receive 10 ${this.selectedToken}</li>
            <li>Use these tokens for testing and development purposes</li>
          </ul>
        </div>
        
        <img src="${logo}" alt="100% onchain" />
      </main>
    `;
    render(body, document.getElementById('root'));
    document
      .querySelector('form')
      .addEventListener('submit', this.#handleSubmit);
  }
}

export default App;
