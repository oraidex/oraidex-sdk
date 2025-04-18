import "dotenv/config";
import { CosmosWalletImpl } from "./offline-wallet";
import { UniversalSwapHandler } from "../handler";
import {
  generateError,
  toAmount,
  USDT_CONTRACT,
  ORAI,
  SCATOM_CONTRACT,
  OraidexCommon
} from "@oraichain/oraidex-common";
import { UniversalSwapHelper } from "../helper";

const oraichainToOraichain = async (chainId: "Oraichain") => {
  const wallet = new CosmosWalletImpl(process.env.MNEMONIC);

  const sender = await wallet.getKeplrAddr(chainId);
  const fromAmount = 0.01;

  const oraidexCommon = await OraidexCommon.load();
  const cosmosTokens = oraidexCommon.cosmosTokens;
  const flattenTokens = oraidexCommon.flattenTokens;

  let originalFromToken = cosmosTokens.find(
    (t) => t.chainId === chainId && t.contractAddress && t.contractAddress === USDT_CONTRACT
  );

  let originalToToken = flattenTokens.find(
    (t) => t.chainId === chainId && t.contractAddress && t.contractAddress === SCATOM_CONTRACT
  );

  if (!originalFromToken) throw generateError("Could not find original from token");
  if (!originalToToken) throw generateError("Could not find original to token");

  const smartRoutes = await UniversalSwapHelper.simulateSwapUsingSmartRoute({
    fromInfo: originalFromToken,
    toInfo: originalToToken,
    amount: toAmount(fromAmount, originalToToken.decimals).toString()
  });

  const universalHandler = new UniversalSwapHandler(
    {
      originalFromToken,
      originalToToken,
      sender: { cosmos: sender },
      relayerFee: {
        relayerAmount: "0",
        relayerDecimals: 6
      },
      simulatePrice: "1000000",
      fromAmount,
      simulateAmount: toAmount(fromAmount, originalToToken.decimals).toString(),
      userSlippage: 0.01
    },
    {
      cosmosWallet: wallet,
      swapOptions: {
        isIbcWasm: false,
        isAlphaIbcWasm: true
      }
    },
    oraidexCommon
  );

  try {
    const result = await universalHandler.processUniversalSwap();
    console.log("result: ", result);
  } catch (error) {
    console.log("error: ", error);
  }
};

(() => {
  return oraichainToOraichain("Oraichain");
})();
