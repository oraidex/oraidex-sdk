import {
  INJECTIVE_ORAICHAIN_DENOM,
  KWTBSC_ORAICHAIN_DENOM,
  KWT_BSC_CONTRACT,
  MILKYBSC_ORAICHAIN_DENOM,
  MILKY_BSC_CONTRACT,
  TokenItemType,
  // getOraidexCommonAttribute,
} from "@oraichain/oraidex-common";

export const evmDenomsMap = {
  kwt: [KWTBSC_ORAICHAIN_DENOM],
  milky: [MILKYBSC_ORAICHAIN_DENOM],
  injective: [INJECTIVE_ORAICHAIN_DENOM]
};
export const notAllowSwapCoingeckoIds = [];
// universal swap. Currently we dont support from tokens that are not using the ibc wasm channel
export const notAllowSwapFromChainIds = [
  "0x1ae6",
  "kawaii_6886-1",
  "oraibridge-subnet-2",
  "oraibtc-mainnet-1",
  "Neutaro-1",
  "bitcoin"
];
export const notAllowDenom = Object.values(evmDenomsMap).flat();
export const notAllowBEP20Token = [KWT_BSC_CONTRACT, MILKY_BSC_CONTRACT];
// export const swapFromTokens = flattenTokens.filter((token) => {
//   return (
//     !notAllowDenom.includes(token?.denom) &&
//     !notAllowSwapCoingeckoIds.includes(token.coinGeckoId) &&
//     !notAllowSwapFromChainIds.includes(token.chainId) &&
//     !notAllowBEP20Token.includes(token?.contractAddress)
//   );
// });
// universal swap. We dont support kwt & milky & injective for simplicity. We also skip OraiBridge tokens because users dont care about them
export const notAllowSwapToChainIds = [
  "0x1ae6",
  "kawaii_6886-1",
  "oraibridge-subnet-2",
  "oraibtc-mainnet-1",
  "Neutaro-1",
  "bitcoin"
];
// export const swapToTokens = flattenTokens.filter((token) => {
//   return (
//     !notAllowDenom.includes(token?.denom) &&
//     !notAllowSwapCoingeckoIds.includes(token.coinGeckoId) &&
//     !notAllowSwapToChainIds.includes(token.chainId) &&
//     !notAllowBEP20Token.includes(token?.contractAddress)
//   );
// });

export const getSwapFromTokens = (flattenTokens: TokenItemType[]) => {
  // const flattenTokens = getOraidexCommonAttribute<TokenItemType[]>('flattenTokens');
  return flattenTokens.filter((token) => {
    return (
      !notAllowDenom.includes(token?.denom) &&
      !notAllowSwapCoingeckoIds.includes(token.coinGeckoId) &&
      !notAllowSwapFromChainIds.includes(token.chainId) &&
      !notAllowBEP20Token.includes(token?.contractAddress)
    );
  });
}

export const getSwapToTokens = (flattenTokens: TokenItemType[]) => {
  // const flattenTokens = getOraidexCommonAttribute<TokenItemType[]>('flattenTokens');
  return flattenTokens.filter((token) => {
    return (
      !notAllowDenom.includes(token?.denom) &&
      !notAllowSwapCoingeckoIds.includes(token.coinGeckoId) &&
      !notAllowSwapToChainIds.includes(token.chainId) &&
      !notAllowBEP20Token.includes(token?.contractAddress)
    );
  });
}