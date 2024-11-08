import { OraiCommon, TokenItemType as TokenItemTypeCommon } from "@oraichain/common";
import { PairInfo } from "@oraichain/oraidex-contracts-sdk";
import { flatten, uniqBy } from "lodash";
import { INJECTIVE_ORAICHAIN_DENOM, KWTBSC_ORAICHAIN_DENOM, MILKYBSC_ORAICHAIN_DENOM } from "./constant";
import { CoinGeckoId, CoinIcon, CustomChainInfo } from "./network";
import { SupportChainInfoImpl, SupportedChainInfoReaderFromConfig } from "./supported";
import { mapListWithIcon, tokenIconByCoingeckoId, tokensIcon } from "./config";

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
    Icon: currency.Icon,
    IconLight: currency?.IconLight
  }));
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
  console.log("92", isInitial);
  if (isInitial) {
    oraiCommon = await OraiCommon.initializeFromBackend();
    const readerInstance = new SupportedChainInfoReaderFromConfig();
    const supportedChainIns = SupportChainInfoImpl.create(readerInstance);
    const tokenListSupports = supportedChainIns.supportedChainInfo;

    const tokenInfos = [];
    for (const [chainId, coins] of Object.entries(tokenListSupports)) {
      const orgTokenList = oraiCommon.tokenItems.getSpecificChainTokens(chainId);
      const listCoinId = Object.values(coins);

      const fmtTokens = listCoinId.reduce((acc, tk) => {
        const findItem = orgTokenList.find((c) => [c.contractAddress, c.denom].includes(tk.denom));

        if (findItem) {
          console.log("tokenIconByCoingeckoId", tk.coingecko_id, tokenIconByCoingeckoId[tk.coingecko_id]);
          acc.push({
            ...findItem,
            coinGeckoId: tk.coingecko_id,
            Icon: tokenIconByCoingeckoId[tk.coingecko_id]?.Icon || "",
            IconLight: tokenIconByCoingeckoId[tk.coingecko_id]?.IconLight || ""
          });
        }

        return acc;
      }, []);

      tokenInfos.push(...fmtTokens);
    }

    tokenConfig.oraichainTokens = tokenInfos.filter((tk) => tk.chainId === "Oraichain");
    tokenConfig.otherChainTokens = tokenInfos.filter((tk) => tk.chainId !== "Oraichain");

    const { chainInfos, tokenItems } = oraiCommon;

    console.log({
      chainInfos: chainInfos.chainInfos.length,
      tokenItems: tokenItems.tokens.length,
      tokenConfig
    });
  }

  return { tokenConfig, oraiCommon };
};
await initOraiCommon();

// other chains, oraichain
export const oraichainTokens = tokenConfig.oraichainTokens;
export const otherChainTokens = tokenConfig.otherChainTokens;

// const otherChainTokens = flatten(
//   chainInfos.filter((chainInfo) => chainInfo.chainId !== "Oraichain").map(getTokensFromNetwork)
// );
// export const oraichainTokens: TokenItemType[] = getTokensFromNetwork(oraichainNetwork);

export const tokens = [otherChainTokens, oraichainTokens];
console.log("first", { tokens, oraichainTokens, otherChainTokens });

export const flattenTokens = flatten(tokens);
export const tokenMap = Object.fromEntries(flattenTokens.map((c) => [c.denom, c]));
export const assetInfoMap = Object.fromEntries(flattenTokens.map((c) => [c.contractAddress || c.denom, c]));
export const cosmosTokens = uniqBy(
  flattenTokens.filter(
    (token) =>
      // !token.contractAddress &&
      token.denom && token.cosmosBased && token.coinGeckoId
  ),
  (c) => c.denom
);

export const cw20Tokens = uniqBy(
  cosmosTokens.filter(
    // filter cosmos based tokens to collect tokens that have contract addresses
    (token) =>
      // !token.contractAddress &&
      token.contractAddress
  ),
  (c) => c.denom
);

export const cw20TokenMap = Object.fromEntries(cw20Tokens.map((c) => [c.contractAddress, c]));

export const evmTokens = uniqBy(
  flattenTokens.filter(
    (token) =>
      // !token.contractAddress &&
      token.denom && !token.cosmosBased && token.coinGeckoId && token.chainId !== "kawaii_6886-1"
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
