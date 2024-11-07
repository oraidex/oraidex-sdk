import { OraiCommon, TokenItemsImpl } from "@oraichain/common";
import { SupportedChainInfoReaderFromGit } from "../supported";

export const loadConfigs = async () => {
  const oraiCommon = await OraiCommon.initializeFromBackend();
  return oraiCommon;
};

export const loadTokenItems = async () => {
  const { tokenItems } = await OraiCommon.initializeFromBackend();
  return { ...tokenItems };
};

export const loadOraichainTokens = async () => {
  const { tokenItems } = await OraiCommon.initializeFromBackend();
  const oraichainToken = tokenItems.getSpecificChainTokens("Oraichain");

  return oraichainToken;
};

export const loadTokenByChain = async (chainId: string) => {
  const { tokenItems } = await OraiCommon.initializeFromBackend();
  const tokens = tokenItems.getSpecificChainTokens(chainId);

  return tokens;
};

export const loadSpecificChainInfo = async (chainId: string) => {
  const { chainInfos } = await loadConfigs();
  const chain = chainInfos.getSpecificChainInfo(chainId);

  return chain;
};

export const loadSupportedToken = async (dex: string = "oraidex", accessToken: string = "") => {
  const { tokenItems } = await OraiCommon.initializeFromBackend();
  const readerInstance = new SupportedChainInfoReaderFromGit(dex, accessToken);

  const tokenListSupports = await readerInstance.readSupportedChainInfo();

  const tokenInfos = [];
  for (const [chainId, coins] of Object.entries(tokenListSupports)) {
    const orgTokenList = tokenItems.getSpecificChainTokens(chainId);
    const listCoinId = Object.values(coins.coin);

    const fmtTokens = orgTokenList.reduce((acc, tk) => {
      const findItem = listCoinId.find((c) => [tk.contractAddress, tk.denom].includes(c.denom));

      if (findItem) {
        acc.push({
          ...tk,
          coinGeckoId: findItem.coingecko_id
        });
      }

      return acc;
    }, []);

    tokenInfos.push(...fmtTokens);
  }

  return tokenInfos;
};
