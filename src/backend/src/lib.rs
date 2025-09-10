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

#[derive(Clone, CandidType, Deserialize, PartialEq)]
enum LedgerType {
    #[allow(clippy::upper_case_acronyms)]
    ICP,
    ICRC1,
}

#[derive(Clone, CandidType, Deserialize)]
struct State {
    ledger_canister: Principal,
    ledger_type: LedgerType,
    is_mint: bool,
}

impl Default for State {
    fn default() -> Self {
        Self {
            ledger_canister: Principal::anonymous(),
            ledger_type: LedgerType::ICRC1,
            is_mint: false,
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

/// Transfers ICRC1 tokens to the specified principal.
#[ic_cdk::update]
async fn transfer_icrc1(to_principal: Principal) {
    let state = STATE.with(|s| s.borrow().clone());

    match state.ledger_type {
        LedgerType::ICRC1 => {
            let fee = if state.is_mint {
                Some(Nat::from(0u64))
            } else {
                Some(Nat::from(NON_MINTER_FEE))
            };

            ic_cdk::call::Call::bounded_wait(state.ledger_canister, "icrc1_transfer")
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
        LedgerType::ICP => {
            panic!("Ledger type must be ICRC1");
        }
    }
}

/// Transfers ICP tokens fo the specified account identifier.
#[ic_cdk::update]
async fn transfer_icp(to_account_identifier: String) {
    let state = STATE.with(|s| s.borrow().clone());

    if state.ledger_type != LedgerType::ICP {
        panic!("Ledger type must be ICP");
    }

    let account_identifier =
        AccountIdentifier::from_hex(&to_account_identifier).expect("Invalid account identifier");

    let fee = if state.is_mint {
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

    let result: Response = ic_cdk::call::Call::bounded_wait(state.ledger_canister, "transfer")
        .with_arg(transfer_arg)
        .await
        .unwrap();

    let result: Result<BlockIndex, TransferError> = result.candid().unwrap();
    result.unwrap();
}

/// Serves frontend assets.
#[cfg(feature = "frontend")]
#[ic_cdk::query]
fn http_request(req: ic_http_certification::HttpRequest) -> ic_http_certification::HttpResponse {
    assets::serve_asset(&req)
}
