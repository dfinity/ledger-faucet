#!/bin/bash

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test principal from README
TEST_PRINCIPAL="uqqxf-5h777-77774-qaaaa-cai"

# Cleanup function to stop dfx on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping dfx...${NC}"
    dfx stop
    echo -e "${GREEN}✅ dfx stopped${NC}"
}

# Set trap to run cleanup on exit (both success and failure)
trap cleanup EXIT

echo -e "${YELLOW}🚀 Starting ICRC1 Token Faucet Test${NC}"
echo "========================================"

# Step 1: Start local IC replica
echo -e "${YELLOW}🌐 Starting local IC replica...${NC}"
if dfx start --clean --background; then
    echo -e "${GREEN}✅ Local IC replica started successfully${NC}"
else
    echo -e "${RED}❌ Failed to start local IC replica${NC}"
    exit 1
fi

echo ""

# Step 2: Deploy canisters
echo -e "${YELLOW}📦 Deploying canisters...${NC}"
if just deploy-icrc1-backend; then
    echo -e "${GREEN}✅ Canisters deployed successfully${NC}"
else
    echo -e "${RED}❌ Failed to deploy canisters${NC}"
    exit 1
fi

echo ""

# Step 3: Transfer ICRC1 tokens
echo -e "${YELLOW}💰 Transferring ICRC1 tokens to ${TEST_PRINCIPAL}...${NC}"
if dfx canister call ticrc1-backend transfer_icrc1 "(principal \"${TEST_PRINCIPAL}\")"; then
    echo -e "${GREEN}✅ ICRC1 tokens transferred successfully${NC}"
else
    echo -e "${RED}❌ Failed to transfer ICRC1 tokens${NC}"
    exit 1
fi

echo ""

# Step 4: Check balance
echo -e "${YELLOW}🔍 Checking ICRC1 balance for ${TEST_PRINCIPAL}...${NC}"
if balance_result=$(dfx canister call ticrc1-ledger icrc1_balance_of "(record { owner = principal \"${TEST_PRINCIPAL}\"})"); then
    echo -e "${GREEN}✅ Balance check successful${NC}"
    echo "Balance result: ${balance_result}"
    
    # Expected balance
    EXPECTED_BALANCE="1_000_000_000"
    
    # Extract the balance number from the result and verify it matches expected amount
    if echo "${balance_result}" | grep -q "${EXPECTED_BALANCE}"; then
        echo -e "${GREEN}✅ Balance matches expected amount (${EXPECTED_BALANCE}) - tokens were successfully transferred!${NC}"
    else
        echo -e "${RED}❌ Balance does not match expected amount${NC}"
        echo -e "${RED}   Expected: ${EXPECTED_BALANCE}${NC}"
        echo -e "${RED}   Got: ${balance_result}${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Failed to check balance${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Quickstart test completed successfully!${NC}"
echo "========================================" 
