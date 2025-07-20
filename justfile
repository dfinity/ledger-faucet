generate:
  dfx generate testicp-backend

# Start development server with ICP token type
start-icp:
  cd src/frontend && VITE_TOKEN_SYMBOL=TESTICP npm run start

# Start development server with ICRC1 token type
start-icrc1:
  cd src/frontend && VITE_TOKEN_SYMBOL=TICRC1 npm run start

# Build with ICP token type
build-icp-fe:
  cd src/frontend && npm install && npm run build:icp

# Build with ICRC1 token type
build-icrc1-fe:
  cd src/frontend && VITE_TOKEN_SYMBOL=TICRC1 npm run build

deploy-icp-backend:
  dfx deploy testicp-ledger
  dfx deploy testicp-backend

deploy-icp: deploy-icp-backend
  dfx deploy testicp-frontend

deploy-icrc1-backend:
  dfx deploy ticrc1-ledger
  dfx deploy ticrc1-backend

deploy-icrc1: deploy-icrc1-backend
  dfx deploy ticrc1-frontend

deploy-icrc1-mainnet:
  # NOTE: You need to manually set is_mint to false in the backend canister before deploying
  dfx deploy ticrc1-backend --network ic --mode=reinstall
  dfx deploy ticrc1-frontend --network ic

deploy-icp-mainnet:
  # NOTE: You need to manually set is_mint to false in the backend canister before deploying
  dfx deploy testicp-backend --network ic --mode=reinstall
  dfx deploy testicp-frontend --network ic

# Run all faucet tests (ICRC1 and ICP)
test:
  ./tests/test_icrc1.sh
  ./tests/test_icp.sh 

# Setup frontend test dependencies
setup-frontend-test:
  cd tests/frontend && npm install && npx playwright install

# Run frontend test for ICP faucet
test-frontend-icp: setup-frontend-test build-icp-fe
  cd tests/frontend && npm run test:frontend
