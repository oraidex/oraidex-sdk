import "dotenv/config";
import { CosmosWalletImpl } from "./offline-wallet";
import { UniversalSwapHandler } from "../handler";
import { generateError, OraidexCommon } from "@oraichain/oraidex-common";

const router = {
  swapAmount: "1000000",
  returnAmount: "339961000000000000",
  routes: [
    {
      swapAmount: "1000000",
      returnAmount: "339961000000000000",
      paths: [
        {
          chainId: "Oraichain",
          tokenIn: "orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh",
          tokenInAmount: "1000000",
          tokenOut: "0x55d398326f99059fF775485246999027B3197955",
          tokenOutAmount: "339961000000000000",
          tokenOutChainId: "0x38",
          actions: [
            {
              type: "Bridge",
              protocol: "Bridge",
              tokenIn: "orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh",
              tokenInAmount: "1000000",
              tokenOut: "0x55d398326f99059fF775485246999027B3197955",
              tokenOutAmount: "339961000000000000",
              tokenOutChainId: "0x38",
              bridgeInfo: {
                port: "wasm.orai195269awwnt5m6c843q6w7hp8rt0k7syfu9de4h0wz384slshuzps8y7ccm",
                channel: "channel-29"
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
  const sender = await wallet.getKeplrAddr("Oraichain");
  const fromAmount = 1;
  console.log("sender: ", sender);

  const oraidexCommon = await OraidexCommon.load();
  const flattenTokens = oraidexCommon.flattenTokens;
  const originalFromToken = flattenTokens.find((t) => t.coinGeckoId === "tether" && t.chainId === "Oraichain");
  const originalToToken = flattenTokens.find((t) => t.coinGeckoId === "tether" && t.chainId === "0x38");

  if (!originalToToken) throw generateError("Could not find original to token");
  if (!originalFromToken) throw generateError("Could not find original from token");

  const universalHandler = new UniversalSwapHandler(
    {
      originalFromToken,
      originalToToken,
      sender: { cosmos: sender, evm: "0x8c7E0A841269a01c0Ab389Ce8Fb3Cf150A94E797" },
      fromAmount,
      userSlippage: 1,
      relayerFee: {
        relayerAmount: "100000",
        relayerDecimals: 6
      },
      // recipientAddress: "orai1hvr9d72r5um9lvt0rpkd4r75vrsqtw6yujhqs2",
      // recipientAddress: "osmo12zyu8w93h0q2lcnt50g3fn0w3yqnhy4fh4twhr",
      // recipientAddress: "inj133lq4pqjdxspcz4n388glv70z59ffeuh3ktnaj",
      simulatePrice: "1000000",
      simulateAmount: router.returnAmount,
      alphaSmartRoutes: router
    },
    {
      cosmosWallet: wallet,
      swapOptions: { isIbcWasm: false, isAlphaIbcWasm: true }
    }
  );

  try {
    const result = await universalHandler.processUniversalSwap();
    console.log("result: ", result);
  } catch (error) {
    console.trace("error: ", error);
  }
};

alphaSwapToOraichain();
