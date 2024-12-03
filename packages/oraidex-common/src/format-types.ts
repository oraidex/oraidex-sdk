import { TokenItemType as TokenItemTypeCommon } from "@oraichain/common";
import { PairInfo } from "@oraichain/oraidex-contracts-sdk";

export type CoinGeckoPrices<T extends string> = {
  [C in T]: number | null;
};

export type TokenItemType = TokenItemTypeCommon & {
  Icon?: any;
  IconLight?: any;
};

export type TokenInfo = TokenItemType & {
  symbol?: string;
  total_supply?: string;
  icon?: string;
  verified?: boolean;
};

export type PairInfoExtend = PairInfo & {
  asset_infos_raw: [string, string];
};

export interface FormatNumberDecimal {
  price: number;
  maxDecimal?: number;
  unit?: string;
  minDecimal?: number;
  minPrice?: number;
  unitPosition?: "prefix" | "suffix";
}

export type AmountDetails = { [denom: string]: string };
