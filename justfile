# Start development server with ICP token type
start-icp:
  cd src/frontend && VITE_TOKEN_SYMBOL=TESTICP npm run start

# Start development server with ICRC1 token type
start-icrc1:
  cd src/frontend && VITE_TOKEN_SYMBOL=TICRC1 npm run start

# Deploy a specific token
deploy token_type:
  #!/usr/bin/env bash
  if [ "{{token_type}}" = "testicp" ]; then
    # Build frontend.
    cd src/frontend && VITE_TOKEN_SYMBOL=TESTICP npm run build:icp

    # Build backend.
    cargo build --target wasm32-unknown-unknown --release --features frontend

    # Deploy canisters
    dfx deploy testicp-ledger
    dfx deploy testicp --mode=reinstall -y
  elif [ "{{token_type}}" = "ticrc1" ]; then
    # Build frontend.
    cd src/frontend && VITE_TOKEN_SYMBOL=TICRC1 npm run build:icrc1

    # Build backend.
    cargo build --target wasm32-unknown-unknown --release --features frontend

    # Deploy canisters
    dfx deploy ticrc1-ledger
    dfx deploy ticrc1 --mode=reinstall -y
  else
    echo "Error: Please specify 'testicp' or 'ticrc1'"
    echo "Usage: just deploy testicp"
    echo "       just deploy ticrc1"
    exit 1
  fi

deploy-icrc1-mainnet:
  # NOTE: You need to manually set is_mint to false in the backend canister before deploying
  dfx deploy ticrc1 --network ic --mode=reinstall

deploy-icp-mainnet:
  # NOTE: You need to manually set is_mint to false in the backend canister before deploying
  dfx deploy testicp --network ic --mode=reinstall

test-backend:
  ./tests/test_icrc1.sh
  ./tests/test_icp.sh 

# Setup frontend test dependencies
setup-frontend-test:
  cd tests/frontend && npm install && npx playwright install

# Run frontend test for ICP faucet
test-frontend-icp: setup-frontend-test
  cd tests/frontend && npx playwright test icp-faucet.spec.ts

# Run frontend test for ICRC1 faucet
test-frontend-icrc1: setup-frontend-test
  cd tests/frontend && npx playwright test icrc1-faucet.spec.ts

# Run all frontend tests (both ICP and ICRC1)
test-frontend: test-frontend-icrc1 test-frontend-icp

test: test-backend test-frontend
