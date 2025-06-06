import { Coin, StdFee } from "@cosmjs/amino";
import { AmountDetails, CosmosWallet, EvmWallet, TokenItemType } from "@oraichain/oraidex-common";
import { SwapOperation, Uint128 } from "@oraichain/oraidex-contracts-sdk";
import { Affiliate } from "@oraichain/oraidex-contracts-sdk/build/OraiswapMixedRouter.types";
import TonWallet from "@oraichain/tonbridge-sdk/build/wallet";

export type UniversalSwapType =
  | "other-networks-to-oraichain"
  | "oraichain-to-oraichain"
  | "oraichain-to-evm"
  | "oraichain-to-cosmos"
  | "oraichain-to-ton"
  | "cosmos-to-others"
  | "ton-to-others";

export enum ActionType {
  Bridge = "Bridge",
  Swap = "Swap",
  Convert = "Convert"
}

export enum SwapDirection {
  From,
  To
}

export interface SimulateResponse {
  amount: Uint128;
  displayAmount: number;
  routes?: SmartRouterResponse;
  routeSwapOps?: SmartRouteSwapOperations[];
}

export interface SwapData {
  metamaskAddress?: string;
  tronAddress?: string;
}

export interface Sender {
  cosmos: string;
  evm?: string;
  tron?: string;
  ton?: string;
}

export interface RelayerFeeData {
  relayerAmount: string;
  relayerDecimals: number;
}

/**
 * @property recipientAddress - recipient address from client, if user want to send to another address
 * @property simulatePrice - price of the token calculated with the quote. Eg: swapping ORAI to USDT => 1 ORAI = 2 USDT, then simulate price = 2. TODO: Auto simulate price if not passed
 */
export interface UniversalSwapData {
  readonly sender: Sender;
  readonly originalFromToken: TokenItemType;
  readonly originalToToken: TokenItemType;
  readonly fromAmount: number;
  readonly simulateAmount: string; // toAmount given fromAmount. This is the minimum receive of originalToToken
  readonly userSlippage?: number;
  readonly simulatePrice?: string;
  readonly relayerFee?: RelayerFeeData;
  readonly amounts?: AmountDetails;
  readonly recipientAddress?: string; // recipient address from client, if user want to send to another address
  readonly smartRoutes?: SmartRouteSwapOperations[];
  readonly alphaSmartRoutes?: RouterResponse;
  readonly bridgeFee?: number;
  readonly affiliates?: Affiliate[];
  readonly fee?: StdFee | "auto" | number;
}

/**
 * @property cosmosWallet - wallet used for cosmos based networks.
 * @property evmWallet - wallet used for evm based networks. Note that if you want to sign Tron transactions, you need to pass in tronWeb when initializing the EvmWallet object
 * @property swapOptions - optional configuration for swap
 */
export interface UniversalSwapConfig {
  readonly cosmosWallet?: CosmosWallet;
  readonly evmWallet?: EvmWallet;
  readonly tonWallet?: TonWallet;
  readonly swapOptions?: SwapOptions;
}

export interface SwapRoute {
  swapRoute: string;
  universalSwapType: UniversalSwapType;
  isSmartRouter: boolean;
}

export interface OraiBridgeRouteData {
  oraiBridgeChannel: string;
  oraiReceiver: string;
  finalDestinationChannel: string;
  finalReceiver: string;
  tokenIdentifier: string;
}

export interface SwapOptions {
  ibcInfoTestMode?: boolean; // this argument if true allows the object to get test ibc info instead of the production one for testing purposes
  isSourceReceiverTest?: boolean;
  isAlphaSmartRouter?: boolean;
  isIbcWasm?: boolean;
  isAlphaIbcWasm?: boolean;
  skipBalanceIbcCheck?: boolean;
  skipRelayerFeeCheck?: boolean;
}

export enum Type {
  "TRANSFER" = "Transfer",
  "SWAP" = "Swap",
  "INCREASE_ALLOWANCE" = "Increase allowance",
  "BOND_STAKING_CW20" = "StakingCw20",
  "CONVERT_TOKEN" = "Convert IBC or CW20 Tokens",
  "CONVERT_TOKEN_REVERSE" = "Convert reverse IBC or CW20 Tokens"
}

export type Convert = {
  type: Type.CONVERT_TOKEN;
  sender: string;
  inputToken: TokenItemType;
  inputAmount: string;
};

export type ConvertReverse = {
  type: Type.CONVERT_TOKEN_REVERSE;
  sender: string;
  inputToken: TokenItemType;
  inputAmount: string;
  outputToken: TokenItemType;
};

export type SmartRouteSwapOperations = {
  swapAmount: string;
  returnAmount: string;
  swapOps: SwapOperation[];
};

export type SmartRouterResponse = {
  swapAmount: string;
  returnAmount: string;
  routes: Route[];
  error?: any;
};

export type ConvertType = Convert | ConvertReverse;

export interface SwapOperationSmartRoute {
  pool: string;
  denom_in: string;
  denom_out: string;
}

export interface UserSwap {
  swap_exact_asset_in?: {
    swap_venue_name: string;
    operations: SwapOperationSmartRoute[];
  };
}

export interface MinAsset {
  native?: {
    denom: string;
    amount: string;
  };
}

export interface IbcInfo {
  source_channel: string;
  receiver: string;
  memo: string;
  recover_address: string;
}

export interface PostSwapAction {
  ibc_transfer?: {
    ibc_info: IbcInfo;
  };
  transfer?: {
    to_address: string;
  };
}

export interface SwapAndAction {
  user_swap: UserSwap;
  min_asset: MinAsset;
  timeout_timestamp: number | string;
  post_swap_action: PostSwapAction;
  affiliates: any[];
}

export interface Wasm {
  contract: string;
  msg: {
    swap_and_action: SwapAndAction;
  };
}

export interface NextWasm {
  wasm: Wasm;
}

export interface Forward {
  receiver: string;
  port: string;
  channel: string;
  timeout: number;
  retries: number;
  next: NextWasm;
}

export interface RouterResponse {
  swapAmount: string;
  returnAmount: string;
  routes: Route[];
}

export interface Route {
  swapAmount: string;
  returnAmount: string;
  paths: Path[];
}

export interface Path {
  chainId: string;
  tokenIn: string;
  tokenInAmount: string;
  tokenOut: string;
  tokenOutAmount: string;
  tokenOutChainId: string;
  actions: Action[];
}

interface Action {
  type: string;
  tokenIn: string;
  tokenInAmount: string;
  tokenOut: string;
  tokenOutAmount: string;
  protocol?: string;
  swapInfo?: SwapInfo[];
  bridgeInfo?: BridgeInfo;
}

interface SwapInfo {
  poolId: string;
  tokenOut: string;
}

interface BridgeInfo {
  port: string;
  channel: string;
}
interface RouteBase {
  path: number;
  chainId: string;
  type: "Bridge" | "Swap" | string;
  tokenIn: string;
  tokenInAmount: string;
  tokenOut: string;
  tokenOutAmount: string;
  isLastPath: boolean;
}

export interface Routes extends RouteBase {
  tokenOutChainId?: string;
  bridgeInfo?: BridgeInfo;
  swapInfo?: SwapInfo[];
}

export interface RouterConfigSmartRoute {
  url: string;
  path?: string;
  protocols?: string[];
  dontAllowSwapAfter?: string[];
  maxSplits?: number;
  ignoreFee?: boolean;
}
