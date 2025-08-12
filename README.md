# Token Faucet

A token faucet service for the Internet Computer (IC) that provides test tokens for development and testing purposes. This faucet supports both ICP and ICRC1 token standards.

## Live Deployments

There are already live deployments available that you can use:

- **TESTICP Faucet**: https://nqoci-rqaaa-aaaap-qp53q-cai.icp0.io/
- **TICRC1 Faucet**: https://pwwqf-yaaaa-aaaap-qp5wq-cai.icp0.io/

You can use these deployments directly without needing to set up your own.

## Overview

This project consists of multiple canisters that work together to provide a token faucet service:

- **Test Ledger Canisters**: Simulate real ledger canisters for testing
  - `testicp-ledger`: Test ICP ledger canister
  - `ticrc1-ledger`: Test ICRC1 ledger canister

- **Faucet Backend Canisters**: Handle token distribution requests
  - `testicp-backend`: Faucet for ICP tokens
  - `ticrc1-backend`: Faucet for ICRC1 tokens

## Quick Start

### 1. Install Development Tools

First, install mise for managing development tool versions:

```bash
# Install mise (if not already installed)
curl https://mise.run | sh
```

Then install the required tools (npm and just):

```bash
# Install tools specified in mise.toml
mise install
```

### 2. Start Local IC Replica

```bash
dfx start --background
```

### 3. Deploy Canisters

```bash
# Deploy all canisters
dfx deploy
```

This will deploy:
- Test ledger canisters with the faucet backend set as the minting account.
- Faucet backend canisters connected to their respective ledgers

### 4. Request Test Tokens

#### For ICRC1 Tokens

```bash
# Replace the principal with the principal you want the tokens to be sent to.
dfx canister call ticrc1-backend transfer_icrc1 '(principal "uqqxf-5h777-77774-qaaaa-cai")'
```

Checking the balance:

```bash
# Replace the principal with the principal for which you want to check the balance of.
dfx canister call ticrc1-ledger icrc1_balance_of '(record { owner = principal "uqqxf-5h777-77774-qaaaa-cai"})'
```

#### For ICP Tokens

```bash
# Replace the account identifier with the account identifier you want the tokens to be sent to.
dfx canister call testicp-backend transfer_icp '("f0da8debe354b98d21be4fe41f0d5fbe403763f22cc6f6b6850cc390d8b33e77")'
```

Checking the balance:

```bash
# Replace the account identifier with the account identifier for which you want to check the balance of.
dfx canister call testicp-ledger account_balance_dfx '(record { account = "f0da8debe354b98d21be4fe41f0d5fbe403763f22cc6f6b6850cc390d8b33e77"})'
```

## Deployment with Orbit

This section is for the DFINITY team to update the live deployments, which are managed by Orbit.

First, build the canister using:
```bash
just build <canister-name>
```

### Backend Canisters

Create an Orbit **reinstall** request with the WASM at:
   ```
   .dfx/local/canisters/<canister-name>/<canister-name>.wasm
   ```

When deploying the backend canisters, use the following init_args:

**For TESTICP:**
```
(record { ledger_canister = principal "xafvr-biaaa-aaaai-aql5q-cai"; ledger_type = variant { ICP }; is_mint = false; })
```

**For TICRC1:**
```
(record { ledger_canister = principal "3jkp5-oyaaa-aaaaj-azwqa-cai"; ledger_type = variant { ICRC1 }; is_mint = false; })
```

### Frontend Canisters

Frontend assets are uploaded using `dfx-orbit`. Install it using:

```bash
cargo install -f --git https://github.com/dfinity/orbit.git --bin dfx-orbit
```

To deploy frontend assets:

```bash
dfx-orbit request asset permission <frontend-canister> prepare
dfx-orbit request asset upload <frontend-canister>
# The upload command returns a batch ID, use it in the following command:
dfx-orbit request asset commit <frontend-canister> --batch-id <batch-id>
```
