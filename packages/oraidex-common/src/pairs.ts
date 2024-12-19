import { AssetInfo } from "@oraichain/oraidex-contracts-sdk";
import {
  AIRI_CONTRACT,
  ATOM_ORAICHAIN_DENOM,
  BTC_CONTRACT,
  INJECTIVE_CONTRACT,
  KWT_CONTRACT,
  MILKY_CONTRACT,
  ORAI,
  ORAIX_CONTRACT,
  OSMOSIS_ORAICHAIN_DENOM,
  SCATOM_CONTRACT,
  SCORAI_CONTRACT,
  TRX_CONTRACT,
  USDC_CONTRACT,
  USDT_CONTRACT,
  WETH_CONTRACT,
  NEUTARO_ORAICHAIN_DENOM as NEUTARO_ADDRESS,
  OCH_CONTRACT,
  MAX_ORAICHAIN_DENOM
} from "./constant";
import { parseAssetInfo } from "./helper";
import uniq from "lodash/uniq";
import flatten from "lodash/flatten";
import { TokenItemType } from "./format-types";

export type PairMapping = {
  asset_infos: [AssetInfo, AssetInfo];
  symbols: [string, string];
  factoryV1?: boolean;
};

export const PAIRS: PairMapping[] = [
  {
    asset_infos: [{ token: { contract_addr: AIRI_CONTRACT } }, { native_token: { denom: ORAI } }],
    symbols: ["AIRI", "ORAI"],
    factoryV1: true
  },
  {
    asset_infos: [{ token: { contract_addr: ORAIX_CONTRACT } }, { native_token: { denom: ORAI } }],
    symbols: ["ORAIX", "ORAI"],
    factoryV1: true
  },
  {
    asset_infos: [{ token: { contract_addr: SCORAI_CONTRACT } }, { native_token: { denom: ORAI } }],
    symbols: ["scORAI", "ORAI"]
  },
  {
    asset_infos: [{ native_token: { denom: ORAI } }, { native_token: { denom: ATOM_ORAICHAIN_DENOM } }],
    symbols: ["ORAI", "ATOM"],
    factoryV1: true
  },
  {
    asset_infos: [{ native_token: { denom: ORAI } }, { token: { contract_addr: USDT_CONTRACT } }],
    symbols: ["ORAI", "USDT"],
    factoryV1: true
  },
  {
    asset_infos: [{ token: { contract_addr: KWT_CONTRACT } }, { native_token: { denom: ORAI } }],
    symbols: ["KWT", "ORAI"],
    factoryV1: true
  },
  {
    asset_infos: [{ native_token: { denom: ORAI } }, { native_token: { denom: OSMOSIS_ORAICHAIN_DENOM } }],
    symbols: ["ORAI", "OSMO"],
    factoryV1: true
  },
  {
    asset_infos: [{ token: { contract_addr: MILKY_CONTRACT } }, { token: { contract_addr: USDT_CONTRACT } }],
    symbols: ["MILKY", "USDT"],
    factoryV1: true
  },
  {
    asset_infos: [{ native_token: { denom: ORAI } }, { token: { contract_addr: USDC_CONTRACT } }],
    symbols: ["ORAI", "USDC"]
  },
  {
    asset_infos: [{ native_token: { denom: ORAI } }, { token: { contract_addr: TRX_CONTRACT } }],
    symbols: ["ORAI", "wTRX"]
  },
  {
    asset_infos: [{ token: { contract_addr: SCATOM_CONTRACT } }, { native_token: { denom: ATOM_ORAICHAIN_DENOM } }],
    symbols: ["scATOM", "ATOM"]
  },
  {
    asset_infos: [{ token: { contract_addr: INJECTIVE_CONTRACT } }, { native_token: { denom: ORAI } }],
    symbols: ["INJ", "ORAI"]
  },
  // TODO: true order is oraix/usdc, but we reverse this to serve client
  {
    asset_infos: [{ token: { contract_addr: USDC_CONTRACT } }, { token: { contract_addr: ORAIX_CONTRACT } }],
    symbols: ["USDC", "ORAIX"]
  },
  {
    asset_infos: [{ native_token: { denom: ORAI } }, { token: { contract_addr: WETH_CONTRACT } }],
    symbols: ["ORAI", "WETH"]
  },
  {
    asset_infos: [{ native_token: { denom: NEUTARO_ADDRESS } }, { token: { contract_addr: USDC_CONTRACT } }],
    symbols: ["NTMPI", "USDC"]
  },
  {
    asset_infos: [{ native_token: { denom: ORAI } }, { token: { contract_addr: BTC_CONTRACT } }],
    symbols: ["ORAI", "BTC"]
  },
  {
    asset_infos: [{ token: { contract_addr: OCH_CONTRACT } }, { native_token: { denom: ORAI } }],
    symbols: ["OCH", "ORAI"]
  },
  {
    asset_infos: [{ native_token: { denom: MAX_ORAICHAIN_DENOM } }, { token: { contract_addr: ORAIX_CONTRACT } }],
    symbols: ["MAX", "ORAIX"]
  }
];
