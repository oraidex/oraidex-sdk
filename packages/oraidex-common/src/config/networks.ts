import { OraiCommon } from "oraichain-common-test";

export const loadTokenItems = async () => {
  const { tokenItems } = await OraiCommon.initializeFromBackend();
  return { ...tokenItems };
};

export const loadOraichainTokens = async () => {
  const { chainInfos } = await OraiCommon.initializeFromBackend();
  return chainInfos.chainInfos.filter((chain) => chain.chainId === "Oraichain");
};

loadOraichainTokens();
