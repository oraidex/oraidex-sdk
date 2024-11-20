export interface InstantiateMsg {}
export type ExecuteMsg = {
  claim: {};
} | {
  add_rewarder: {
    rewarder: Addr;
    rewards: Asset[];
  };
};
export type Addr = string;
export type Uint128 = string;
export type AssetInfo = {
  token: {
    contract_addr: Addr;
  };
} | {
  native_token: {
    denom: string;
  };
};
export interface Asset {
  amount: Uint128;
  info: AssetInfo;
}
export type QueryMsg = {
  reward_tokens: {
    addr: Addr;
  };
} | {
  config: {};
};
export interface MigrateMsg {}
export interface Config {
  owner: Addr;
}
export interface RewardTokensResponse {
  reward_tokens: Asset[];
}