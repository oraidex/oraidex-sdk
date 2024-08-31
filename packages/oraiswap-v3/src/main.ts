import {
  AMM_V3_CONTRACT,
  ATOM_ORAICHAIN_DENOM,
  MULTICALL_CONTRACT,
  oraichainTokens,
  ORAIX_CONTRACT,
  OSMOSIS_ORAICHAIN_DENOM,
  TokenItemType,
  USDC_CONTRACT,
  USDT_CONTRACT
} from "@oraichain/oraidex-common";
import { ZapConsumer } from "./zap-consumer";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { extractAddress, parsePoolKey, poolKeyToString } from "./helpers";
import { getLiquidityByX, getMaxTick, getMinTick, isEnoughAmountToChangePrice } from "./wasm/oraiswap_v3_wasm";

async function main() {
  const poolList = [
    // `orai-${USDT_CONTRACT}-3000000000-100`,
    // `${ATOM_ORAICHAIN_DENOM}-orai-3000000000-100`,
    // `${USDT_CONTRACT}-${USDC_CONTRACT}-500000000-10`,
    // `orai-${USDC_CONTRACT}-3000000000-100`,
    // `${OSMOSIS_ORAICHAIN_DENOM}-orai-3000000000-100`,
    `orai-${ORAIX_CONTRACT}-3000000000-100`
  ];
  const tokenIn = oraichainTokens.find((t) => extractAddress(t) === USDT_CONTRACT);

  const zapper = new ZapConsumer({
    routerApi: "https://osor.oraidex.io/smart-router/alpha-router",
    client: await CosmWasmClient.connect("https://rpc.orai.io"),
    dexV3Address: AMM_V3_CONTRACT,
    multicallAddress: MULTICALL_CONTRACT,
    devitation: 0.05,
    smartRouteConfig: {
      swapOptions: {
        protocols: ["OraidexV3"]
      }
    }
  });

  const handler = zapper.handler;

  // const pool = await handler.getPool(parsePoolKey(poolList[0]));
  // console.log(pool);
  // const tickMap = await zapper.getFullTickmap(parsePoolKey(poolList[0]));
  // console.log(tickMap);

  //[221800, 2900, 700, 800, 1000, 1800, -5500, -4500, -221800]
  //[221800, 2900, 700, 800, 1000, 1800, -5500, -4500, -221800]

  // const minTick = getMinTick(poolKey.fee_tier.tick_spacing);
  // const maxTick = getMaxTick(poolKey.fee_tier.tick_spacing);
  // const tickMap = await handler.tickMap(parsePoolKey(poolList[0]), minTick, maxTick, true);
  // console.log(tickMap);
  // const tickMap2 = await zapper.getFullTickmap(parsePoolKey(poolList[0]));
  // console.log({ tickMap2 });

  // const liquidityTick = await zapper.getAllLiquidityTicks(parsePoolKey(poolList[0]), tickMap2);
  // console.log({ liquidityTick });

  for (const poolKey of poolList) {
    const poolKeyParsed = parsePoolKey(poolKey);
    const pool = await handler.getPool(poolKeyParsed);
    const currentTick = pool.pool.current_tick_index;
    const spread = pool.pool_key.fee_tier.tick_spacing * 3;

    const res = await zapper.processZapInPositionLiquidity({
      poolKey: poolKeyParsed,
      tokenIn: tokenIn as TokenItemType,
      amountIn: "10000000000",
      lowerTick: currentTick - spread,
      upperTick: currentTick + spread
    });

    const amountX = res.offerAssets.find((a) => extractAddress(a.asset) === poolKeyParsed.token_x)?.amount;
    const amountY = res.offerAssets.find((a) => extractAddress(a.asset) === poolKeyParsed.token_y)?.amount;

    /// front-end check
    const poolAfter = await handler.getPool(poolKeyParsed);
    const { amount: tokenYAmount, l: positionLiquidity } = getLiquidityByX(
      BigInt(amountX as string),
      res.addLiquidityOperations[0].lowerTick,
      res.addLiquidityOperations[0].upperTick,
      res.simulatedSqrtPrice,
      true
    );
    const accurancy = (1 - Math.abs(Number(tokenYAmount) - Number(amountY)) / Number(tokenYAmount)) * 100;
    console.log(`Accurancy: ${accurancy.toFixed(2)}%`);

    // sleep 10s
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
}

main().catch(console.error);
