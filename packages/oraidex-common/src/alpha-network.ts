import {
  ATOM_OSMOSIS_CONTRACT,
  INJ_OSMOSIS_CONTRACT,
  ORAI_OSMOSIS_CONTRACT,
  TIA_OSMOSIS_CONTRACT,
  TON_ALL_OSMOSIS_CONTRACT,
  TON_OSMOSIS_CONTRACT,
  USDC_OSMOSIS_CONTRACT
} from "./constant";
import { BridgeAppCurrency } from "./network";

export const AtomOsmosisToken: BridgeAppCurrency = {
  coinDenom: "ATOM",
  coinMinimalDenom: ATOM_OSMOSIS_CONTRACT,
  coinDecimals: 6,
  coinGeckoId: "cosmos",
  coinImageUrl: "https://dhj8dql1kzq2v.cloudfront.net/white/atom.png",
  gasPriceStep: {
    low: 0,
    average: 0.025,
    high: 0.04
  }
};

export const UsdcOsmosisToken: BridgeAppCurrency = {
  coinDenom: "USDC",
  coinMinimalDenom: USDC_OSMOSIS_CONTRACT,
  coinDecimals: 6,
  coinGeckoId: "usd-coin",
  coinImageUrl: "https://raw.githubusercontent.com/cosmos/chain-registry/master/noble/images/USDCoin.png",
  gasPriceStep: {
    low: 0,
    average: 0.025,
    high: 0.04
  }
};

export const OraiOsmosisToken: BridgeAppCurrency = {
  coinDenom: "ORAI",
  coinMinimalDenom: ORAI_OSMOSIS_CONTRACT,
  coinDecimals: 6,
  coinGeckoId: "oraichain-token",
  coinImageUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/7533.png",
  gasPriceStep: {
    low: 0,
    average: 0.025,
    high: 0.04
  }
};

export const TiaOsmosisToken: BridgeAppCurrency = {
  coinDenom: "TIA",
  coinMinimalDenom: TIA_OSMOSIS_CONTRACT,
  coinDecimals: 6,
  coinGeckoId: "celestia",
  coinImageUrl: "https://raw.githubusercontent.com/cosmos/chain-registry/master/celestia/images/celestia.png",
  gasPriceStep: {
    low: 0,
    average: 0.025,
    high: 0.04
  }
};

export const InjOsmosisToken: BridgeAppCurrency = {
  coinDenom: "INJ",
  coinMinimalDenom: INJ_OSMOSIS_CONTRACT,
  coinDecimals: 18,
  coinGeckoId: "injective-protocol",
  coinImageUrl: "https://raw.githubusercontent.com/cosmos/chain-registry/master/injective/images/inj.png",
  gasPriceStep: {
    low: 0,
    average: 0.025,
    high: 0.04
  }
};

export const TonOsmosisToken: BridgeAppCurrency = {
  coinDenom: "TON",
  coinMinimalDenom: TON_ALL_OSMOSIS_CONTRACT,
  coinDecimals: 9,
  bridgeTo: ["ton", "Oraichain"],
  coinGeckoId: "the-open-network",
  coinImageUrl: "https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/ton/images/ton.png",
  gasPriceStep: {
    low: 0,
    average: 0.025,
    high: 0.04
  }
};

export const TonOraiOsmosisToken: BridgeAppCurrency = {
  coinDenom: "TON.orai",
  coinMinimalDenom: TON_OSMOSIS_CONTRACT,
  coinDecimals: 9,
  bridgeTo: ["ton", "Oraichain"],
  coinGeckoId: "the-open-network",
  coinImageUrl: "https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/ton/images/ton.png",
  gasPriceStep: {
    low: 0,
    average: 0.025,
    high: 0.04
  }
};

export const listOsmosisToken = [
  AtomOsmosisToken,
  OraiOsmosisToken,
  TiaOsmosisToken,
  TonOsmosisToken,
  TonOraiOsmosisToken,
  InjOsmosisToken
];
