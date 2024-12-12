// import "dotenv/config";
// import { CosmosWalletImpl } from "./offline-wallet";
// import { UniversalSwapHandler } from "../handler";
// import { cosmosTokens, flattenTokens, generateError, getTokenOnOraichain, toAmount } from "@oraichain/oraidex-common";
// import TonWallet from "@oraichain/tonbridge-sdk/build/wallet";

// const router = {
//   swapAmount: "3000000000",
//   returnAmount: "1000000000",
//   routes: [
//     {
//       swapAmount: "3000000000",
//       returnAmount: "1000000000",
//       paths: [
//         {
//           chainId: "ton",
//           tokenIn: "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c",
//           tokenInAmount: "3000000000",
//           tokenOut: "factory/orai1wuvhex9xqs3r539mvc6mtm7n20fcj3qr2m0y9khx6n5vtlngfzes3k0rq9/ton",
//           tokenOutAmount: "1000000000",
//           tokenOutChainId: "Oraichain",
//           actions: [
//             {
//               type: "Bridge",
//               protocol: "Bridge",
//               tokenIn: "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c",
//               tokenInAmount: "3000000000",
//               tokenOut: "factory/orai1wuvhex9xqs3r539mvc6mtm7n20fcj3qr2m0y9khx6n5vtlngfzes3k0rq9/ton",
//               tokenOutAmount: "1000000000",
//               tokenOutChainId: "Oraichain",
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

// const swapTonToOraichain = async () => {
//   const wallet = new CosmosWalletImpl(process.env.MNEMONIC);

//   const tonWallet = await TonWallet.create("mainnet", {
//     mnemonicData: {
//       mnemonic: process.env.TON_MNEMONIC.split(" "),
//       tonWalletVersion: "V4"
//     }
//   });

//   const sender = await wallet.getKeplrAddr("Oraichain");
//   const tonAddr = await tonWallet.sender.address.toString();
//   const fromAmount = 3;
//   console.log("sender: ", sender);
//   console.log("tonAddr: ", tonAddr);
//   const originalFromToken = flattenTokens.find((t) => t.coinGeckoId === "the-open-network" && t.chainId === "ton");
//   const originalToToken = flattenTokens.find((t) => t.coinGeckoId === "the-open-network" && t.chainId === "Oraichain");
//   if (!originalToToken) throw generateError("Could not find original to token");
//   if (!originalFromToken) throw generateError("Could not find original from token");

//   const universalHandler = new UniversalSwapHandler(
//     {
//       originalFromToken,
//       originalToToken,
//       sender: {
//         cosmos: sender,
//         evm: "0x8c7E0A841269a01c0Ab389Ce8Fb3Cf150A94E797",
//         // ton: "UQD3zsGYoDGgpambcp7SquM3wJqo6Yc-ksEtCGCDS8JwGQpp"
//         ton: "EQDOAHXyCPFOXAXm9c1P_NeNEeSWy6IaRHqJRnBUp0jMZ_Vy"
//       },
//       fromAmount,
//       userSlippage: 1,
//       relayerFee: {
//         relayerAmount: "100000",
//         relayerDecimals: 6
//       },
//       simulatePrice: "1000000000",
//       simulateAmount: toAmount(fromAmount, originalToToken.decimals).toString(),
//       alphaSmartRoutes: router
//     },
//     {
//       cosmosWallet: wallet,
//       tonWallet,
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

// (() => {
//   swapTonToOraichain();
// })();
