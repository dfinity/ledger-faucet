build:
  #!/usr/bin/env bash
  # Build frontend
  cd src/frontend && npm install && npm run build
  cd ../..

  cargo build --target wasm32-unknown-unknown --release --features frontend

  # Add canister metadata
  cargo install ic-wasm --version 0.9.8 --root ./target
  ./target/bin/ic-wasm \
      "./target/wasm32-unknown-unknown/release/backend.wasm" \
      -o "./target/wasm32-unknown-unknown/release/backend.wasm" \
      metadata candid:service -f "./src/backend/backend.did" -v public

  # Compress
  gzip -n -f "./target/wasm32-unknown-unknown/release/backend.wasm"

# Deploy a specific token
deploy: build
  #!/usr/bin/env bash
  # Deploy canisters
  dfx deploy testicp-ledger
  dfx deploy ticrc1-ledger
  dfx deploy faucet --mode=reinstall -y

deploy-backend-only:
  #!/usr/bin/env bash
  # Build backend (without frontend)
  cargo build --target wasm32-unknown-unknown --release
  gzip -n -f "./target/wasm32-unknown-unknown/release/backend.wasm"

  # Deploy canisters
  dfx deploy testicp-ledger
  dfx deploy ticrc1-ledger
  dfx deploy faucet --mode=reinstall -y

test-backend:
  ./tests/backend.sh

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
