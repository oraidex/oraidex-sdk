import "dotenv/config";
import { CosmosWalletImpl } from "./offline-wallet";
import { UniversalSwapHandler } from "../handler";
import { cosmosTokens, flattenTokens, generateError, getTokenOnOraichain, toAmount } from "@oraichain/oraidex-common";

const router = {
  swapAmount: "2200000",
  returnAmount: "729474558",
  routes: [
    {
      swapAmount: "2200000",
      returnAmount: "729474558",
      paths: [
        {
          chainId: "Oraichain",
          tokenIn: "orai",
          tokenInAmount: "2200000",
          tokenOut: "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c",
          tokenOutAmount: "729474558",
          tokenOutChainId: "ton",
          actions: [
            {
              type: "Swap",
              protocol: "OraidexV3",
              tokenIn: "orai",
              tokenInAmount: "2200000",
              tokenOut: "factory/orai1wuvhex9xqs3r539mvc6mtm7n20fcj3qr2m0y9khx6n5vtlngfzes3k0rq9/ton",
              tokenOutAmount: "2729474558",
              swapInfo: [
                {
                  poolId: "orai-orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh-3000000000-100",
                  tokenOut: "orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh"
                },
                {
                  poolId:
                    "orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh-orai15un8msx3n5zf9ahlxmfeqd2kwa5wm0nrpxer304m9nd5q6qq0g6sku5pdd-500000000-10",
                  tokenOut: "orai15un8msx3n5zf9ahlxmfeqd2kwa5wm0nrpxer304m9nd5q6qq0g6sku5pdd"
                },
                {
                  poolId:
                    "factory/orai1wuvhex9xqs3r539mvc6mtm7n20fcj3qr2m0y9khx6n5vtlngfzes3k0rq9/ton-orai15un8msx3n5zf9ahlxmfeqd2kwa5wm0nrpxer304m9nd5q6qq0g6sku5pdd-3000000000-100",
                  tokenOut: "factory/orai1wuvhex9xqs3r539mvc6mtm7n20fcj3qr2m0y9khx6n5vtlngfzes3k0rq9/ton"
                }
              ]
            },
            {
              type: "Bridge",
              protocol: "Bridge",
              tokenIn: "factory/orai1wuvhex9xqs3r539mvc6mtm7n20fcj3qr2m0y9khx6n5vtlngfzes3k0rq9/ton",
              tokenInAmount: "2729474558",
              tokenOut: "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c",
              tokenOutAmount: "729474558",
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

const swapOraichainToTon = async () => {
  const wallet = new CosmosWalletImpl(process.env.MNEMONIC);
  const sender = await wallet.getKeplrAddr("Oraichain");
  const fromAmount = 3;
  console.log("sender: ", sender);
  const originalFromToken = flattenTokens.find((t) => t.coinGeckoId === "the-open-network" && t.chainId === "ton");
  const originalToToken = flattenTokens.find((t) => t.coinGeckoId === "oraichain-token" && t.chainId === "Oraichain");

  if (!originalToToken) throw generateError("Could not find original to token");
  if (!originalFromToken) throw generateError("Could not find original from token");

  const universalHandler = new UniversalSwapHandler(
    {
      originalFromToken,
      originalToToken,
      sender: {
        cosmos: sender,
        // evm: "0x8c7E0A841269a01c0Ab389Ce8Fb3Cf150A94E797",
        // ton: "UQD3zsGYoDGgpambcp7SquM3wJqo6Yc-ksEtCGCDS8JwGQpp"
        ton: "UQDOAHXyCPFOXAXm9c1P_NeNEeSWy6IaRHqJRnBUp0jMZ6i3"
      },
      fromAmount,
      userSlippage: 1,
      relayerFee: {
        relayerAmount: "100000",
        relayerDecimals: 6
      },
      simulatePrice: "1240487000",
      simulateAmount: toAmount(fromAmount, originalToToken.decimals).toString(),
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

(() => {
  swapOraichainToTon();
})();
