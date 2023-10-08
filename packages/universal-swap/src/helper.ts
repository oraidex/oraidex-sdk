import {
  CoinGeckoId,
  WRAP_BNB_CONTRACT,
  USDT_BSC_CONTRACT,
  USDT_TRON_CONTRACT,
  ORAI_ETH_CONTRACT,
  ORAI_BSC_CONTRACT,
  AIRI_BSC_CONTRACT,
  WRAP_ETH_CONTRACT,
  USDC_ETH_CONTRACT,
  EvmChainId,
  proxyContractInfo,
  CosmosChainId,
  NetworkChainId,
  IBCInfo,
  generateError,
  ibcInfos,
  oraib2oraichain,
  KWT_BSC_CONTRACT,
  MILKY_BSC_CONTRACT,
  TokenItemType,
  parseTokenInfoRawDenom,
  getTokenOnOraichain,
  isEthAddress,
  PAIRS,
  ORAI_INFO,
  parseTokenInfo,
  toAmount,
  TokenInfo,
  toDisplay,
  getTokenOnSpecificChainId,
  IUniswapV2Router02__factory
} from "@oraichain/oraidex-common";
import { SimulateResponse, UniversalSwapType } from "./types";
import { AssetInfo, CosmWasmClient, OraiswapRouterReadOnlyInterface } from "@oraichain/oraidex-contracts-sdk";
import { SwapOperation } from "@oraichain/oraidex-contracts-sdk/build/OraiswapRouter.types";
import { isEqual } from "lodash";
import { ethers } from "ethers";

// evm swap helpers
export const isSupportedNoPoolSwapEvm = (coingeckoId: CoinGeckoId) => {
  switch (coingeckoId) {
    case "wbnb":
    case "weth":
    case "binancecoin":
    case "ethereum":
      return true;
    default:
      return false;
  }
};

export const isEvmNetworkNativeSwapSupported = (chainId: NetworkChainId) => {
  switch (chainId) {
    case "0x01":
    case "0x38":
      return true;
    default:
      return false;
  }
};

export const swapEvmRoutes: {
  [network: string]: {
    [pair: string]: string[];
  };
} = {
  "0x38": {
    [`${WRAP_BNB_CONTRACT}-${USDT_BSC_CONTRACT}`]: [WRAP_BNB_CONTRACT, USDT_BSC_CONTRACT],
    [`${WRAP_BNB_CONTRACT}-${USDT_TRON_CONTRACT}`]: [WRAP_BNB_CONTRACT, USDT_BSC_CONTRACT],
    [`${WRAP_BNB_CONTRACT}-${ORAI_ETH_CONTRACT}`]: [WRAP_BNB_CONTRACT, ORAI_BSC_CONTRACT],
    [`${WRAP_BNB_CONTRACT}-${ORAI_BSC_CONTRACT}`]: [WRAP_BNB_CONTRACT, ORAI_BSC_CONTRACT],
    [`${WRAP_BNB_CONTRACT}-${AIRI_BSC_CONTRACT}`]: [WRAP_BNB_CONTRACT, AIRI_BSC_CONTRACT],
    [`${USDT_BSC_CONTRACT}-${AIRI_BSC_CONTRACT}`]: [USDT_BSC_CONTRACT, WRAP_BNB_CONTRACT, AIRI_BSC_CONTRACT],
    [`${USDT_BSC_CONTRACT}-${ORAI_BSC_CONTRACT}`]: [USDT_BSC_CONTRACT, WRAP_BNB_CONTRACT, ORAI_BSC_CONTRACT],
    [`${ORAI_BSC_CONTRACT}-${AIRI_BSC_CONTRACT}`]: [ORAI_BSC_CONTRACT, WRAP_BNB_CONTRACT, AIRI_BSC_CONTRACT]
  },
  "0x01": {
    [`${WRAP_ETH_CONTRACT}-${USDC_ETH_CONTRACT}`]: [WRAP_ETH_CONTRACT, USDC_ETH_CONTRACT],
    [`${WRAP_ETH_CONTRACT}-${ORAI_ETH_CONTRACT}`]: [WRAP_ETH_CONTRACT, ORAI_ETH_CONTRACT]
  }
};

export const buildSwapRouterKey = (fromContractAddr: string, toContractAddr: string) => {
  return `${fromContractAddr}-${toContractAddr}`;
};

