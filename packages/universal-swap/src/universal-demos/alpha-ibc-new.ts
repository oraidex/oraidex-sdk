import "dotenv/config";
import { UniversalSwapHandler } from "../handler";
import { CosmosWalletImpl } from "./offline-wallet";
import { generateError, OraidexCommon, toAmount } from "@oraichain/oraidex-common";

const router = {
  swapAmount: "16000000",
  returnAmount: "1000000",
  routes: [
    {
      swapAmount: "16000000",
      returnAmount: "1000000",
      paths: [
        {
          chainId: "Oraichain",
          tokenIn: "orai15un8msx3n5zf9ahlxmfeqd2kwa5wm0nrpxer304m9nd5q6qq0g6sku5pdd",
          tokenInAmount: "16000000",
          tokenOut: "EQB-MPwrd1G6WKNkLz_VnV6WqBDd142KMQv-g1O-8QUA3728",
          tokenOutAmount: "1000000",
          tokenOutChainId: "ton",
          actions: [
            {
              type: "Bridge",
              protocol: "Bridge",
              tokenIn: "orai15un8msx3n5zf9ahlxmfeqd2kwa5wm0nrpxer304m9nd5q6qq0g6sku5pdd",
              tokenInAmount: "16000000",
              tokenOut: "EQB-MPwrd1G6WKNkLz_VnV6WqBDd142KMQv-g1O-8QUA3728",
              tokenOutAmount: "1000000",
              tokenOutChainId: "ton",
              bridgeInfo: {
                port: "transfer",
                channel: "channel-1"
              }
            }
          ]
        }
      ]
    }
  ]
};
const alphaSwapToOraichain = async () => {
  const wallet = new CosmosWalletImpl(process.env.MNEMONIC);
  const chainId = "Oraichain";
  const sender = await wallet.getKeplrAddr(chainId);

  const fromAmount = 16;
  console.log("sender: ", sender);

  const oraidexCommon = await OraidexCommon.load();
  const flattenTokens = oraidexCommon.flattenTokens;
  const originalFromToken = flattenTokens.find((t) => t.coinGeckoId === "usd-coin" && t.chainId === chainId);
  const originalToToken = flattenTokens.find((t) => t.coinGeckoId === "usd-coin" && t.chainId === "ton");

  if (!originalToToken) throw generateError("Could not find original to token");
  if (!originalFromToken) throw generateError("Could not find original from token");

  const universalHandler = new UniversalSwapHandler(
    {
      originalFromToken,
      originalToToken,
      sender: {
        cosmos: sender,
        // evm: "0x8c7E0A841269a01c0Ab389Ce8Fb3Cf150A94E797",
        ton: "UQDOAHXyCPFOXAXm9c1P_NeNEeSWy6IaRHqJRnBUp0jMZ6i3"
      },
      fromAmount,
      userSlippage: 1,
      // relayerFee: {
      //   relayerAmount: "100000",
      //   relayerDecimals: 6
      // },
      // recipientAddress: "celestia13lpgsy2dk9ftwac2uagw7fc2fw35cdp00xucfz",
      simulatePrice: "1000000",
      simulateAmount: toAmount(fromAmount, originalToToken.decimals).toString(),
      alphaSmartRoutes: router
    },
    {
      cosmosWallet: wallet,
      swapOptions: { isIbcWasm: false, isAlphaIbcWasm: true }
    },
    oraidexCommon
  );

  try {
    const result = await universalHandler.processUniversalSwap();
    console.log("result: ", result);
  } catch (error) {
    console.trace("error: ", error);
  }
};

(() => {
  alphaSwapToOraichain().catch((error) => {
    console.log({ error_alphaSwapToOraichain: error });
  });
})();
