# Token Faucet

A token faucet service for the Internet Computer (IC) that provides test tokens for development and testing purposes. This faucet supports both ICP and ICRC1 token standards.

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

## Creating Releases

This repository uses automated GitHub releases. When you push a git tag, it automatically builds all artifacts and creates a GitHub release.

### Release Process

The recommended workflow is to **first create a beta release** for testing, then promote to a stable release:

#### Step 1: Create Beta Release for Testing

1. **Ensure all changes are merged to main** and all tests pass
2. **Create a beta release**:
   ```bash
   ./scripts/create-release.sh 1.0.0-beta.1
   ```
   - This creates a **prerelease** on GitHub (not marked as "latest")
   - Use this for testing in staging/development environments

#### Step 2: Promote to Stable Release

3. **After testing the beta**, create the stable release:
   ```bash
   ./scripts/create-release.sh 1.0.0
   ```
   - This creates the **official release** marked as "latest" on GitHub
   - Use this for production deployments

### Release Artifacts

Each release includes:
- **Backend Wasm file**: `ledger-faucet-backend.wasm` (works for both ICP and ICRC1)
- **Frontend assets**: `testicp-frontend-assets.tar.gz`, `ticrc1-frontend-assets.tar.gz`

These artifacts can be used directly for deployment to production environments.