export const getEvmSwapRoute = (
  chainId: string,
  fromContractAddr?: string,
  toContractAddr?: string
): string[] | undefined => {
  if (!isEvmNetworkNativeSwapSupported(chainId as EvmChainId)) return undefined;
  if (!fromContractAddr && !toContractAddr) return undefined;
  const chainRoutes = swapEvmRoutes[chainId];
  const fromAddr = fromContractAddr || proxyContractInfo[chainId].wrapNativeAddr;
  const toAddr = toContractAddr || proxyContractInfo[chainId].wrapNativeAddr;

  // in case from / to contract addr is empty aka native eth or bnb without contract addr then we fallback to swap route with wrapped token
  // because uniswap & pancakeswap do not support simulating with native directly
  let route: string[] | undefined = chainRoutes[buildSwapRouterKey(fromAddr, toContractAddr)];
  if (route) return route;
  // because the route can go both ways. Eg: WBNB->AIRI, if we want to swap AIRI->WBNB, then first we find route WBNB->AIRI, then we reverse the route
  route = chainRoutes[buildSwapRouterKey(toAddr, fromContractAddr)];
  if (route) {
    return [].concat(route).reverse();
  }
  return undefined;
};

// static functions
export const isEvmSwappable = (data: {
  fromChainId: string;
  toChainId: string;
  fromContractAddr?: string;
  toContractAddr?: string;
}): boolean => {
  const { fromChainId, fromContractAddr, toChainId, toContractAddr } = data;
  // cant swap if they are not on the same evm chain
  if (fromChainId !== toChainId) return false;
  // cant swap on evm if chain id is not eth or bsc
  if (fromChainId !== "0x01" && fromChainId !== "0x38") return false;
  // if the tokens do not have contract addresses then we skip
  // if (!fromContractAddr || !toContractAddr) return false;
  // only swappable if there's a route to swap from -> to
  if (!getEvmSwapRoute(fromChainId, fromContractAddr, toContractAddr)) return false;
  return true;
};

// ibc helpers
export const getIbcInfo = (fromChainId: CosmosChainId, toChainId: NetworkChainId): IBCInfo => {
  if (!ibcInfos[fromChainId]) throw generateError("Cannot find ibc info");
  return ibcInfos[fromChainId][toChainId];
};

export const buildIbcWasmPairKey = (ibcPort: string, ibcChannel: string, denom: string) => {
  return `${ibcPort}/${ibcChannel}/${denom}`;
};

/**
 * This function converts the destination address (from BSC / ETH -> Oraichain) to an appropriate format based on the BSC / ETH token contract address
 * @param keplrAddress - receiver address on Oraichain
 * @param contractAddress - BSC / ETH token contract address
 * @returns converted receiver address
 */
export const getSourceReceiver = (keplrAddress: string, contractAddress?: string): string => {
  let oneStepKeplrAddr = `${oraib2oraichain}/${keplrAddress}`;
  // we only support the old oraibridge ibc channel <--> Oraichain for MILKY & KWT
  if (contractAddress === KWT_BSC_CONTRACT || contractAddress === MILKY_BSC_CONTRACT) {
    oneStepKeplrAddr = keplrAddress;
  }
  return oneStepKeplrAddr;
};

/**
 * This function receives fromToken and toToken as parameters to generate the destination memo for the receiver address
 * @param from - from token
 * @param to - to token
 * @param destReceiver - destination destReceiver
 * @returns destination in the format <dest-channel>/<dest-destReceiver>:<dest-denom>
 */
