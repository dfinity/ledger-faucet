use candid::types::number::Nat;
use candid::{CandidType, Principal};
use ic_cdk::call::Response;
use ic_ledger_types::{
    AccountIdentifier, BlockIndex, Memo, Subaccount, Tokens, TransferArgs as IcpTransferArg,
    TransferError,
};
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::TransferArg as Icrc1TransferArg;
use serde::Deserialize;
use std::cell::RefCell;

#[cfg(feature = "frontend")]
mod assets;

const NON_MINTER_FEE: u64 = 10_000;

thread_local! {
    static STATE: RefCell<State> = RefCell::new(State::default());
}

#[derive(Clone, CandidType, Deserialize)]
struct LedgerConfig {
    canister_id: Principal,
    is_mint: bool,
}

#[derive(Clone, CandidType, Deserialize)]
struct State {
    icp_ledger: LedgerConfig,
    icrc1_ledger: LedgerConfig,
}

impl Default for State {
    fn default() -> Self {
        Self {
            icp_ledger: LedgerConfig {
                canister_id: Principal::anonymous(),
                is_mint: false,
            },
            icrc1_ledger: LedgerConfig {
                canister_id: Principal::anonymous(),
                is_mint: false,
            },
        }
    }
}

#[ic_cdk::init]
fn init(state: State) {
    STATE.with(|s| {
        *s.borrow_mut() = state;
    });

    #[cfg(feature = "frontend")]
    assets::certify_all_assets();
}

/// Returns the account identifier of the canister.
#[ic_cdk::query]
async fn account_identifier() -> String {
    AccountIdentifier::new(&ic_cdk::api::canister_self(), &Subaccount([0; 32])).to_hex()
}

/// Helper function to transfer ICRC1 tokens to a principal
async fn transfer_icrc1_to_principal(ledger_canister: Principal, to_principal: Principal, is_mint: bool) {
    let fee = if is_mint {
        Some(Nat::from(0u64))
    } else {
        Some(Nat::from(NON_MINTER_FEE))
    };

    ic_cdk::call::Call::bounded_wait(ledger_canister, "icrc1_transfer")
        .with_arg(Icrc1TransferArg {
            from_subaccount: None,
            to: Account {
                owner: to_principal,
                subaccount: None,
            },
            amount: Nat::from(10_0000_0000u64),
            fee,
            created_at_time: None,
            memo: None,
        })
        .await
        .unwrap();
}

/// Transfers ICRC1 tokens to the specified principal.
#[ic_cdk::update]
async fn transfer_icrc1(to_principal: Principal) {
    let state = STATE.with(|s| s.borrow().clone());
    transfer_icrc1_to_principal(state.icrc1_ledger.canister_id, to_principal, state.icrc1_ledger.is_mint).await;
}

/// Transfers ICP tokens to the specified principal or account identifier.
#[ic_cdk::update]
async fn transfer_icp(to_identifier: String) {
    let state = STATE.with(|s| s.borrow().clone());

    // Try to parse as Principal first
    if let Ok(principal) = Principal::from_text(&to_identifier) {
        // Use ICRC1 transfer for principal
        transfer_icrc1_to_principal(state.icp_ledger.canister_id, principal, state.icp_ledger.is_mint).await;
    } else if let Ok(account_identifier) = AccountIdentifier::from_hex(&to_identifier) {
        // Use legacy ICP transfer for account identifier
        let fee = if state.icp_ledger.is_mint {
            Tokens::from_e8s(0u64)
        } else {
            Tokens::from_e8s(NON_MINTER_FEE)
        };

        let transfer_arg = IcpTransferArg {
            to: account_identifier,
            from_subaccount: None,
            fee,
            amount: Tokens::from_e8s(10_0000_0000u64),
            created_at_time: None,
            memo: Memo(0),
        };

        let result: Response =
            ic_cdk::call::Call::bounded_wait(state.icp_ledger.canister_id, "transfer")
                .with_arg(transfer_arg)
                .await
                .unwrap();

        let result: Result<BlockIndex, TransferError> = result.candid().unwrap();
        result.unwrap();
    } else {
        ic_cdk::trap(&format!("Invalid identifier format: {}. Expected either a Principal (e.g., rdmx6-jaaaa-aaaah-qcaiq-cai) or Account Identifier (e.g., d4685b31b51450508aff0d02b4f023b2a7d1f74b...)", to_identifier));
    }
}

/// Serves frontend assets.
#[cfg(feature = "frontend")]
#[ic_cdk::query]
fn http_request(req: ic_http_certification::HttpRequest) -> ic_http_certification::HttpResponse {
    assets::serve_asset(&req)
}
