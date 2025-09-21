import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface init_args {
  'icp_ledger' : ledger_config,
  'icrc1_ledger' : ledger_config,
}
export interface ledger_config {
  'is_mint' : boolean,
  'canister_id' : Principal,
}
export interface _SERVICE {
  'account_identifier' : ActorMethod<[], string>,
  'transfer_icp' : ActorMethod<[string], undefined>,
  'transfer_icrc1' : ActorMethod<[Principal], undefined>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
