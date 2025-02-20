import {
  generateError,
  isEvmChain,
  isTonChain,
  ORAI_BRIDGE_EVM_DENOM_PREFIX,
  ORAI_BRIDGE_EVM_TRON_DENOM_PREFIX,
  ORAI_BRIDGE_EVM_ETH_DENOM_PREFIX,
  OraidexCommon,
  checkValidateAddressWithNetwork
} from "@oraichain/oraidex-common";
import { Path, Route } from "../types";
import { CosmosMsg, OraichainMsg, OsmosisMsg } from "./chains";
import { MiddlewareResponse } from "./types";
import { EncodeObject } from "@cosmjs/proto-signing";
import { NetworkChainId } from "@oraichain/common";
import { Affiliate } from "@oraichain/oraidex-contracts-sdk/build/OraiswapMixedRouter.types";

const getDestPrefixForBridgeToEvmOnOrai = (chainId: string): string => {
  const prefixMap: { [key: string]: string } = {
    "0x01": ORAI_BRIDGE_EVM_ETH_DENOM_PREFIX,
    "0x38": ORAI_BRIDGE_EVM_DENOM_PREFIX,
    "0x2b6653dc": ORAI_BRIDGE_EVM_TRON_DENOM_PREFIX
  };

  const prefix = prefixMap[chainId];
  if (prefix) {
    return prefix;
  } else if (chainId.startsWith("0x")) {
    throw generateError(`Don't support bridge from Oraichain to ${chainId}`);
  }
  return "";
};

const buildMemoSwap = (
  path: Path,
  receiver: string,
  memo: string,
  addresses: { [chainId: string]: string },
  slippage: number = 0.01,
  oraidexCommon: OraidexCommon,
  previousChain?: string,
  affiliates?: Affiliate[]
): MiddlewareResponse => {
  let currentChain = path.chainId;
  let currentAddress = addresses[currentChain];

  switch (currentChain) {
    case "Oraichain": {
      let prefix = getDestPrefixForBridgeToEvmOnOrai(path.tokenOutChainId);
      const ORAIBRIDGE_SUBNET = "oraibridge-subnet-2";
      let oBridgeAddress = addresses[ORAIBRIDGE_SUBNET];
      if (!oBridgeAddress && !isEvmChain(path.tokenOutChainId, oraidexCommon.evmChains)) {
        throw generateError(`Missing oBridge address for ${ORAIBRIDGE_SUBNET}`);
      }

      let oraichainMsg = new OraichainMsg(
        path,
        "1",
        receiver,
        currentAddress,
        memo,
        oraidexCommon,
        prefix,
        oBridgeAddress,
        affiliates
      );
      oraichainMsg.setMinimumReceiveForSwap(slippage);
      // we have 2 cases:
      // - Previous chain use IBC bridge to Oraichain
      // -  Previous chain use IBC Wasm bridge to Oraichain (EVM, noble, ton)
      let msgInfo =
        previousChain &&
        (previousChain == "noble-1" || isEvmChain(previousChain, oraidexCommon.evmChains) || isTonChain(previousChain))
          ? oraichainMsg.genMemoForIbcWasm()
          : oraichainMsg.genMemoAsMiddleware();
      return msgInfo;
    }
    case "osmosis-1": {
      let cosmosMsg = new OsmosisMsg(path, "1", receiver, currentAddress, memo, oraidexCommon, []);
      cosmosMsg.setMinimumReceiveForSwap(slippage);
      let msgInfo = cosmosMsg.genMemoAsMiddleware();
      return msgInfo;
    }

    default: {
      // currently, we don't support universal swap on EVM
      // default cosmos case
      if (currentChain.startsWith("0x")) {
        throw generateError("Don't support universal swap in EVM");
      }
      let cosmosMsg = new CosmosMsg(path, "1", receiver, currentAddress, memo, oraidexCommon, []);
      cosmosMsg.setMinimumReceiveForSwap(slippage);
      let msgInfo = cosmosMsg.genMemoAsMiddleware();
      return msgInfo;
    }
  }
};

