import "dotenv/config";
import { CosmosWalletImpl } from "./offline-wallet";
import { UniversalSwapHandler } from "../handler";
import { generateError, OraidexCommon, toAmount, TokenItemType } from "@oraichain/oraidex-common";

const oraichainToEvm = async () => {
  const chainId = "Oraichain";
  const wallet = new CosmosWalletImpl(process.env.MNEMONIC);

  const sender = await wallet.getKeplrAddr(chainId);
  const fromAmount = 10000;

  const oraidexCommon = await OraidexCommon.load();
  const flattenTokens = oraidexCommon.flattenTokens;
  let originalToToken = flattenTokens.find((t) => t.chainId === chainId && t.coinGeckoId === "tether");

  let originalFromToken = flattenTokens.find((t) => t.chainId === "0x38" && t.coinGeckoId === "tether");

  if (!originalFromToken) throw generateError("Could not find original from token");
  if (!originalToToken) throw generateError("Could not find original to token");

  // const smartRoutes = await UniversalSwapHelper.simulateSwapUsingSmartRoute({
  //   fromInfo: originalFromToken,
  //   toInfo: originalToToken,
  //   amount: toAmount(fromAmount, originalToToken.decimals).toString()
  // });

  // console.log("expected amount: ", smartRoutes.returnAmount);
  const universalHandler = new UniversalSwapHandler(
    {
      originalFromToken,
      originalToToken,
      sender: { cosmos: sender, evm: "0x8c7E0A841269a01c0Ab389Ce8Fb3Cf150A94E797" },
      // relayerFee: {
      //   relayerAmount: "100000",
      //   relayerDecimals: 6
      // },
      simulatePrice: toAmount(1, originalFromToken.decimals).toString(),
      fromAmount,
      simulateAmount: toAmount(fromAmount, originalFromToken.decimals).toString(),
      userSlippage: 1
    },
    {
      cosmosWallet: wallet,
      swapOptions: {
        isAlphaSmartRouter: true,
        isIbcWasm: true
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

oraichainToEvm();
