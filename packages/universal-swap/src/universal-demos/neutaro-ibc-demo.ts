import "dotenv/config";
import { CosmosWalletImpl } from "./offline-wallet";
import { UniversalSwapHandler } from "../handler";
import { NEUTARO_ORAICHAIN_DENOM, OraidexCommon, generateError, toAmount } from "@oraichain/oraidex-common";

const neutaroUsdcToOraiUsdc = async (chainId: "Neutaro-1" | "Oraichain") => {
  const wallet = new CosmosWalletImpl(process.env.MNEMONIC);
  const sender = await wallet.getKeplrAddr(chainId);
  const fromAmount = 0.01;

  const oraidexCommon = await OraidexCommon.load();
  const cosmosTokens = oraidexCommon.cosmosTokens;
  let originalFromToken = cosmosTokens.find((t) => t.chainId === "Neutaro-1" && t.denom === "uneutaro");

  let originalToToken = cosmosTokens.find(
    (t) => t.chainId === "Oraichain" && t.denom && t.denom === NEUTARO_ORAICHAIN_DENOM
  );

  // if we bridge from Oraichain -> Neutaro then we reverse order
  if (chainId === "Oraichain") {
    const temp = originalFromToken;
    originalFromToken = originalToToken;
    originalToToken = temp;
  }

  if (!originalFromToken) throw generateError("Could not find original from token");
  if (!originalToToken) throw generateError("Could not find original to token");
  const universalHandler = new UniversalSwapHandler(
    {
      originalFromToken,
      originalToToken,
      sender: { cosmos: sender },
      fromAmount,
      simulateAmount: toAmount(fromAmount, originalToToken.decimals).toString()
    },
    { cosmosWallet: wallet, swapOptions: { ibcInfoTestMode: true } },
    oraidexCommon
  );

  try {
    const result = await universalHandler.processUniversalSwap();
    console.log("result: ", result);
  } catch (error) {
    console.log("error: ", error);
  }
};

(async () => {
  if (process.env.FORWARD) return neutaroUsdcToOraiUsdc("Neutaro-1");
  return neutaroUsdcToOraiUsdc("Oraichain");
})();
