import { ExecuteInstruction, SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { stringToPath } from "@cosmjs/crypto";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice, logs } from "@cosmjs/stargate";
import { deployContract } from "@oraichain/oraidex-contracts-build";
import {
  Addr,
  AssetInfo,
  Cw20Coin,
  OraiswapLimitOrderClient,
  OraiswapLimitOrderTypes,
  OraiswapTokenClient
} from "@oraichain/oraidex-contracts-sdk";
import crypto from "crypto";

export const encrypt = (password: string, val: string) => {
  const hashedPassword = crypto.createHash("sha256").update(password).digest();
  const IV = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", hashedPassword, IV);
  return Buffer.concat([IV, cipher.update(val), cipher.final()]).toString("base64");
};

export const decrypt = (password: string, val: string) => {
  const hashedPassword = crypto.createHash("sha256").update(password).digest();
  const encryptedText = Buffer.from(val, "base64");
  const IV = encryptedText.subarray(0, 16);
  const encrypted = encryptedText.subarray(16);
  const decipher = crypto.createDecipheriv("aes-256-cbc", hashedPassword, IV);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString();
};

export type UserWallet = { address: string; client: SigningCosmWasmClient };

export async function setupWallet(mnemonic: string): Promise<UserWallet> {
  const prefix = "orai";
  if (!mnemonic || mnemonic.length < 48) {
    throw new Error("Must set MNEMONIC to a 12 word phrase");
  }
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    hdPaths: [stringToPath(process.env.HD_PATH || "m/44'/118'/0'/0/0")],
    prefix
  });
  const [firstAccount] = await wallet.getAccounts();
  const address = firstAccount.address;
  const client = await SigningCosmWasmClient.connectWithSigner(process.env.RPC_URL!, wallet, {
    gasPrice: GasPrice.fromString("0.002orai")
  });

  return { address, client };
}

export const getRandomRange = (min: number, max: number): number => {
  return ((Math.random() * (max - min + 1)) << 0) + min;
};

export const getCoingeckoPrice = async (token: "oraichain-token" | "airight"): Promise<number> => {
  const res = await fetch(`https://price.market.orai.io/simple/price?ids=${token}&vs_currencies=usd`).then((res) =>
    res.json()
  );
  return res[token].usd;
};

export const getOraclePrice = async (token: string): Promise<number> => {
  const res = await fetch(`https://api.orchai.io/lending/mainnet/token/${token}`).then((res) =>
    res.json()
  );
  return res.current_price;
};

const truncDecimals = 6;
export const atomic = 10 ** truncDecimals;

export const validateNumber = (amount: number | string): number => {
  if (typeof amount === "string") return validateNumber(Number(amount));
  if (Number.isNaN(amount) || !Number.isFinite(amount)) return 0;
  return amount;
};

export const toDecimals = (num: number, decimals: number = 9): string => {
  return (num * 10 ** decimals).toFixed();
};

// decimals always >= 6
export const toAmount = (amount: number, decimals = 6): bigint => {
  const validatedAmount = validateNumber(amount);
  return BigInt(Math.trunc(validatedAmount * atomic)) * BigInt(10 ** (decimals - truncDecimals));
};

export const toDisplay = (amount: string | bigint, sourceDecimals = 6, desDecimals = 6): number => {
  if (!amount) return 0;
  if (typeof amount === "string" && amount.indexOf(".") !== -1) amount = amount.split(".")[0];
  try {
    // guarding conditions to prevent crashing
    const validatedAmount = typeof amount === "string" ? BigInt(amount || "0") : amount;
    const displayDecimals = Math.min(truncDecimals, desDecimals);
    const returnAmount = validatedAmount / BigInt(10 ** (sourceDecimals - displayDecimals));
    // save calculation by using cached atomic
    return Number(returnAmount) / (displayDecimals === truncDecimals ? atomic : 10 ** displayDecimals);
  } catch {
    return 0;
  }
};

export const getSpreadPrice = (price: number, spreadDecimal: number, desDecimals = 6) => {
  return Number((price * (1 + spreadDecimal)).toFixed(desDecimals));
};

/**
 *
 * @returns percentage between 0 and 100
 */
export const getRandomPercentage = () => {
  return Math.round(Math.random() * 99) + 1;
};

export const deployToken = async (
  client: SigningCosmWasmClient,
  senderAddress: string,
  {
    symbol,
    name,
    decimals = 6,
    initial_balances = []
  }: {
    symbol: string;
    name: string;
    decimals?: number;
    initial_balances?: Cw20Coin[];
  }
): Promise<OraiswapTokenClient> => {
  return new OraiswapTokenClient(
    client,
    senderAddress,
    (
      await deployContract(client, senderAddress, {
        decimals,
        symbol,
        name,
        mint: { minter: senderAddress },
        initial_balances: [{ address: senderAddress, amount: "100000000000" }, ...initial_balances]
      }, "oraiswap_token", "oraiswap_token")
    ).contractAddress
  );
};

