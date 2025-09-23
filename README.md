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
just deploy testicp
just deploy ticrc1
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

Each release includes the `faucet.wasm.gz` canister, which serves both the frontend and backend.

## Deployment with Orbit

This section is for the DFINITY team to update the live deployments, which are managed by Orbit.

Once a beta release has been tested, they can be deployed to production as follows:

1. Download the canister's wasm.
2. Create an Orbit **reinstall** request with the wasm.
3. Use the following init args, noting that the Orbit UI only accepts hex arguments:

```
4449444c026c02b2d5ecf60701c2f8dadc0f016c02d7bc96267eb3c4b1f20468010000010a00000000010082fb010100010a000000000120cda00101
```

Which can be computed as:

```
> didc encode "(record { icp_ledger = record { canister_id = principal \"xafvr-biaaa-aaaai-aql5q-cai\"; is_mint = false }; icrc1_ledger = record { canister_id = principal \"3jkp5-oyaaa-aaaaj-azwqa-cai\"; is_mint = false }; })"
```

## Minting TESTICP and TICRC1 tokens using Orbit

1. From the menu on the left, select "Canisters"
2. Select the canister for which you want to mint tokens ("Test ICP Ledger" or Test ICRC ledger)
3. To see a previously executed mint transaction, where you can modify the recipient account and the amount, you can
   click "See all" in the "Performed calls" window on the bottom-right. For the "Test ICP Ledger", one such example is
    on 2025-06-26 (set this date as the "From" and "To" dates):

```
(
  record {
    to = record {
      owner = principal "xqyxz-rst4u-hjhl6-42tdq-gpcim-orf57-cc273-ikl5n-woi6z-jjkeq-gqe";
      subaccount = null;
    };
    fee = null;
    memo = null;
    from_subaccount = null;
    created_at_time = null;
    amount = 10_000_000_000 : nat;
  },
)
```

4. Modify the above transfer arguments as needed. E.g., to mint enough for a faucet to give out 10 tokens
   (1_000_000_000) every second for the next 10 years (60*60*24*365*10=315360000), set the amount to
   315_360_000_000_000_000. Thereafter, go back to the canister as described in step 2, and click the
   "Perform call" button on the top-right.
5. Select "icrc1_transfer" as the "Method name".
6. Enter the transfer arguments in the "Arguments" field, using the format shown in step 3.
7. Click "Execute" to execute the mint transaction.
