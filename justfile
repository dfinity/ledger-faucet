generate:
  dfx generate testicp-backend

# Start development server with ICP token type
start-icp:
  cd src/frontend && VITE_TOKEN_SYMBOL=TESTICP npm run start

# Start development server with ICRC1 token type
start-icrc1:
  cd src/frontend && VITE_TOKEN_SYMBOL=TICRC1 npm run start

build canister:
  dfx build {{canister}} --check

# Deploy frontend (usage: just deploy icp OR just deploy icrc1)
deploy token_type:
  #!/usr/bin/env bash
  if [ "{{token_type}}" = "icp" ]; then
    dfx deploy testicp-frontend
  elif [ "{{token_type}}" = "icrc1" ]; then
    dfx deploy ticrc1-frontend
  else
    echo "Error: Please specify 'icp' or 'icrc1'"
    echo "Usage: just deploy icp"
    echo "       just deploy icrc1"
    exit 1
  fi

deploy-icrc1-mainnet:
  # NOTE: You need to manually set is_mint to false in the backend canister before deploying
  dfx deploy ticrc1-backend --network ic --mode=reinstall
  dfx deploy ticrc1-frontend --network ic

deploy-icp-mainnet:
  # NOTE: You need to manually set is_mint to false in the backend canister before deploying
  dfx deploy testicp-backend --network ic --mode=reinstall
  dfx deploy testicp-frontend --network ic

test-backend:
  ./tests/test_icrc1.sh
  ./tests/test_icp.sh 

# Setup frontend test dependencies
setup-frontend-test:
  cd tests/frontend && npm install && npx playwright install

# Run frontend test for ICP faucet
test-frontend-icp: setup-frontend-test (build "testicp-frontend")
  cd tests/frontend && npm run test:frontend

# Run frontend test for ICRC1 faucet
test-frontend-icrc1: setup-frontend-test (build "ticrc1-frontend")
  cd tests/frontend && npx playwright test icrc1-faucet.spec.ts

# Run all frontend tests (both ICP and ICRC1)
test-frontend: test-frontend-icrc1 test-frontend-icp

test: test-backend test-frontend
