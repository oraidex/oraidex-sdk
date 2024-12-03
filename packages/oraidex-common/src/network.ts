import { Bech32Config, ChainInfo, Currency, FeeCurrency } from "@keplr-wallet/types";
import {
  BridgeAppCurrency,
  CoinType,
  CustomChainInfo as CustomChainInfoCommon,
  NetworkChainId,
  NetworkType
} from "@oraichain/common";

// Incase when a new supported token is added, the coingecko id should be added here
export type CoinGeckoId =
  | "oraichain-token"
  | "osmosis"
  | "cosmos"
  | "ethereum"
  | "binancecoin"
  | "airight"
  | "oraidex"
  | "tether"
  | "kawaii-islands"
  | "milky-token"
  | "scorai"
  | "oraidex"
  | "usd-coin"
  | "tron"
  | "weth"
  | "wbnb"
  | "scatom"
  | "injective-protocol"
  | "bitcoin"
  | "neutaro"
  | "och"
  | "celestia"
  | "the-open-network"
  | "pepe"
  | "simon-s-cat"
  | "hamster-kombat"
  | "dogecoin"
  | string;

export interface NetworkConfig {
  coinType?: CoinType;
  explorer: string;
  /** Fixed fee */
  fee: { gasPrice: string; amount: string; gas: string };
  factory: string;
  factory_v2: string;
  oracle: string;
  staking: string;
  router: string;
  mixer_router: string;
  denom: string;
  prefix: string;
  rewarder: string;
  converter: string;
  oraidex_listing: string;
  bid_pool: string;
  multicall: string;
  pool_v3: string;
  staking_oraix: string;
  indexer_v3: string;
}

// Custom more: hiddenInUI, Icon + IconLight
// export type CustomChainInfo = CustomChainInfoCommon & {
//   readonly chainId: NetworkChainId;
//   readonly chainName: string;
//   readonly Icon?: any;
//   readonly IconLight?: any;
//   readonly bip44: {
//     coinType: CoinType;
//   };
//   readonly hideInUI?: boolean;
//   readonly networkType: NetworkType;
//   readonly coinType: CoinType;
//   readonly bech32Config?: Bech32Config;
//   readonly rest?: string; // optional, rest api tron and lcd for cosmos
//   readonly stakeCurrency?: Currency;
//   readonly feeCurrencies?: FeeCurrency[];
//   readonly currencies: BridgeAppCurrency[];
//   readonly txExplorer?: {
//     readonly name: string;
//     readonly txUrl: string;
//     readonly accountUrl?: string;
//   };
//   readonly chainLogoPng?: string;
//   readonly chainLogoSvg?: string;
// };

export const defaultBech32Config = (
  mainPrefix: string,
  validatorPrefix = "val",
  consensusPrefix = "cons",
  publicPrefix = "pub",
  operatorPrefix = "oper"
) => {
  return {
    bech32PrefixAccAddr: mainPrefix,
    bech32PrefixAccPub: mainPrefix + publicPrefix,
    bech32PrefixValAddr: mainPrefix + validatorPrefix + operatorPrefix,
    bech32PrefixValPub: mainPrefix + validatorPrefix + operatorPrefix + publicPrefix,
    bech32PrefixConsAddr: mainPrefix + validatorPrefix + consensusPrefix,
    bech32PrefixConsPub: mainPrefix + validatorPrefix + consensusPrefix + publicPrefix
  };
};
