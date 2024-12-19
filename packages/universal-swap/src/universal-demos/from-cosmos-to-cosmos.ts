// import "dotenv/config";
// import { CosmosWalletImpl } from "./offline-wallet";
// import { UniversalSwapHandler } from "../handler";
// import {
//   ORAI_ETH_CONTRACT,
//   cosmosTokens,
//   flattenTokens,
//   generateError,
//   toAmount,
//   USDT_CONTRACT
// } from "@oraichain/oraidex-common";

// const cosmosToCosmos = async (chainId: "osmosis-1") => {
//   const wallet = new CosmosWalletImpl(process.env.MNEMONIC);

//   const sender = await wallet.getKeplrAddr(chainId);
//   const fromAmount = 1;
//   let originalFromToken = cosmosTokens.find((t) => t.chainId === chainId && t.coinGeckoId === "osmosis");

//   let originalToToken = flattenTokens.find((t) => t.chainId === "Oraichain" && t.coinGeckoId === "osmosis");
//   if (!originalFromToken) throw generateError("Could not find original from token");
//   if (!originalToToken) throw generateError("Could not find original to token");
//   const universalHandler = new UniversalSwapHandler(
//     {
//       originalFromToken,
//       originalToToken,
//       sender: { cosmos: sender },
//       relayerFee: {
//         relayerAmount: "1000000",
//         relayerDecimals: 6
//       },
//       fromAmount,
//       simulateAmount: toAmount(fromAmount, originalToToken.decimals).toString()
//     },
//     {
//       cosmosWallet: wallet,
//       swapOptions: {
//         isIbcWasm: false,
//         isAlphaSmartRouter: false
//       }
//     }
//   );

//   try {
//     const result = await universalHandler.processUniversalSwap();
//     console.log("result: ", result);
//   } catch (error) {
//     console.log("error: ", error);
//   }
// };

// (() => {
//   return cosmosToCosmos("osmosis-1");
// })();
