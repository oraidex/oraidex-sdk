import "dotenv/config";
import { CosmosWalletImpl } from "./offline-wallet";
import { UniversalSwapHandler } from "../handler";
import { cosmosTokens, flattenTokens, generateError, getTokenOnOraichain, toAmount } from "@oraichain/oraidex-common";

const router = {
  swapAmount: "1000000",
  returnAmount: "166770",
  routes: [
    {
      swapAmount: "1000000",
      returnAmount: "166770",
      paths: [
        {
          chainId: "Oraichain",
          tokenIn: "orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh",
          tokenInAmount: "1000000",
          tokenOut: "orai",
          tokenOutAmount: "166770",
          tokenOutChainId: "Oraichain",
          actions: [
            {
              type: "Swap",
              protocol: "OraidexV3",
              tokenIn: "orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh",
              tokenInAmount: "1000000",
              tokenOut: "orai15un8msx3n5zf9ahlxmfeqd2kwa5wm0nrpxer304m9nd5q6qq0g6sku5pdd",
              tokenOutAmount: "997526",
              swapInfo: [
                {
                  poolId:
                    "orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh-orai1lus0f0rhx8s03gdllx2n6vhkmf0536dv57wfge-3000000000-100",
                  tokenOut: "orai1lus0f0rhx8s03gdllx2n6vhkmf0536dv57wfge"
                },
                {
                  poolId:
                    "orai15un8msx3n5zf9ahlxmfeqd2kwa5wm0nrpxer304m9nd5q6qq0g6sku5pdd-orai1lus0f0rhx8s03gdllx2n6vhkmf0536dv57wfge-3000000000-100",
                  tokenOut: "orai15un8msx3n5zf9ahlxmfeqd2kwa5wm0nrpxer304m9nd5q6qq0g6sku5pdd"
                }
              ]
            },
            {
              type: "Swap",
              protocol: "Oraidex",
              tokenIn: "orai15un8msx3n5zf9ahlxmfeqd2kwa5wm0nrpxer304m9nd5q6qq0g6sku5pdd",
              tokenInAmount: "997526",
              tokenOut: "orai",
              tokenOutAmount: "166770",
              swapInfo: [
                {
                  poolId: "orai19ttg0j7w5kr83js32tmwnwxxdq9rkmw4m3d7mn2j2hkpugwwa4tszwsnkg",
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
  const sender = await wallet.getKeplrAddr("Oraichain-fork" as any);

  const fromAmount = 0.16677;
  console.log("sender: ", sender);
  const originalFromToken = flattenTokens.find(
    (t) => t.coinGeckoId === "tether" && t.chainId === ("Oraichain-fork" as any)
  );
  const originalToToken = flattenTokens.find(
    (t) => t.coinGeckoId === "oraichain-token" && t.chainId === ("Oraichain-fork" as any)
  );

  if (!originalToToken) throw generateError("Could not find original to token");
  if (!originalFromToken) throw generateError("Could not find original from token");

  const universalHandler = new UniversalSwapHandler(
    {
      originalFromToken,
      originalToToken,
      sender: { cosmos: sender, evm: "0x8c7E0A841269a01c0Ab389Ce8Fb3Cf150A94E797" },
      fromAmount,
      userSlippage: 99,
      // relayerFee: {
      //   relayerAmount: "100000",
      //   relayerDecimals: 6
      // },
      // recipientAddress: "celestia13lpgsy2dk9ftwac2uagw7fc2fw35cdp00xucfz",
      simulatePrice: "166770",
      simulateAmount: toAmount(fromAmount, originalToToken.decimals).toString(),
      alphaSmartRoutes: router
    },
    {
      cosmosWallet: wallet as any,
      swapOptions: { isIbcWasm: true, isAlphaIbcWasm: false }
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
  alphaSwapToOraichain();
})();