export const getDestination = (
  fromToken?: TokenItemType,
  toToken?: TokenItemType,
  destReceiver?: string
): { destination: string; universalSwapType: UniversalSwapType } => {
  if (!fromToken || !toToken || !destReceiver)
    return { destination: "", universalSwapType: "other-networks-to-oraichain" };
  // this is the simplest case. Both tokens on the same Oraichain network => simple swap with to token denom
  if (fromToken.chainId === "Oraichain" && toToken.chainId === "Oraichain") {
    return { destination: "", universalSwapType: "oraichain-to-oraichain" };
  }
  // we dont need to have any destination for this case
  if (fromToken.chainId === "Oraichain") {
    return { destination: "", universalSwapType: "oraichain-to-other-networks" };
  }
  if (
    fromToken.chainId === "cosmoshub-4" ||
    fromToken.chainId === "osmosis-1" ||
    fromToken.chainId === "kawaii_6886-1" ||
    fromToken.chainId === "0x1ae6"
  ) {
    throw new Error(`chain id ${fromToken.chainId} is currently not supported in universal swap`);
  }
  // if to token chain id is Oraichain, then we dont need to care about ibc msg case
  if (toToken.chainId === "Oraichain") {
    // first case, two tokens are the same, only different in network => simple swap
    if (fromToken.coinGeckoId === toToken.coinGeckoId)
      return { destination: destReceiver, universalSwapType: "other-networks-to-oraichain" };
    // if they are not the same then we set dest denom
    return {
      destination: `${destReceiver}:${parseTokenInfoRawDenom(toToken)}`,
      universalSwapType: "other-networks-to-oraichain"
    };
  }
  // the remaining cases where we have to process ibc msg
  const ibcInfo: IBCInfo = ibcInfos["Oraichain"][toToken.chainId]; // we get ibc channel that transfers toToken from Oraichain to the toToken chain
  // getTokenOnOraichain is called to get the ibc denom / cw20 denom on Oraichain so that we can create an ibc msg using it
  let receiverPrefix = "";
  // TODO: no need to use to token on Oraichain. Can simply use the destination token directly. Fix this requires fixing the logic on ibc wasm as well
  const toTokenOnOraichain = getTokenOnOraichain(toToken.coinGeckoId);
  if (!toTokenOnOraichain)
    return {
      destination: "",
      universalSwapType: "other-networks-to-oraichain"
    };
  if (isEthAddress(destReceiver)) receiverPrefix = toToken.prefix;
  return {
    destination: `${ibcInfo.channel}/${receiverPrefix}${destReceiver}:${parseTokenInfoRawDenom(toTokenOnOraichain)}`,
    universalSwapType: "other-networks-to-oraichain"
  };
};

export const combineReceiver = (
  sourceReceiver: string,
  fromToken?: TokenItemType,
  toToken?: TokenItemType,
  destReceiver?: string
): { combinedReceiver: string; universalSwapType: UniversalSwapType } => {
  const source = getSourceReceiver(sourceReceiver, fromToken?.contractAddress);
  const { destination, universalSwapType } = getDestination(fromToken, toToken, destReceiver);
  if (destination.length > 0) return { combinedReceiver: `${source}:${destination}`, universalSwapType };
  return { combinedReceiver: source, universalSwapType };
};

// generate messages
export const generateSwapOperationMsgs = (offerInfo: AssetInfo, askInfo: AssetInfo): SwapOperation[] => {
  const pairExist = PAIRS.some((pair) => {
    let assetInfos = pair.asset_infos;
    return (
      (isEqual(assetInfos[0], offerInfo) && isEqual(assetInfos[1], askInfo)) ||
      (isEqual(assetInfos[1], offerInfo) && isEqual(assetInfos[0], askInfo))
    );
  });

  return pairExist
    ? [
        {
          orai_swap: {
            offer_asset_info: offerInfo,
            ask_asset_info: askInfo
          }
        }
      ]
    : [
        {
          orai_swap: {
            offer_asset_info: offerInfo,
            ask_asset_info: ORAI_INFO
          }
        },
        {
          orai_swap: {
            offer_asset_info: ORAI_INFO,
            ask_asset_info: askInfo
          }
        }
      ];
};

// simulate swap functions
export const simulateSwap = async (query: {
  fromInfo: TokenItemType;
  toInfo: TokenItemType;
  amount: string;
  routerClient: OraiswapRouterReadOnlyInterface;
}) => {
  const { amount, fromInfo, toInfo, routerClient } = query;

  // check for universal-swap 2 tokens that have same coingeckoId, should return simulate data with average ratio 1-1.
  if (fromInfo.coinGeckoId === toInfo.coinGeckoId) {
    return {
      amount
    };
  }

  // check if they have pairs. If not then we go through ORAI
  const { info: offerInfo } = parseTokenInfo(fromInfo, amount);
  const { info: askInfo } = parseTokenInfo(toInfo);
  const operations = generateSwapOperationMsgs(offerInfo, askInfo);
  try {
    let finalAmount = amount;
    let isSimulatingRatio = false;
    // hard-code for tron because the WTRX/USDT pool is having a simulation problem (returning zero / error when simulating too small value of WTRX)
    if (fromInfo.coinGeckoId === "tron" && amount === toAmount(1, fromInfo.decimals).toString()) {
      finalAmount = toAmount(10, fromInfo.decimals).toString();
      isSimulatingRatio = true;
    }
    const data = await routerClient.simulateSwapOperations({
      offerAmount: finalAmount,
      operations
    });
    if (!isSimulatingRatio) return data;
    return { amount: data.amount.substring(0, data.amount.length - 1) };
  } catch (error) {
    throw new Error(`Error when trying to simulate swap using router v2: ${error}`);
  }
};

