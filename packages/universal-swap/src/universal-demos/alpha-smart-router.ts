import "dotenv/config";
import { CosmosWalletImpl } from "./offline-wallet";
import { UniversalSwapHandler } from "../handler";
import { generateError, OraidexCommon } from "@oraichain/oraidex-common";

const router = {
  swapAmount: "1000000",
  returnAmount: "98932",
  routes: [
    {
      swapAmount: "1000000",
      returnAmount: "98932",
      paths: [
        {
          chainId: "Oraichain",
          tokenIn: "orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh",
          tokenInAmount: "1000000",
          tokenOut: "orai",
          tokenOutAmount: "98932",
          tokenOutChainId: "Oraichain",
          actions: [
            {
              type: "Swap",
              protocol: "OraidexV3",
              tokenIn: "orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh",
              tokenInAmount: "1000000",
              tokenOut: "orai",
              tokenOutAmount: "98932",
              swapInfo: [
                {
                  poolId: "orai-orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh-3000000000-100",
                  tokenOut: "orai"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

const alphaSwapToOraichain = async () => {
  const wallet = new CosmosWalletImpl(process.env.MNEMONIC);
  const sender = await wallet.getKeplrAddr("Oraichain");
  const fromAmount = 1;
  console.log("sender: ", sender);

  const oraidexCommon = await OraidexCommon.load();
  const flattenTokens = oraidexCommon.flattenTokens;
  const originalFromToken = flattenTokens.find((t) => t.coinGeckoId === "tether" && t.chainId === "Oraichain");
  const originalToToken = flattenTokens.find((t) => t.coinGeckoId === "oraichain-token" && t.chainId === "Oraichain");

  if (!originalToToken) throw generateError("Could not find original to token");
  if (!originalFromToken) throw generateError("Could not find original from token");

  const universalHandler = new UniversalSwapHandler(
    {
      originalFromToken,
      originalToToken,
      sender: { cosmos: sender },
      fromAmount,
      userSlippage: 1,
      relayerFee: {
        relayerAmount: "100000",
        relayerDecimals: 6
      },
      // recipientAddress: "orai1hvr9d72r5um9lvt0rpkd4r75vrsqtw6yujhqs2",
      // recipientAddress: "osmo12zyu8w93h0q2lcnt50g3fn0w3yqnhy4fh4twhr",
      // recipientAddress: "inj133lq4pqjdxspcz4n388glv70z59ffeuh3ktnaj",
      simulatePrice: "98932",
      simulateAmount: router.returnAmount,
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

alphaSwapToOraichain();