export const deployOrderbook = async (
  client: SigningCosmWasmClient,
  senderAddress: string
): Promise<OraiswapLimitOrderClient> => {
  return new OraiswapLimitOrderClient(
    client,
    senderAddress,
    (
      await deployContract(client, senderAddress, {
        admin: senderAddress,
        version: "0.0.1",
        name: "Orderbook"
      }, "oraiswap_limit_order", "oraiswap_limit_order")
    ).contractAddress
  );
};

export const cancelOutofSpreadOrder = async (
  orderbookAddress: Addr,
  sender: UserWallet,
  assetInfos: AssetInfo[],
  direction: string,
  oraiPrice: number,
  spread_percentage: number,
) => {
  const upperPriceLimit = oraiPrice * (1 + spread_percentage);
  const lowerPriceLimit = oraiPrice * (1 - spread_percentage);

  let queryTicks = await sender.client.queryContractSmart(orderbookAddress, {
    ticks: {
      asset_infos: assetInfos,
      order_by: direction === "buy" ? 2 : 1,
      direction,
      limit: 100,
    }
  } as OraiswapLimitOrderTypes.QueryMsg);

  interface tick {
    price: string
    total_orders: number
  }
  
  const multipleCancelMsg: ExecuteInstruction[] = [];

  queryTicks.ticks.forEach(async (tick: tick) => {
    let tick_price = parseFloat(tick.price);
    console.log({tick_price});
    if (tick_price > upperPriceLimit || tick_price < lowerPriceLimit) {
      console.log("cancel all orders with price", tick_price);
      const ordersbyPrice = await sender.client.queryContractSmart(orderbookAddress, {
        orders: {
          asset_infos: assetInfos,
          order_by: 1,
          limit: tick.total_orders,
          filter: {
            price: tick.price
          }
        }
      } as OraiswapLimitOrderTypes.QueryMsg);

      for (const order of ordersbyPrice.orders) {
        if (order.bidder_addr === sender.address) {
          const cancelMsg: ExecuteInstruction = {
            contractAddress: orderbookAddress,
            msg: {
              cancel_order: {
                asset_infos: assetInfos,
                order_id: order.order_id
              }
            }
          };
          multipleCancelMsg.push(cancelMsg);
        }
      }
    }
    if (multipleCancelMsg.length > 0) {
      try {
        const cancelResult = await sender.client.executeMultiple(sender.address, multipleCancelMsg, "auto");
        console.log("spread cancel orders - txHash:", cancelResult.transactionHash);
      } catch (error) {
        console.log({error});          
      }
    }
  })
};

export const cancelOrder = async (
  orderbookAddress: Addr,
  sender: UserWallet,
  assetInfos: AssetInfo[],
  limit: number,
) => {
  const queryAll = await sender.client.queryContractSmart(orderbookAddress, {
    orders: {
      asset_infos: assetInfos,
      order_by: 1,
      limit,
      filter: {
        bidder: sender.address
      }
    }
  } as OraiswapLimitOrderTypes.QueryMsg);

  const multipleCancelMsg: ExecuteInstruction[] = [];
  for (const order of queryAll.orders) {
    const cancelMsg: ExecuteInstruction = {
      contractAddress: orderbookAddress,
      msg: {
        cancel_order: {
          asset_infos: assetInfos,
          order_id: order.order_id
        }
      }
    };
    multipleCancelMsg.push(cancelMsg);
  }
  if (multipleCancelMsg.length > 0) {
    const cancelResult = await sender.client.executeMultiple(sender.address, multipleCancelMsg, "auto");
    console.log("cancel orders - txHash:", cancelResult.transactionHash);
  }
};

export const cancelAllOrder = async (
  orderbookAddress: Addr,
  sender: UserWallet,
  assetInfos: AssetInfo[],
) => {
  for (let i = 0; i < 10; i++) {
    const lastOrder = await sender.client.queryContractSmart(orderbookAddress, {
      orders: {
        asset_infos: assetInfos,
        order_by: 2,
        limit: 1,
        filter: {
          bidder: sender.address
        }
      }
    } as OraiswapLimitOrderTypes.QueryMsg);
    let last_order_id = 0;
    for (const last_order of lastOrder.orders) {
      last_order_id = last_order.order_id;
    }

    if (last_order_id === 0) {
      return;
    }

    const multipleCancelMsg: ExecuteInstruction[] = [];
    const queryAll = await sender.client.queryContractSmart(orderbookAddress, {
      orders: {
        asset_infos: assetInfos,
        order_by: 1,
        limit: 100,
        filter: {
          bidder: sender.address
        }
      }
    } as OraiswapLimitOrderTypes.QueryMsg);

    for (const order of queryAll.orders) {
      const cancelMsg: ExecuteInstruction = {
        contractAddress: orderbookAddress,
        msg: {
          cancel_order: {
            asset_infos: assetInfos,
            order_id: order.order_id
          }
        }
      };
      multipleCancelMsg.push(cancelMsg);
    }
    if (multipleCancelMsg.length > 0) {
      const cancelResult = await sender.client.executeMultiple(sender.address, multipleCancelMsg, "auto");
      console.log("cancel orders - txHash:", cancelResult.transactionHash);
    }
}
};
