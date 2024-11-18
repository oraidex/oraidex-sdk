import { OraiCommon, TokenItemType as TokenItemTypeCommon } from "@oraichain/common";
import { PairInfo } from "@oraichain/oraidex-contracts-sdk";
import { flatten, uniqBy } from "lodash";
import { mapListWithIcon, tokenIconByCoingeckoId, tokensIcon } from "./config";
import { INJECTIVE_ORAICHAIN_DENOM, KWTBSC_ORAICHAIN_DENOM, MILKYBSC_ORAICHAIN_DENOM } from "./constant";
import { CoinGeckoId, CoinIcon, CustomChainInfo } from "./network";
import { readSupportedChainInfoStatic, supportedBridge } from "./supported";

export type EvmDenom = "bep20_orai" | "bep20_airi" | "erc20_orai" | "kawaii_orai";
export type AmountDetails = { [denom: string]: string };

/**
 * Prices of each token.
 */
export type CoinGeckoPrices<T extends string> = {
  [C in T]: number | null;
};

export type TokenItemType = TokenItemTypeCommon & {
  Icon: CoinIcon;
  IconLight?: CoinIcon;
  coinGeckoId: CoinGeckoId;
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

const evmDenomsMap = {
  kwt: [KWTBSC_ORAICHAIN_DENOM],
  milky: [MILKYBSC_ORAICHAIN_DENOM],
  injective: [INJECTIVE_ORAICHAIN_DENOM]
};
const minAmountSwapMap = {
  trx: 10
};

export const getTokensFromNetwork = (network: CustomChainInfo): TokenItemType[] => {
  return network.currencies.map((currency) => ({
    name: currency.coinDenom,
    org: network.chainName,
    coinType: network.bip44.coinType,
    contractAddress: currency.contractAddress,
    prefix: currency?.prefixToken ?? network.bech32Config?.bech32PrefixAccAddr,
    coinGeckoId: currency.coinGeckoId,
    denom: currency.coinMinimalDenom,
    bridgeNetworkIdentifier: currency.bridgeNetworkIdentifier,
    decimals: currency.coinDecimals,
    bridgeTo: currency.bridgeTo,
    chainId: network.chainId,
    rpc: network.rpc,
    lcd: network.rest,
    cosmosBased: network.networkType === "cosmos",
    maxGas: (network.feeCurrencies?.[0].gasPriceStep?.high ?? 0) * 20000,
    gasPriceStep: currency.gasPriceStep,
    feeCurrencies: network.feeCurrencies,
    minAmountSwap: minAmountSwapMap[currency.coinMinimalDenom],
    evmDenoms: evmDenomsMap[currency.coinMinimalDenom],
    Icon: currency.coinImageUrl,
    IconLight: currency.coinImageUrl,
    icon: currency.coinImageUrl
  })) as any;
};

let oraiCommon: OraiCommon = null;
let tokenConfig: {
  oraichainTokens: TokenItemType[];
  otherChainTokens: TokenItemType[];
} = {
  oraichainTokens: [],
  otherChainTokens: []
};

export const initOraiCommon = async () => {
  const isInitial = !oraiCommon || !tokenConfig.otherChainTokens.length || !tokenConfig.oraichainTokens.length;
  if (isInitial) {
    oraiCommon = await OraiCommon.initializeFromBackend();
    const tokenListSupports = await readSupportedChainInfoStatic();

    const tokenInfos = [];

    // filter to get tokens that are supported by the network.
    for (const [chainId, coins] of Object.entries(tokenListSupports)) {
      const chainTokens = oraiCommon.tokenItems.getSpecificChainTokens(chainId);
      const listSupportedTokenByChain = Object.values(coins);

      const fmtTokens = listSupportedTokenByChain.reduce((acc, supportedToken) => {
        const findItem = chainTokens.find((chainToken) =>
          [chainToken.contractAddress, chainToken.denom].includes(supportedToken.denom)
        );

        if (findItem) {
          const coinGeckoId = supportedToken.coingecko_id;

          acc.push({
            ...findItem,
            coinGeckoId,
            bridgeTo: !supportedBridge[chainId]?.[coinGeckoId]?.length
              ? undefined
              : supportedBridge[chainId]?.[coinGeckoId],
            Icon: findItem.icon || tokenIconByCoingeckoId[coinGeckoId]?.Icon || "",
            IconLight: findItem.icon || tokenIconByCoingeckoId[coinGeckoId]?.IconLight || ""
          });
        }

        return acc;
      }, []);
      tokenInfos.push(...fmtTokens);
    }

    tokenConfig.oraichainTokens = tokenInfos.filter((token) => token.chainId === "Oraichain");
    tokenConfig.otherChainTokens = tokenInfos.filter((token) => token.chainId !== "Oraichain");
  }

  return { tokenConfig, oraiCommon };
};
await initOraiCommon();

// other chains, oraichain
export const oraichainTokens = tokenConfig.oraichainTokens;
export const otherChainTokens = tokenConfig.otherChainTokens;
export const chainInfosCommon = oraiCommon.chainInfos;
export const tokens = [otherChainTokens, oraichainTokens];
export const flattenTokens = flatten(tokens);
export const tokenMap = Object.fromEntries(flattenTokens.map((c) => [c.denom, c]));
export const assetInfoMap = Object.fromEntries(flattenTokens.map((c) => [c.contractAddress || c.denom, c]));
export const cosmosTokens = uniqBy(
  flattenTokens.filter((token) => token.denom && token.cosmosBased && token.coinGeckoId),
  (c) => c.denom
);
export const cw20Tokens = uniqBy(
  cosmosTokens.filter(
    // filter cosmos based tokens to collect tokens that have contract addresses
    (token) => token.contractAddress
  ),
  (c) => c.denom
);
export const cw20TokenMap = Object.fromEntries(cw20Tokens.map((c) => [c.contractAddress, c]));
export const evmTokens = uniqBy(
  flattenTokens.filter(
    (token) => token.denom && !token.cosmosBased && token.coinGeckoId && token.chainId !== "kawaii_6886-1"
  ),
  (c) => c.denom
);
export const kawaiiTokens = uniqBy(
  cosmosTokens.filter((token) => token.chainId === "kawaii_6886-1"),
  (c) => c.denom
);
// mapped token with icon
export const oraichainTokensWithIcon = mapListWithIcon(oraichainTokens, tokensIcon, "coinGeckoId");
export const otherTokensWithIcon = mapListWithIcon(otherChainTokens, tokensIcon, "coinGeckoId");
export const tokensWithIcon = [otherTokensWithIcon, oraichainTokensWithIcon];
export const flattenTokensWithIcon = flatten(tokensWithIcon);