export const simulateSwapEvm = async (query: {
  fromInfo: TokenItemType;
  toInfo: TokenItemType;
  amount: string;
}): Promise<SimulateResponse> => {
  const { amount, fromInfo, toInfo } = query;

  // check for universal-swap 2 tokens that have same coingeckoId, should return simulate data with average ratio 1-1.
  if (fromInfo.coinGeckoId === toInfo.coinGeckoId) {
    return {
      amount,
      displayAmount: toDisplay(amount, toInfo.decimals)
    };
  }
  try {
    // get proxy contract object so that we can query the corresponding router address
    const provider = new ethers.providers.JsonRpcProvider(fromInfo.rpc);
    const toTokenInfoOnSameChainId = getTokenOnSpecificChainId(toInfo.coinGeckoId, fromInfo.chainId);
    const swapRouterV2 = IUniswapV2Router02__factory.connect(proxyContractInfo[fromInfo.chainId].routerAddr, provider);
    const route = getEvmSwapRoute(fromInfo.chainId, fromInfo.contractAddress, toTokenInfoOnSameChainId.contractAddress);
    const outs = await swapRouterV2.getAmountsOut(amount, route);
    if (outs.length === 0) throw new Error("There is no output amounts after simulating evm swap");
    let simulateAmount = outs.slice(-1)[0].toString();
    return {
      // to display to reset the simulate amount to correct display type (swap simulate from -> same chain id to, so we use same chain id toToken decimals)
      // then toAmount with actual toInfo decimals so that it has the same decimals as other tokens displayed
      amount: simulateAmount,
      displayAmount: toDisplay(simulateAmount, toTokenInfoOnSameChainId.decimals) // get the final out amount, which is the token out amount we want
    };
  } catch (ex) {
    console.log("error simulating evm: ", ex);
  }
};

export const handleSimulateSwap = async (query: {
  originalFromInfo: TokenItemType;
  originalToInfo: TokenItemType;
  originalAmount: number;
  routerClient: OraiswapRouterReadOnlyInterface;
}): Promise<SimulateResponse> => {
  // if the from token info is on bsc or eth, then we simulate using uniswap / pancake router
  // otherwise, simulate like normal
  if (
    isSupportedNoPoolSwapEvm(query.originalFromInfo.coinGeckoId) ||
    isEvmSwappable({
      fromChainId: query.originalFromInfo.chainId,
      toChainId: query.originalToInfo.chainId,
      fromContractAddr: query.originalFromInfo.contractAddress,
      toContractAddr: query.originalToInfo.contractAddress
    })
  ) {
    // reset previous amount calculation since now we need to deal with original from & to info, not oraichain token info
    const { amount, displayAmount } = await simulateSwapEvm({
      fromInfo: query.originalFromInfo,
      toInfo: query.originalToInfo,
      amount: toAmount(query.originalAmount, query.originalFromInfo.decimals).toString()
    });
    console.log("amount, display amount: ", { amount, displayAmount });
    return { amount, displayAmount };
  }
  const fromInfo = getTokenOnOraichain(query.originalFromInfo.coinGeckoId);
  const toInfo = getTokenOnOraichain(query.originalToInfo.coinGeckoId);
  if (!fromInfo || !toInfo)
    throw new Error(
      `Cannot find token on Oraichain for token ${query.originalFromInfo.coinGeckoId} and ${query.originalToInfo.coinGeckoId}`
    );
  const { amount } = await simulateSwap({
    fromInfo,
    toInfo,
    amount: toAmount(query.originalAmount, fromInfo.decimals).toString(),
    routerClient: query.routerClient
  });
  return {
    amount,
    displayAmount: toDisplay(amount, getTokenOnOraichain(toInfo.coinGeckoId)?.decimals)
  };
};
