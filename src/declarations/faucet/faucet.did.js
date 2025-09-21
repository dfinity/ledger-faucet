export const idlFactory = ({ IDL }) => {
  const ledger_config = IDL.Record({
    'is_mint' : IDL.Bool,
    'canister_id' : IDL.Principal,
  });
  const init_args = IDL.Record({
    'icp_ledger' : ledger_config,
    'icrc1_ledger' : ledger_config,
  });
  return IDL.Service({
    'account_identifier' : IDL.Func([], [IDL.Text], ['query']),
    'transfer_icp' : IDL.Func([IDL.Text], [], []),
    'transfer_icrc1' : IDL.Func([IDL.Principal], [], []),
  });
};
export const init = ({ IDL }) => {
  const ledger_config = IDL.Record({
    'is_mint' : IDL.Bool,
    'canister_id' : IDL.Principal,
  });
  const init_args = IDL.Record({
    'icp_ledger' : ledger_config,
    'icrc1_ledger' : ledger_config,
  });
  return [init_args];
};
