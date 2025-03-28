import { BridgeMsgInfo, MiddlewareResponse } from "../types";
import { ActionType, Path } from "../../types";
import { SwapOperation } from "@oraichain/osor-api-contracts-sdk/src/types";
import { Action, ExecuteMsg } from "@oraichain/osor-api-contracts-sdk/src/EntryPoint.types";
import { isCw20Token } from "../common";
import {
  BigDecimal,
  calculateTimeoutTimestamp,
  CONVERTER_CONTRACT,
  generateError,
  IBC_TRANSFER_TIMEOUT,
  IBC_WASM_CONTRACT,
  isCosmosChain,
  isEthAddress,
  isTonChain,
  JETTONS_ADDRESS,
  OraidexCommon
} from "@oraichain/oraidex-common";
import { toBinary } from "@cosmjs/cosmwasm-stargate";
import { Memo, Memo_PostAction, Memo_UserSwap } from "../../proto/universal_swap_memo";
import { EncodeObject } from "@cosmjs/proto-signing";
import { MsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import { TransferBackMsg } from "@oraichain/common-contracts-sdk/build/CwIcs20Latest.types";
import { toUtf8 } from "@cosmjs/encoding";
import { ChainMsg } from "./chain";

export class OraichainMsg extends ChainMsg {
  SWAP_VENUE_NAME = "oraidex";
  ENTRY_POINT_CONTRACT = "orai1yglsm0u2x3xmct9kq3lxa654cshaxj9j5d9rw5enemkkkdjgzj7sr3gwt0";
  TON_BRIDGE_ADAPTER = "orai159l8l9c5ckhqpuwdfgs9p4v599nqt3cjlfahalmtrhfuncnec2ms5mz60e";

  constructor(
    path: Path,
    minimumReceive: string,
    receiver: string,
    currentChainAddress: string,
    memo: string = "",
    oraidexCommon: OraidexCommon,

    protected destPrefix: string = undefined,
    protected obridgeAddress: string = undefined
  ) {
    super(path, minimumReceive, receiver, currentChainAddress, memo, oraidexCommon);
    // check chainId  = "Oraichain"
    if (path.chainId !== "Oraichain") {
      throw generateError("This path must be on Oraichain");
    }
  }

  /**
   * Function to calculate minimum receive for swap
   *
   * @param slippage
   */
  setMinimumReceiveForSwap(slippage: number = 0.01) {
    if (slippage <= 0 || slippage >= 1) {
      throw generateError("Slippage must be between 0 and 1");
    }
    let [_, bridgeInfo] = this.getSwapAndBridgeInfo();

    // get return amount of swap action
    let returnAmount = bridgeInfo ? bridgeInfo.amount : this.path.tokenOutAmount;
    let minimumReceive = new BigDecimal(1 - slippage).mul(returnAmount).toString();
    if (minimumReceive.includes(".")) {
      minimumReceive = minimumReceive.split(".")[0];
    }
    this.minimumReceive = minimumReceive;
  }

  /**
   * Converts the given input and output tokens to a pool ID using the converter contract in the Oraichain ecosystem.
   * @param tokenIn The input token to be converted
   * @param tokenOut The output token after conversion
   * @returns The pool ID generated based on the provided input and output tokens
   */
  parseConverterMsgToPoolId = (tokenIn: string, tokenOut: string) => {
    // In Oraichain, conversion from native token to CW20 token always occurs
    // TODO: Query the converter contract to determine the appropriate conversion method

    if (isCw20Token(tokenIn)) {
      // Convert in reverse
      return toBinary({
        contract: CONVERTER_CONTRACT,
        msg: toBinary({
          convert_reverse: {
            from: {
              native_token: {
                denom: tokenOut
              }
            }
          }
        })
      });
    } else {
      // Convert normally
      return toBinary({
        contract: CONVERTER_CONTRACT,
        msg: toBinary({
          convert: {}
        })
      });
    }
  };

  /**
   * Function to build msg swap on Oraichain
   */
  getSwapAndBridgeInfo(): [SwapOperation[], BridgeMsgInfo] {
    let swapOps: SwapOperation[] = [];
    let bridgeInfo: BridgeMsgInfo;

    // build swap operations.
    // we have 2 main cases:
    // - swap + convert
    // - bridge (IBC bridge or Ibc wasm bridge)
    for (let action of this.path.actions) {
      switch (action.type) {
        case ActionType.Swap: {
          let denomIn = action.tokenIn;
          action.swapInfo.forEach((swapInfo) => {
            swapOps.push({
              denom_in: denomIn,
              denom_out: swapInfo.tokenOut,
              pool: swapInfo.poolId
            });
            denomIn = swapInfo.tokenOut;
          });
          break;
        }
        case ActionType.Convert: {
          swapOps.push({
            denom_in: action.tokenIn,
            denom_out: action.tokenOut,
            pool: this.parseConverterMsgToPoolId(action.tokenIn, action.tokenOut)
          });
          break;
        }
        case ActionType.Bridge: {
          bridgeInfo = {
            amount: action.tokenInAmount,
            sourceChannel: action.bridgeInfo.channel,
            sourcePort: action.bridgeInfo.port,
            memo: this.memo,
            receiver: this.receiver,
            timeout: +calculateTimeoutTimestamp(IBC_TRANSFER_TIMEOUT),
            fromToken: action.tokenIn,
            toToken: action.tokenOut,
            fromChain: this.path.chainId as string,
            toChain: this.path.tokenOutChainId as string
          };
          break;
        }
        default:
          throw generateError("Only support swap + convert + bridge on Oraichain");
      }
    }

    return [swapOps, bridgeInfo];
  }

  // function to generate postAction to ibc wasm
  getProtoForPostAction(bridgeInfo?: BridgeMsgInfo): Memo_PostAction {
    // case 1: transfer to receiver
    if (!bridgeInfo) {
      return {
        transferMsg: {
          toAddress: this.receiver
        }
      };
    }

    // case 2: bridge to ton
    if (isTonChain(bridgeInfo.toChain)) {
      const jettonToToken = JETTONS_ADDRESS[bridgeInfo.toToken];
      if (!jettonToToken) throw `getProtoForPostAction: jetton address of ${bridgeInfo.toToken} not found!`;

      let msg: unknown = {
        bridge_to_ton: {
          to: bridgeInfo.receiver,
          denom: jettonToToken,
          timeout: Math.floor(new Date().getTime() / 1000) + IBC_TRANSFER_TIMEOUT,
          recovery_addr: this.currentChainAddress
        }
      };

      if (isCw20Token(bridgeInfo.fromToken)) {
        msg = {
          to: bridgeInfo.receiver,
          denom: jettonToToken,
          timeout: Math.floor(new Date().getTime() / 1000) + IBC_TRANSFER_TIMEOUT,
          recovery_addr: this.currentChainAddress
        };
      }

      return {
        contractCall: {
          contractAddress: this.TON_BRIDGE_ADAPTER,
          msg: toBinary(msg)
        }
      };
    }

    // case 3: ibc transfer
    if (bridgeInfo.sourcePort == "transfer") {
      return {
        ibcTransferMsg: {
          sourceChannel: bridgeInfo.sourceChannel,
          sourcePort: bridgeInfo.sourcePort,
          receiver: bridgeInfo.receiver,
          memo: bridgeInfo.memo,
          recoverAddress: this.currentChainAddress
        }
      };
    }

    // case 4: ibc wasm transfer
    if (bridgeInfo.sourcePort.startsWith("wasm")) {
      // handle noble & evm case
      let prefix = "";
      let isBridgeToEvm = isEthAddress(this.receiver);
      if (isBridgeToEvm) {
        if (!this.destPrefix || !this.obridgeAddress)
          throw generateError("Missing prefix or Obridge address for bridge to EVM");
        prefix = this.destPrefix;
      }

      return {
        ibcWasmTransferMsg: {
          localChannelId: bridgeInfo.sourceChannel,
          remoteAddress: isBridgeToEvm ? this.obridgeAddress : this.receiver,
          remoteDenom: prefix + bridgeInfo.toToken,
          memo: isBridgeToEvm ? prefix + this.receiver : this.memo
        }
      };
    }

    throw generateError("Missing postAction for ibc wasm memo");
  }

  /**
   * Function to generate memo msg for swap through ibc wasm after bridge
   * @returns
   */
  genMemoForIbcWasm(): MiddlewareResponse {
    let [swapOps, bridgeInfo] = this.getSwapAndBridgeInfo();
    let userSwap: Memo_UserSwap;
    if (swapOps.length) {
      userSwap = {
        swapVenueName: this.SWAP_VENUE_NAME,
        swapExactAssetIn: {
          operations: swapOps.map((operation) => ({
            poolId: operation.pool,
            denomIn: operation.denom_in,
            denomOut: operation.denom_out
          }))
        }
      };
    }
    let memo: Memo = {
      userSwap,
      minimumReceive: this.minimumReceive,
      timeoutTimestamp: +calculateTimeoutTimestamp(IBC_TRANSFER_TIMEOUT),
      postSwapAction: this.getProtoForPostAction(bridgeInfo),
      recoveryAddr: this.currentChainAddress
    };
    const encodedMemo = Memo.encode(memo).finish();
    return {
      receiver: this.currentChainAddress,
      memo: Buffer.from(encodedMemo).toString("base64")
    };
  }

  /**
   * Function to get postAction after swap
   * PostAction can be: transfer, ibc transfer, ibc wasm transfer
   * @param bridgeInfo
   * @returns Action after swap
   */
  getPostAction(bridgeInfo?: BridgeMsgInfo): Action {
    // case 1: transfer to receiver
    if (!bridgeInfo) {
      return {
        transfer: {
          to_address: this.receiver
        }
      };
    }

    // case 2: bridge to ton
    if (isTonChain(bridgeInfo.toChain)) {
      const jettonToToken = JETTONS_ADDRESS[bridgeInfo.toToken];
      if (!jettonToToken) throw `getPostAction: jetton address of ${bridgeInfo.toToken} not found!`;

      let msg: unknown = {
        bridge_to_ton: {
          to: bridgeInfo.receiver,
          denom: jettonToToken,
          timeout: Math.floor(new Date().getTime() / 1000) + IBC_TRANSFER_TIMEOUT,
          recovery_addr: this.currentChainAddress
        }
      };

      if (isCw20Token(bridgeInfo.fromToken)) {
        msg = {
          to: bridgeInfo.receiver,
          denom: jettonToToken,
          timeout: Math.floor(new Date().getTime() / 1000) + IBC_TRANSFER_TIMEOUT,
          recovery_addr: this.currentChainAddress
        };
      }
      return {
        contract_call: {
          contract_address: this.TON_BRIDGE_ADAPTER,
          msg: toBinary(msg)
        }
      };
    }

    // case 3: ibc transfer
    if (bridgeInfo.sourcePort == "transfer") {
      return {
        ibc_transfer: {
          ibc_info: {
            source_channel: bridgeInfo.sourceChannel,
            receiver: bridgeInfo.receiver,
            memo: bridgeInfo.memo,
            recover_address: this.currentChainAddress
          }
        }
      };
    }

    // case 4: ibc wasm transfer
    if (bridgeInfo.sourcePort.startsWith("wasm")) {
      // handle noble & evm case
      let prefix = "";
      let isBridgeToEvm = isEthAddress(this.receiver);
      if (isBridgeToEvm) {
        if (!this.destPrefix || !this.obridgeAddress)
          throw generateError("Missing prefix or Obridge address for bridge to EVM");
        prefix = this.destPrefix;
      }

      return {
        ibc_wasm_transfer: {
          ibc_wasm_info: {
            local_channel_id: bridgeInfo.sourceChannel,
            remote_address: isBridgeToEvm ? this.obridgeAddress : this.receiver,
            remote_denom: prefix + bridgeInfo.toToken,
            memo: isBridgeToEvm ? prefix + this.receiver : this.memo
          }
        }
      };
    }

    throw generateError("Missing postAction for postAction in Oraichain");
  }
  /**
   * Function to generate memo for action on oraichain as middleware
   */
  genMemoAsMiddleware(): MiddlewareResponse {
    let [swapOps, bridgeInfo] = this.getSwapAndBridgeInfo();

    // we have 2 cases:
    // - first case: only bridge via Oraichain ibc transfer or transfer to TON (build IBC forward middleware msg)
    // - second case: swap + action => swap through osor entry point

    if (swapOps.length == 0) {
      // we have 2 case:
      // - first case: bridge to TON (use tonBridge)
      // - ibc bridge: bridge to other cosmos chain (ibc)
      // TODO: support bridge to EVM

      // case 1: bridge to ton
      // we will use IBC hooks with ibcWasm contract
      if (isTonChain(bridgeInfo.toChain)) {
        let memo: Memo = {
          userSwap: undefined, // no swap action
          minimumReceive: this.minimumReceive,
          timeoutTimestamp: +calculateTimeoutTimestamp(IBC_TRANSFER_TIMEOUT),
          postSwapAction: this.getProtoForPostAction(bridgeInfo),
          recoveryAddr: this.currentChainAddress
        };
        return {
          receiver: IBC_WASM_CONTRACT,
          memo: JSON.stringify({
            wasm: {
              contract: IBC_WASM_CONTRACT,
              msg: {
                ibc_hooks_receive: {
                  func: "universal_swap",
                  orai_receiver: this.currentChainAddress,
                  args: Buffer.from(Memo.encode(memo).finish()).toString("base64")
                }
              }
            }
          })
        };
      }

      // case 2: ibc bridge
      // bridge only
      if (bridgeInfo.sourcePort == "transfer") {
        // ibc bridge
        return {
          receiver: this.currentChainAddress,
          memo: JSON.stringify({
            forward: {
              receiver: this.receiver,
              port: bridgeInfo.sourcePort,
              channel: bridgeInfo.sourceChannel,
              timeout: +calculateTimeoutTimestamp(IBC_TRANSFER_TIMEOUT),
              retries: 2,
              next: this.memo || undefined
            }
          })
        };
      }
      throw generateError("Error on generate memo as middleware: Only support ibc bridge & ton bridge");
    }

    let tokenOutOfSwap = swapOps[swapOps.length - 1].denom_out;
    let min_asset = isCw20Token(tokenOutOfSwap)
      ? {
          cw20: {
            amount: this.minimumReceive,
            address: tokenOutOfSwap
          }
        }
      : {
          native: {
            amount: this.minimumReceive,
            denom: tokenOutOfSwap
          }
        };

    let msg: ExecuteMsg = {
      swap_and_action: {
        user_swap: {
          swap_exact_asset_in: {
            swap_venue_name: this.SWAP_VENUE_NAME,
            operations: swapOps
          }
        },
        min_asset: min_asset,
        timeout_timestamp: +calculateTimeoutTimestamp(IBC_TRANSFER_TIMEOUT),
        post_swap_action: this.getPostAction(bridgeInfo),
        affiliates: []
      }
    };

    return {
      receiver: this.ENTRY_POINT_CONTRACT,
      memo: JSON.stringify({
        wasm: {
          contract: this.ENTRY_POINT_CONTRACT,
          msg
        }
      })
    };
  }

  private genBridgeMsg(bridgeInfo: BridgeMsgInfo): EncodeObject {
    // 3 cases:
    // ibc transfer
    // ibc wasm transfer
    // ton bridge
    // ibc transfer
    if (bridgeInfo.sourcePort == "transfer" && isCosmosChain(bridgeInfo.toChain, this.oraidexCommon.cosmosChains)) {
      return {
        typeUrl: "/ibc.applications.transfer.v1.MsgTransfer",
        value: {
          sourcePort: bridgeInfo.sourcePort,
          sourceChannel: bridgeInfo.sourceChannel,
          receiver: this.receiver,
          token: {
            amount: this.path.tokenInAmount,
            denom: this.path.tokenIn
          },
          sender: this.currentChainAddress,
          memo: this.memo,
          timeoutTimestamp: +calculateTimeoutTimestamp(IBC_TRANSFER_TIMEOUT)
        }
      };
    }

    let msg;
    let contractAddr: string;

    // ibc wasm transfer
    if (bridgeInfo.sourcePort.startsWith("wasm")) {
      let prefix = "";
      let isBridgeToEvm = isEthAddress(this.receiver);
      if (isBridgeToEvm) {
        if (!this.destPrefix || !this.obridgeAddress)
          throw generateError("Missing prefix or Obridge address for bridge to EVM");
        prefix = this.destPrefix;
      }

      const ibcWasmContractAddress = bridgeInfo.sourcePort.split(".")[1];
      if (!ibcWasmContractAddress)
        throw generateError("IBC Wasm source port is invalid. Cannot transfer to the destination chain");

      msg = {
        local_channel_id: bridgeInfo.sourceChannel,
        remote_address: isBridgeToEvm ? this.obridgeAddress : this.receiver,
        remote_denom: prefix + bridgeInfo.toToken,
        timeout: +calculateTimeoutTimestamp(IBC_TRANSFER_TIMEOUT),
        memo: isBridgeToEvm ? prefix + this.receiver : this.memo
      };
      if (!isCw20Token(bridgeInfo.fromToken)) {
        msg = {
          transfer_to_remote: msg
        };
      }
      contractAddr = ibcWasmContractAddress;
    } else if (isTonChain(bridgeInfo.toChain)) {
      contractAddr = this.TON_BRIDGE_ADAPTER;
      const jettonToToken = JETTONS_ADDRESS[bridgeInfo.toToken];
      if (!jettonToToken) throw `jetton address of ${bridgeInfo.toToken} not found!`;

      msg = {
        to: bridgeInfo.receiver,
        denom: bridgeInfo.toToken,
        timeout: Math.floor(new Date().getTime() / 1000) + IBC_TRANSFER_TIMEOUT,
        recovery_addr: this.currentChainAddress
      };

      if (!isCw20Token(bridgeInfo.fromToken)) {
        msg = {
          bridge_to_ton: {
            to: bridgeInfo.receiver,
            denom: bridgeInfo.toToken,
            timeout: Math.floor(new Date().getTime() / 1000) + IBC_TRANSFER_TIMEOUT,
            recovery_addr: this.currentChainAddress
          }
        };
      }
    }

    console.log({ msg, contractAddr });

    if (!msg || !contractAddr) {
      throw generateError("Error on generate executeMsg on Oraichain: Only support ibc, ibc wasm bridge, ton bridge");
    }

    // if asset info is native => send native way, else send cw20 way
    if (isCw20Token(bridgeInfo.fromToken)) {
      return {
        typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
        value: MsgExecuteContract.fromPartial({
          sender: this.currentChainAddress,
          contract: bridgeInfo.fromToken,
          msg: toUtf8(
            JSON.stringify({
              send: {
                contract: contractAddr,
                amount: this.path.tokenInAmount,
                msg: toBinary(msg)
              }
            })
          ),
          funds: []
        })
      };
    }

    // native token
    return {
      typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
      value: MsgExecuteContract.fromPartial({
        sender: this.currentChainAddress,
        contract: contractAddr,
        msg: toUtf8(JSON.stringify(msg)),
        funds: [
          {
            denom: this.path.tokenIn,
            amount: this.path.tokenInAmount
          }
        ]
      })
    };
  }
  /**
   * Function to generate execute msg on Oraichain
   */

  genExecuteMsg(): EncodeObject {
    let [swapOps, bridgeInfo] = this.getSwapAndBridgeInfo();
    console.log({ swapOps, bridgeInfo });

    // we have 2 cases:
    // - case 1: bridge only
    // - case 2;   swap and action

    if (swapOps.length == 0) {
      return this.genBridgeMsg(bridgeInfo);
    }

    let tokenOutOfSwap = swapOps[swapOps.length - 1].denom_out;
    let min_asset = isCw20Token(tokenOutOfSwap)
      ? {
          cw20: {
            amount: this.minimumReceive,
            address: tokenOutOfSwap
          }
        }
      : {
          native: {
            amount: this.minimumReceive,
            denom: tokenOutOfSwap
          }
        };

    // swap and action
    let msg: ExecuteMsg = {
      swap_and_action: {
        affiliates: [],
        min_asset,
        post_swap_action: this.getPostAction(bridgeInfo),
        timeout_timestamp: +calculateTimeoutTimestamp(IBC_TRANSFER_TIMEOUT),
        user_swap: {
          swap_exact_asset_in: { swap_venue_name: this.SWAP_VENUE_NAME, operations: swapOps }
        }
      }
    };

    // if asset info is native => send native way, else send cw20 way
    if (isCw20Token(this.path.tokenIn)) {
      return {
        typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
        value: MsgExecuteContract.fromPartial({
          sender: this.currentChainAddress,
          contract: this.path.tokenIn,
          msg: toUtf8(
            JSON.stringify({
              send: {
                contract: this.ENTRY_POINT_CONTRACT,
                amount: this.path.tokenInAmount,
                msg: toBinary(msg)
              }
            })
          ),
          funds: []
        })
      };
    }
    // native token

    return {
      typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
      value: MsgExecuteContract.fromPartial({
        sender: this.currentChainAddress,
        contract: this.ENTRY_POINT_CONTRACT,
        msg: toUtf8(JSON.stringify(msg)),
        funds: [
          {
            denom: this.path.tokenIn,
            amount: this.path.tokenInAmount
          }
        ]
      })
    };
  }
}