const buildExecuteMsg = (
  path: Path,
  receiver: string,
  memo: string,
  addresses: { [chainId: string]: string },
  slippage: number = 0.01,
  oraidexCommon: OraidexCommon,
  affiliates?: Affiliate[]
): EncodeObject => {
  let currentChain = path.chainId;
  let currentAddress = addresses[currentChain];
  switch (currentChain) {
    case "Oraichain": {
      let prefix = getDestPrefixForBridgeToEvmOnOrai(path.tokenOutChainId);
      const ORAIBRIDGE_SUBNET = "oraibridge-subnet-2";
      let oBridgeAddress = addresses[ORAIBRIDGE_SUBNET];
      if (!oBridgeAddress && !isEvmChain(path.tokenOutChainId, oraidexCommon.evmChains)) {
        throw generateError(`Missing oBridge address for ${ORAIBRIDGE_SUBNET}`);
      }

      let oraichainMsg = new OraichainMsg(
        path,
        "1",
        receiver,
        currentAddress,
        memo,
        oraidexCommon,
        prefix,
        oBridgeAddress,
        affiliates
      );
      oraichainMsg.setMinimumReceiveForSwap(slippage);
      return oraichainMsg.genExecuteMsg();
    }
    case "osmosis-1": {
      let cosmosMsg = new OsmosisMsg(path, "1", receiver, currentAddress, memo, oraidexCommon, []);
      cosmosMsg.setMinimumReceiveForSwap(slippage);
      return cosmosMsg.genExecuteMsg();
    }

    default: {
      // currently, we don't support universal swap on EVM
      // default cosmos case
      if (currentChain.startsWith("0x")) {
        throw generateError("Don't support universal swap in EVM");
      }
      let cosmosMsg = new CosmosMsg(path, "1", receiver, currentAddress, memo, oraidexCommon, []);
      cosmosMsg.setMinimumReceiveForSwap(slippage);
      return cosmosMsg.genExecuteMsg();
    }
  }
};

export const generateMsgSwap = (
  route: Route,
  slippage: number = 0.01,
  addresses: { [chainId: string]: string },
  oraidexCommon: OraidexCommon,
  recipientAddress?: string,
  affiliates?: Affiliate[]
): EncodeObject => {
  if (route.paths.length == 0) {
    throw generateError("Require at least 1 action");
  }
  let memo: string = "";
  const tokenOutChainId = route.paths.at(-1)?.tokenOutChainId;
  let receiver = addresses[tokenOutChainId];

  if (recipientAddress) {
    const isValidRecipient = checkValidateAddressWithNetwork(
      recipientAddress,
      tokenOutChainId as NetworkChainId,
      oraidexCommon.cosmosChains
    );
    if (!isValidRecipient.isValid) throw generateError("Recipient address invalid when generateMsgSwap!");
    receiver = recipientAddress;
  }

  // generate memo for univeral swap
  for (let i = route.paths.length - 1; i > 0; i--) {
    let swapInfo = buildMemoSwap(
      route.paths[i],
      receiver,
      memo,
      addresses,
      slippage,
      oraidexCommon,
      route.paths[i - 1].chainId,
      affiliates
    );
    memo = swapInfo.memo;
    receiver = swapInfo.receiver;
  }

  return buildExecuteMsg(route.paths[0], receiver, memo, addresses, slippage, oraidexCommon, affiliates);
};

export const generateMemoSwap = (
  route: Route,
  slippage: number = 0.01,
  addresses: { [chainId: string]: string },
  oraidexCommon: OraidexCommon,
  recipientAddress?: string,
  previousChain?: string,
  affiliates?: Affiliate[]
): MiddlewareResponse => {
  if (route.paths.length == 0) {
    return {
      memo: "",
      receiver: ""
    };
  }

  let memo: string = "";
  const tokenOutChainId = route.paths.at(-1)?.tokenOutChainId;
  let receiver = addresses[tokenOutChainId];
  if (recipientAddress) {
    const isValidRecipient = checkValidateAddressWithNetwork(
      recipientAddress,
      tokenOutChainId as NetworkChainId,
      oraidexCommon.cosmosChains
    );
    if (!isValidRecipient.isValid) throw generateError("Recipient address invalid when generateMemoSwap!");
    receiver = recipientAddress;
  }

  // generate memo for univeral swap
  for (let i = route.paths.length - 1; i > 0; i--) {
    let swapInfo = buildMemoSwap(
      route.paths[i],
      receiver,
      memo,
      addresses,
      slippage,
      oraidexCommon,
      route.paths[i - 1].chainId,
      affiliates
    );
    memo = swapInfo.memo;
    receiver = swapInfo.receiver;
  }
  return buildMemoSwap(route.paths[0], receiver, memo, addresses, slippage, oraidexCommon, previousChain);
};
