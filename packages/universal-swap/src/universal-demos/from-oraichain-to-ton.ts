// import "dotenv/config";
// import { CosmosWalletImpl } from "./offline-wallet";
// import { UniversalSwapHandler } from "../handler";
// import {
//   cosmosTokens,
//   flattenTokens,
//   generateError,
//   getTokenOnOraichain,
//   toAmount,
//   jUSDC_TON_CONTRACT
// } from "@oraichain/oraidex-common";

// const router = {
//   swapAmount: "1300000",
//   returnAmount: "81199",
//   routes: [
//     {
//       swapAmount: "1300000",
//       returnAmount: "81199",
//       paths: [
//         {
//           chainId: "Oraichain",
//           tokenIn: "orai",
//           tokenInAmount: "1300000",
//           tokenOut: "EQB-MPwrd1G6WKNkLz_VnV6WqBDd142KMQv-g1O-8QUA3728",
//           tokenOutAmount: "81199",
//           tokenOutChainId: "ton",
//           actions: [
//             {
//               type: "Swap",
//               protocol: "OraidexV3",
//               tokenIn: "orai",
//               tokenInAmount: "1300000",
//               tokenOut: "orai15un8msx3n5zf9ahlxmfeqd2kwa5wm0nrpxer304m9nd5q6qq0g6sku5pdd",
//               tokenOutAmount: "15081199",
//               swapInfo: [
//                 {
//                   poolId: "orai-orai15un8msx3n5zf9ahlxmfeqd2kwa5wm0nrpxer304m9nd5q6qq0g6sku5pdd-3000000000-100",
//                   tokenOut: "orai15un8msx3n5zf9ahlxmfeqd2kwa5wm0nrpxer304m9nd5q6qq0g6sku5pdd"
//                 }
//               ]
//             },
//             {
//               type: "Bridge",
//               protocol: "Bridge",
//               tokenIn: "orai15un8msx3n5zf9ahlxmfeqd2kwa5wm0nrpxer304m9nd5q6qq0g6sku5pdd",
//               tokenInAmount: "15081199",
//               tokenOut: "EQB-MPwrd1G6WKNkLz_VnV6WqBDd142KMQv-g1O-8QUA3728",
//               tokenOutAmount: "81199",
//               tokenOutChainId: "ton",
//               bridgeInfo: {
//                 port: "transfer",
//                 channel: "channel-1"
//               }
//             }
//           ]
//         }
//       ]
//     }
//   ]
// };

// const swapOraichainToTon = async () => {
//   const wallet = new CosmosWalletImpl(process.env.MNEMONIC);
//   const sender = await wallet.getKeplrAddr("Oraichain");
//   const fromAmount = 1.3;
//   console.log("sender: ", sender);
//   const originalFromToken = flattenTokens.find((t) => t.coinGeckoId === "oraichain-token" && t.chainId === "Oraichain");
//   const originalToToken = flattenTokens.find((t) => t.coinGeckoId === "usd-coin" && t.chainId === "ton");

//   if (!originalToToken) throw generateError("Could not find original to token");
//   if (!originalFromToken) throw generateError("Could not find original from token");

//   const universalHandler = new UniversalSwapHandler(
//     {
//       originalFromToken,
//       originalToToken,
//       sender: {
//         cosmos: sender,
//         // evm: "0x8c7E0A841269a01c0Ab389Ce8Fb3Cf150A94E797",
//         // ton: "UQD3zsGYoDGgpambcp7SquM3wJqo6Yc-ksEtCGCDS8JwGQpp"
//         ton: "UQDOAHXyCPFOXAXm9c1P_NeNEeSWy6IaRHqJRnBUp0jMZ6i3"
//       },
//       fromAmount,
//       userSlippage: 1,
//       relayerFee: {
//         relayerAmount: "100000",
//         relayerDecimals: 6
//       },
//       simulatePrice: "1100000",
//       simulateAmount: toAmount(fromAmount, originalToToken.decimals).toString(),
//       alphaSmartRoutes: router
//     },
//     {
//       cosmosWallet: wallet,
//       swapOptions: { isIbcWasm: false, isAlphaIbcWasm: true }
//     }
//   );

//   try {
//     const result = await universalHandler.processUniversalSwap();
//     console.log("result: ", result);
//   } catch (error) {
//     console.trace("error: ", error);
//   }
// };

// (async () => {
//   await swapOraichainToTon();
// })();
