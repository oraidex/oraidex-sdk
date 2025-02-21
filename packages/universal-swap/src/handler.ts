import { Coin, EncodeObject, coin } from "@cosmjs/proto-signing";
import { fromBech32, toBech32 } from "@cosmjs/encoding";
import { MsgTransfer } from "cosmjs-types/ibc/applications/transfer/v1/tx";
import { MsgTransfer as MsgTransferInjective } from "@injectivelabs/sdk-ts/node_modules/cosmjs-types/ibc/applications/transfer/v1/tx";
import { ExecuteInstruction, ExecuteResult, toBinary } from "@cosmjs/cosmwasm-stargate";
import { TransferBackMsg } from "@oraichain/common-contracts-sdk/build/CwIcs20Latest.types";
import {
  TokenItemType,
  IBCInfo,
  calculateTimeoutTimestamp,
  generateError,
  getEncodedExecuteContractMsgs,
  toAmount,
  parseTokenInfo,
  calculateMinReceive,
  handleSentFunds,
  tronToEthAddress,
  ORAI_BRIDGE_EVM_TRON_DENOM_PREFIX,
  oraichain2oraib,
  // findToTokenOnOraiBridge,
  getTokenOnSpecificChainId,
  UNISWAP_ROUTER_DEADLINE,
  gravityContracts,
  Bridge__factory,
  IUniswapV2Router02__factory,
  ethToTronAddress,
  // network,
  EvmResponse,
  // getTokenOnOraichain,
  getCosmosGasPrice,
  CoinGeckoId,
  IBC_WASM_CONTRACT,
  IBC_WASM_CONTRACT_TEST,
  // tokenMap,
  buildMultipleExecuteMessages,
  ibcInfosOld,
  BigDecimal,
  toDisplay,
  ChainIdEnum,
  OraidexCommon,
  checkValidateAddressWithNetwork,
  getTokenOnOraichain,
  findToTokenOnOraiBridge,
  isCosmosChain,
  TON_BRIDGE_ADAPTER_ORAICHAIN,
  TON_BRIDGE_ADAPTER
} from "@oraichain/oraidex-common";
import { ethers } from "ethers";
import { UniversalSwapHelper } from "./helper";
import {
  ConvertReverse,
  ConvertType,
  Route,
  Routes,
  SmartRouteSwapOperations,
  SwapAndAction,
  Type,
  UniversalSwapConfig,
  UniversalSwapData,
  UniversalSwapType
} from "./types";
import { GasPrice } from "@cosmjs/stargate";
import { OraiswapRouterQueryClient } from "@oraichain/oraidex-contracts-sdk";
import { Affiliate } from "@oraichain/oraidex-contracts-sdk/build/OraiswapMixedRouter.types";
import { generateMsgSwap } from "./msg/msgs";
import {
  notAllowBEP20Token,
  notAllowDenom,
  notAllowSwapCoingeckoIds,
  notAllowSwapFromChainIds,
  notAllowSwapToChainIds
} from "./swap-filter";
import { COSMOS_CHAIN_IDS, CosmosChainId, EVM_CHAIN_IDS, NetworkChainId } from "@oraichain/common/build/constants";
// import { calculateTimeoutTimestampTon, createTonBridgeHandler } from "@oraichain/tonbridge-sdk";
import { toNano } from "@ton/core";
import { getHttpEndpoint } from "@orbs-network/ton-access";

const AFFILIATE_DECIMAL = 1e4; // 10_000
export class UniversalSwapHandler {
  constructor(
    public swapData: UniversalSwapData,
    public config: UniversalSwapConfig,
    private readonly oraidexCommon: OraidexCommon,
    private readonly currentTimestamp = Date.now()
  ) {}

  private getTokenOnOraichain(coinGeckoId: CoinGeckoId, isNative?: boolean): TokenItemType {
    const fromTokenOnOrai = getTokenOnOraichain(coinGeckoId, this.oraidexCommon.oraichainTokens, isNative);
    if (!fromTokenOnOrai) throw generateError(`Could not find token ${coinGeckoId} on Oraichain. Could not swap`);
    return fromTokenOnOrai;
  }

  private getCwIcs20ContractAddr() {
    return this.config.swapOptions?.ibcInfoTestMode ? IBC_WASM_CONTRACT_TEST : IBC_WASM_CONTRACT;
  }

  public getIbcInfo(fromChainId: CosmosChainId, toChainId: string) {
    const ibcInfo = UniversalSwapHelper.getIbcInfo(fromChainId, toChainId);
    if (!this.config.swapOptions?.ibcInfoTestMode || !ibcInfo.testInfo) return ibcInfo;
    return ibcInfo.testInfo;
  }

  get swapFromTokens(): TokenItemType[] {
    return this.oraidexCommon.flattenTokens.filter((token) => {
      return (
        !notAllowDenom.includes(token?.denom) &&
        !notAllowSwapCoingeckoIds.includes(token.coinGeckoId) &&
        !notAllowSwapFromChainIds.includes(token.chainId) &&
        !notAllowBEP20Token.includes(token?.contractAddress)
      );
    });
  }

  get swapToTokens(): TokenItemType[] {
    return this.oraidexCommon.flattenTokens.filter((token) => {
      return (
        !notAllowDenom.includes(token?.denom) &&
        !notAllowSwapCoingeckoIds.includes(token.coinGeckoId) &&
        !notAllowSwapToChainIds.includes(token.chainId) &&
        !notAllowBEP20Token.includes(token?.contractAddress)
      );
    });
  }

  async getUniversalSwapToAddress(
    toChainId: NetworkChainId,
    address: { metamaskAddress?: string; tronAddress?: string; tonAddress?: string }
  ): Promise<string> {
    // evm based
    if (toChainId === "0x01" || toChainId === "0x1ae6" || toChainId === "0x38") {
      return address.metamaskAddress ?? (await this.config.evmWallet.getEthAddress());
    }

    // ton
    if (toChainId === "ton") {
      return address.tonAddress ?? (await this.config.tonWallet.sender.address.toString());
    }

    // tron
    if (toChainId === "0x2b6653dc") {
      if (address.tronAddress) return tronToEthAddress(address.tronAddress);
      const tronWeb = this.config.evmWallet.tronWeb;
      if (tronWeb && tronWeb.defaultAddress?.base58) return tronToEthAddress(tronWeb.defaultAddress.base58);
      throw generateError("Cannot find tron web to nor tron address to send to Tron network");
    }

    if (isCosmosChain(toChainId.toString(), this.oraidexCommon.cosmosChains))
      return this.config.cosmosWallet.getKeplrAddr(toChainId as CosmosChainId);
    throw generateError(`Cannot not get address for chain: ${toChainId}`);
  }

  /**
   * Combine messages for universal swap token from Oraichain to Cosmos networks.
   * @returns combined messages
   */
  async combineSwapMsgOraichain(timeoutTimestamp?: string): Promise<EncodeObject[]> {
    // if to token is on Oraichain then we wont need to transfer IBC to the other chain
    const { chainId: toChainId, coinGeckoId: toCoinGeckoId } = this.swapData.originalToToken;
    const { coinGeckoId: fromCoinGeckoId } = this.swapData.originalFromToken;
    const { affiliates } = this.swapData;
    const { cosmos: sender } = this.swapData.sender;
    if (toChainId === "Oraichain") {
      const msgSwap = this.generateMsgsSwap();
      return getEncodedExecuteContractMsgs(sender, msgSwap);
    }
    const ibcInfo: IBCInfo = this.getIbcInfo("Oraichain", toChainId);

    let ibcReceiveAddr = "";

    if (this.swapData.recipientAddress) {
      const isValidRecipient = checkValidateAddressWithNetwork(
        this.swapData.recipientAddress,
        toChainId,
        this.oraidexCommon.cosmosChains
      );

      if (!isValidRecipient.isValid) throw generateError("Recipient address invalid!");
      ibcReceiveAddr = this.swapData.recipientAddress;
    } else {
      ibcReceiveAddr = await this.config.cosmosWallet.getKeplrAddr(toChainId as CosmosChainId);
    }

    if (!ibcReceiveAddr) throw generateError("Please login cosmos wallet!");

    let toTokenInOrai = this.getTokenOnOraichain(toCoinGeckoId);
    const isSpecialChain = ["kawaii_6886-1", "injective-1"].includes(toChainId);
    const isSpecialCoingecko = ["kawaii-islands", "milky-token", "injective-protocol"].includes(toCoinGeckoId);
    if (isSpecialChain && isSpecialCoingecko) toTokenInOrai = this.getTokenOnOraichain(toCoinGeckoId, true);

    let msgTransfer: EncodeObject[];
    // if ibc info source has wasm in it, it means we need to transfer IBC using IBC wasm contract, not normal ibc transfer
    if (ibcInfo.source.includes("wasm")) {
      msgTransfer = getEncodedExecuteContractMsgs(
        sender,
        this.generateMsgsIbcWasm(ibcInfo, ibcReceiveAddr, this.swapData.originalToToken.denom, "")
      );
    } else {
      let tokenAmount = this.swapData.simulateAmount;
      if (affiliates?.length) {
        const totalBasisPoints = affiliates.reduce((acc, cur) => acc + parseFloat(cur.basis_points_fee), 0);
        const amountAffilate = totalBasisPoints / AFFILIATE_DECIMAL;
        tokenAmount = Math.trunc(
          new BigDecimal(tokenAmount).sub(parseFloat(tokenAmount) * amountAffilate).toNumber()
        ).toString();
      }

      msgTransfer = [
        {
          typeUrl: "/ibc.applications.transfer.v1.MsgTransfer",
          value: MsgTransfer.fromPartial({
            sourcePort: ibcInfo.source,
            sourceChannel: ibcInfo.channel,
            token: coin(tokenAmount, toTokenInOrai.denom),
            sender: sender,
            receiver: ibcReceiveAddr,
            memo: "",
            timeoutTimestamp: BigInt(timeoutTimestamp ?? calculateTimeoutTimestamp(ibcInfo.timeout))
          })
        }
      ];
    }
    const isNotMatchCoingeckoId = fromCoinGeckoId !== toCoinGeckoId;
    let getEncodedExecuteMsgs = [];
    if (isSpecialChain) {
      // convert token
      if (isSpecialCoingecko) {
        const evmToken = this.oraidexCommon.tokenMap[toTokenInOrai.denom];
        const evmAmount = coin(toAmount(this.swapData.fromAmount, evmToken.decimals).toString(), evmToken.denom);
        const msgConvertReverses = UniversalSwapHelper.generateConvertCw20Erc20Message(
          this.swapData.amounts,
          this.getTokenOnOraichain(toCoinGeckoId),
          sender,
          evmAmount,
          this.oraidexCommon.tokenMap,
          this.oraidexCommon.network
        );
        const executeContractMsgs = buildMultipleExecuteMessages(undefined, ...msgConvertReverses);
        getEncodedExecuteMsgs = getEncodedExecuteContractMsgs(sender, executeContractMsgs);
      }

      // 1. = coingeckoId => convert + bridge
      // 2. != coingeckoId => swap + convert + bridge
      // if not same coingeckoId, swap first then transfer token that have same coingeckoid.
      if (isNotMatchCoingeckoId) {
        const msgSwap = this.generateMsgsSwap();
        const msgExecuteSwap = getEncodedExecuteContractMsgs(sender, msgSwap);
        return [...msgExecuteSwap, ...getEncodedExecuteMsgs, ...msgTransfer];
      }
      return [...getEncodedExecuteMsgs, ...msgTransfer];
    }

    // if not same coingeckoId, swap first then transfer token that have same coingeckoid.
    if (isNotMatchCoingeckoId) {
      const msgSwap = this.generateMsgsSwap();
      const msgExecuteSwap = getEncodedExecuteContractMsgs(sender, msgSwap);
      return [...msgExecuteSwap, ...msgTransfer];
    }
    return msgTransfer;
  }

  getTranferAddress(metamaskAddress: string, tronAddress: string, channel: string) {
    let transferAddress = metamaskAddress;
    // check tron network and convert address
    if (this.swapData.originalToToken.prefix === ORAI_BRIDGE_EVM_TRON_DENOM_PREFIX) {
      transferAddress = tronToEthAddress(tronAddress);
    }
    const toTokenInOrai = this.getTokenOnOraichain(this.swapData.originalToToken.coinGeckoId);
    // only allow transferring back to ethereum / bsc only if there's metamask address and when the metamask address is used, which is in the ibcMemo variable
    if (!transferAddress && (toTokenInOrai.evmDenoms || channel === oraichain2oraib)) {
      throw generateError("Please login metamask / tronlink!");
    }
    return transferAddress;
  }

  getIbcMemo(
    metamaskAddress: string,
    tronAddress: string,
    channel: string,
    toToken: { chainId: string; prefix: string; originalChainId: string },
    recipientAddress?: string
  ) {
    let transferAddress;
    if (recipientAddress) {
      const isValidRecipient = checkValidateAddressWithNetwork(
        this.swapData.recipientAddress,
        toToken.originalChainId,
        this.oraidexCommon.cosmosChains
      );
      if (!isValidRecipient.isValid) throw generateError("Recipient address invalid!");
      transferAddress =
        toToken.originalChainId === ChainIdEnum.TRON ? tronToEthAddress(recipientAddress) : recipientAddress;
    } else {
      transferAddress = this.getTranferAddress(metamaskAddress, tronAddress, channel);
    }

    return toToken.chainId === "oraibridge-subnet-2" ? toToken.prefix + transferAddress : "";
  }

  /**
   * Combine messages for universal swap token from Oraichain to EVM networks(BSC | Ethereum | Tron).
   * @returns combined messages
   */
  async combineMsgEvm(metamaskAddress: string, tronAddress: string) {
    let msgExecuteSwap: EncodeObject[] = [];
    const { originalFromToken, originalToToken, sender, recipientAddress } = this.swapData;
    // if from and to dont't have same coingeckoId, create swap msg to combine with bridge msg
    if (originalFromToken.coinGeckoId !== originalToToken.coinGeckoId) {
      const msgSwap = this.generateMsgsSwap();
      msgExecuteSwap = getEncodedExecuteContractMsgs(sender.cosmos, msgSwap);
    }

    // then find new _toToken in Oraibridge that have same coingeckoId with originalToToken.
    const newToToken = findToTokenOnOraiBridge(
      originalToToken.coinGeckoId,
      originalToToken.chainId,
      this.oraidexCommon.cosmosTokens
    );

    const toAddress = await this.config.cosmosWallet.getKeplrAddr(newToToken.chainId as CosmosChainId);
    if (!toAddress) throw generateError("Please login cosmos wallet!");

    const ibcInfo = this.getIbcInfo(originalFromToken.chainId as CosmosChainId, newToToken.chainId);
    const ibcMemo = this.getIbcMemo(
      metamaskAddress,
      tronAddress,
      ibcInfo.channel,
      {
        chainId: newToToken.chainId,
        prefix: newToToken.prefix,
        originalChainId: originalToToken.chainId
      },
      recipientAddress
    );

    let ibcInfos = ibcInfo;
    let getEncodedExecuteMsgs = [];
    if (["kawaii-islands", "milky-token"].includes(originalToToken.coinGeckoId)) {
      const toTokenInOrai = this.getTokenOnOraichain(originalToToken.coinGeckoId, true);
      const evmToken = this.oraidexCommon.tokenMap[toTokenInOrai.denom];
      const evmAmount = coin(toAmount(this.swapData.fromAmount, evmToken.decimals).toString(), evmToken.denom);
      const msgConvertReverses = UniversalSwapHelper.generateConvertCw20Erc20Message(
        this.swapData.amounts,
        this.getTokenOnOraichain(originalToToken.coinGeckoId),
        this.swapData.sender.cosmos,
        evmAmount,
        this.oraidexCommon.tokenMap,
        this.oraidexCommon.network
      );
      // for KWT & MILKY tokens, we use the old ibc info channel
      const { chainId: fromChainId } = originalFromToken;
      const { chainId: toChainId } = newToToken;
      ibcInfos = ibcInfosOld[fromChainId][toChainId];

      const executeContractMsgs = buildMultipleExecuteMessages(undefined, ...msgConvertReverses);
      getEncodedExecuteMsgs = getEncodedExecuteContractMsgs(this.swapData.sender.cosmos, executeContractMsgs);
      const msgTransfer = {
        typeUrl: "/ibc.applications.transfer.v1.MsgTransfer",
        value: MsgTransfer.fromPartial({
          sourcePort: ibcInfos.source,
          sourceChannel: ibcInfos.channel,
          token: evmAmount,
          sender: this.swapData.sender.cosmos,
          receiver: toAddress,
          memo: ibcMemo,
          timeoutTimestamp: BigInt(calculateTimeoutTimestamp(ibcInfos.timeout, this.currentTimestamp))
        })
      };
      return [...msgExecuteSwap, ...getEncodedExecuteMsgs, msgTransfer];
    }

    // create bridge msg
    const msgTransfer = this.generateMsgsIbcWasm(ibcInfos, toAddress, newToToken.denom, ibcMemo);
    const msgExecuteTransfer = getEncodedExecuteContractMsgs(this.swapData.sender.cosmos, msgTransfer);
    return [...msgExecuteSwap, ...msgExecuteTransfer];
  }

  // TODO: write test cases
  async swap(): Promise<ExecuteResult> {
    const messages = this.generateMsgsSwap();
    const { client } = await this.config.cosmosWallet.getCosmWasmClient(
      { chainId: "Oraichain", rpc: this.oraidexCommon.network.rpc },
      { gasPrice: GasPrice.fromString(`${this.oraidexCommon.network.fee.gasPrice}${this.oraidexCommon.network.denom}`) }
    );
    const result = await client.executeMultiple(this.swapData.sender.cosmos, messages, "auto");
    return result;
  }

  // TODO: write test cases
  public async evmSwap(data: {
    fromToken: TokenItemType;
    toTokenContractAddr: string;
    fromAmount: number;
    address: {
      metamaskAddress?: string;
      tronAddress?: string;
    };
    slippage: number; // from 1 to 100
    destination: string;
    simulatePrice: string;
  }): Promise<EvmResponse> {
    const { fromToken, toTokenContractAddr, address, fromAmount, simulatePrice, slippage, destination } = data;
    const { metamaskAddress, tronAddress } = address;
    const { recipientAddress } = this.swapData;
    const signer = this.config.evmWallet.getSigner();
    const finalTransferAddress = this.config.evmWallet.getFinalEvmAddress(fromToken.chainId, {
      metamaskAddress,
      tronAddress
    });
    const finalFromAmount = toAmount(fromAmount, fromToken.decimals).toString();
    const gravityContractAddr = ethers.utils.getAddress(gravityContracts[fromToken.chainId]);
    const checkSumAddress = ethers.utils.getAddress(finalTransferAddress);

    const finalRecipientAddress = recipientAddress ? ethers.utils.getAddress(recipientAddress) : checkSumAddress;

    const gravityContract = Bridge__factory.connect(gravityContractAddr, signer);
    const routerV2Addr = await gravityContract.swapRouter();
    const minimumReceive = BigInt(calculateMinReceive(simulatePrice, finalFromAmount, slippage, fromToken.decimals));
    let result: ethers.ContractTransaction;
    let fromTokenSpender = gravityContractAddr;
    // in this case, we wont use proxy contract but uniswap router instead because our proxy does not support swap tokens to native ETH.
    // approve uniswap router first before swapping because it will use transfer from to swap fromToken
    if (!toTokenContractAddr) fromTokenSpender = routerV2Addr;
    await this.config.evmWallet.checkOrIncreaseAllowance(
      fromToken,
      checkSumAddress,
      fromTokenSpender,
      finalFromAmount // increase allowance only take display form as input
    );

    // Case 1: bridge from native bnb / eth case
    if (!fromToken.contractAddress) {
      result = await gravityContract.bridgeFromETH(
        ethers.utils.getAddress(toTokenContractAddr),
        minimumReceive, // use
        destination,
        { value: finalFromAmount }
      );
    } else if (!toTokenContractAddr) {
      // Case 2: swap to native eth / bnb. Get evm route so that we can swap from token -> native eth / bnb
      const routerV2 = IUniswapV2Router02__factory.connect(routerV2Addr, signer);
      const evmRoute = UniversalSwapHelper.getEvmSwapRoute(fromToken.chainId, fromToken.contractAddress);

      result = await routerV2.swapExactTokensForETH(
        finalFromAmount,
        minimumReceive,
        evmRoute,
        finalRecipientAddress,
        new Date().getTime() + UNISWAP_ROUTER_DEADLINE
      );
    } else if (destination === "") {
      const routerV2 = IUniswapV2Router02__factory.connect(routerV2Addr, signer);
      const evmRoute = UniversalSwapHelper.getEvmSwapRoute(
        fromToken.chainId,
        fromToken.contractAddress,
        toTokenContractAddr
      );

      result = await routerV2.swapExactTokensForTokens(
        finalFromAmount,
        minimumReceive,
        evmRoute,
        finalRecipientAddress,
        new Date().getTime() + UNISWAP_ROUTER_DEADLINE
      );
    } else {
      // Case 3: swap erc20 token to another erc20 token with a given destination (possibly sent to Oraichain or other networks)
      result = await gravityContract.bridgeFromERC20(
        ethers.utils.getAddress(fromToken.contractAddress),
        ethers.utils.getAddress(toTokenContractAddr),
        finalFromAmount,
        minimumReceive, // use
        destination
      );
    }
    await result.wait();
    return { transactionHash: result.hash };
  }

  // TODO: write test cases
  public async transferToGravity(to: string): Promise<EvmResponse> {
    const token = this.swapData.originalFromToken;
    let from = this.swapData.sender.evm;
    const amountVal = toAmount(this.swapData.fromAmount, token.decimals);
    const gravityContractAddr = gravityContracts[token.chainId] as string;
    console.log("gravity tron address: ", gravityContractAddr);
    const { evmWallet } = this.config;

    if (evmWallet.isTron(token.chainId)) {
      from = this.swapData.sender.tron;
      if (!from) throw generateError("Tron address is not specified. Cannot transfer!");
      if (evmWallet.checkTron())
        return evmWallet.submitTronSmartContract(
          ethToTronAddress(gravityContractAddr),
          "sendToCosmos(address,string,uint256)",
          {},
          [
            { type: "address", value: token.contractAddress },
            { type: "string", value: to },
            { type: "uint256", value: amountVal }
          ],
          tronToEthAddress(from) // we store the tron address in base58 form, so we need to convert to hex if its tron because the contracts are using the hex form as parameters
        );
    } else if (evmWallet.checkEthereum()) {
      // if you call this function on evm, you have to switch network before calling. Otherwise, unexpected errors may happen
      if (!gravityContractAddr || !from || !to)
        throw generateError("OraiBridge contract addr or from or to is not specified. Cannot transfer!");
      const gravityContract = Bridge__factory.connect(gravityContractAddr, evmWallet.getSigner());
      const result = await gravityContract.sendToCosmos(token.contractAddress, to, amountVal, { from });
      const res = await result.wait();
      return { transactionHash: res.transactionHash };
    }
  }

  // TODO: write test cases
  transferEvmToIBC = async (swapRoute: string): Promise<EvmResponse> => {
    const from = this.swapData.originalFromToken;
    const fromAmount = this.swapData.fromAmount;
    const finalTransferAddress = this.config.evmWallet.getFinalEvmAddress(from.chainId, {
      metamaskAddress: this.swapData.sender.evm,
      tronAddress: this.swapData.sender.tron
    });
    const gravityContractAddr = gravityContracts[from!.chainId!];
    if (!gravityContractAddr || !from) {
      throw generateError("No gravity contract addr or no from token");
    }

    const finalFromAmount = toAmount(fromAmount, from.decimals).toString();
    await this.config.evmWallet.checkOrIncreaseAllowance(
      from,
      finalTransferAddress,
      gravityContractAddr,
      finalFromAmount
    );
    return this.transferToGravity(swapRoute);
  };

  private getGasPriceFromToken() {
    if (!this.swapData.originalFromToken.feeCurrencies)
      throw generateError(
        `This token ${JSON.stringify(
          this.swapData.originalFromToken
        )} does not have fee currencies. getGasPriceFromToken is not called correctly`
      );
    if (!this.swapData.originalFromToken.feeCurrencies[0])
      throw generateError(
        `This token ${JSON.stringify(
          this.swapData.originalFromToken
        )} does not have any fee currencies. Something is wrong`
      );
    return GasPrice.fromString(
      `${getCosmosGasPrice(this.swapData.originalFromToken.gasPriceStep)}${
        this.swapData.originalFromToken.feeCurrencies[0].coinMinimalDenom
      }`
    );
  }

  // TODO: write test cases
  async swapAndTransferToOtherNetworks(universalSwapType: UniversalSwapType) {
    let encodedObjects: EncodeObject[];
    const { originalToToken, originalFromToken, simulateAmount, sender } = this.swapData;
    if (!this.config.cosmosWallet)
      throw generateError("Cannot transfer and swap if the cosmos wallet is not initialized");
    // we get cosmwasm client on Oraichain because this is checking channel balance on Oraichain
    const { client } = await this.config.cosmosWallet.getCosmWasmClient(
      { rpc: this.oraidexCommon.network.rpc, chainId: this.oraidexCommon.network.chainId as CosmosChainId },
      {
        gasPrice: this.getGasPriceFromToken()
      }
    );
    const oraiAddress = await this.config.cosmosWallet.getKeplrAddr("Oraichain");
    if (oraiAddress !== this.swapData.sender.cosmos)
      throw generateError(
        `There is a mismatch between the sender ${sender.cosmos} versus the Oraichain address ${oraiAddress}. Should not swap!`
      );

    switch (universalSwapType) {
      case "oraichain-to-cosmos":
        encodedObjects = await this.combineSwapMsgOraichain();
        break;
      case "oraichain-to-evm":
        const { evm: metamaskAddress, tron: tronAddress } = this.swapData.sender;
        if (!this.config?.swapOptions?.isCheckBalanceIbc) {
          const routerClient = new OraiswapRouterQueryClient(client, this.oraidexCommon.network.mixer_router);
          const isSufficient = await UniversalSwapHelper.checkFeeRelayer({
            originalFromToken: this.swapData.originalFromToken,
            fromAmount: this.swapData.fromAmount,
            relayerFee: this.swapData.relayerFee,
            routerClient,
            oraichainTokens: this.oraidexCommon.oraichainTokens
          });
          if (!isSufficient)
            throw generateError(
              `Your swap amount ${this.swapData.fromAmount} cannot cover the fees for this transaction. Please try again with a higher swap amount`
            );
        }

        encodedObjects = await this.combineMsgEvm(metamaskAddress, tronAddress);
        break;
      default:
        throw generateError(`Universal swap type ${universalSwapType} is wrong. Should not call this function!`);
    }

    if (!this.config?.swapOptions?.isCheckBalanceIbc) {
      const ibcInfo = this.getIbcInfo("Oraichain", originalToToken.chainId);
      await UniversalSwapHelper.checkBalanceChannelIbc(
        ibcInfo,
        originalFromToken,
        originalToToken,
        simulateAmount,
        client,
        this.getCwIcs20ContractAddr(),
        this.oraidexCommon.network,
        this.oraidexCommon.oraichainTokens
      );
    }

    // handle sign and broadcast transactions
    return client.signAndBroadcast(sender.cosmos, encodedObjects, "auto");
  }

  // TODO: write test cases
  // transfer evm to ibc
  async transferAndSwap(swapRoute: string): Promise<EvmResponse> {
    const {
      sender,
      originalFromToken,
      originalToToken,
      fromAmount,
      userSlippage,
      simulatePrice,
      relayerFee,
      simulateAmount
    } = this.swapData;
    const { evm: metamaskAddress, tron: tronAddress } = sender;
    if (!metamaskAddress && !tronAddress) throw generateError("Cannot call evm swap if the evm address is empty");
    if (!this.config.cosmosWallet) throw generateError("Cannot transfer and swap if cosmos wallet is not initialized");
    // we get cosmwasm client on Oraichain because this is checking channel balance on Oraichain
    const { client } = await this.config.cosmosWallet.getCosmWasmClient(
      { rpc: this.oraidexCommon.network.rpc, chainId: this.oraidexCommon.network.chainId as CosmosChainId },
      {}
    );

    // normal case, we will transfer evm to ibc like normal when two tokens can not be swapped on evm
    // first case: BNB (bsc) <-> USDT (bsc), then swappable
    // 2nd case: BNB (bsc) -> USDT (oraichain), then find USDT on bsc. We have that and also have route => swappable
    // 3rd case: USDT (bsc) -> ORAI (bsc / Oraichain), both have pools on Oraichain, but we currently dont have the pool route on evm => not swappable => transfer to cosmos like normal
    const swappableData = {
      fromChainId: originalFromToken.chainId,
      toChainId: originalToToken.chainId,
      fromContractAddr: originalFromToken.contractAddress,
      toContractAddr: originalToToken.contractAddress
    };
    const evmSwapData = {
      fromToken: originalFromToken,
      toTokenContractAddr: originalToToken.contractAddress,
      address: { metamaskAddress, tronAddress },
      fromAmount: fromAmount,
      slippage: userSlippage,
      destination: "", // if to token already on same net with from token then no destination is needed.
      simulatePrice: simulatePrice
    };
    // has to switch network to the correct chain id on evm since users can swap between network tokens
    if (!this.config.evmWallet.isTron(originalFromToken.chainId))
      await this.config.evmWallet.switchNetwork(originalFromToken.chainId);
    if (UniversalSwapHelper.isEvmSwappable(swappableData)) return this.evmSwap(evmSwapData);

    const toTokenSameFromChainId = getTokenOnSpecificChainId(
      originalToToken.coinGeckoId,
      originalFromToken.chainId,
      this.oraidexCommon.flattenTokens
    );
    if (toTokenSameFromChainId) {
      swappableData.toChainId = toTokenSameFromChainId.chainId;
      swappableData.toContractAddr = toTokenSameFromChainId.contractAddress;
      evmSwapData.toTokenContractAddr = toTokenSameFromChainId.contractAddress;
      // if to token already on same net with from token then no destination is needed
      evmSwapData.destination = toTokenSameFromChainId.chainId === originalToToken.chainId ? "" : swapRoute;
    }

    // special case for tokens not having a pool on Oraichain. We need to swap on evm instead then transfer to Oraichain
    if (
      UniversalSwapHelper.isEvmSwappable(swappableData) &&
      UniversalSwapHelper.isSupportedNoPoolSwapEvm(originalFromToken.coinGeckoId)
    ) {
      return this.evmSwap(evmSwapData);
    }

    if (!this.config?.swapOptions?.isCheckBalanceIbc) {
      await UniversalSwapHelper.checkBalanceIBCOraichain(
        originalToToken,
        originalFromToken,
        fromAmount,
        simulateAmount,
        client,
        this.getCwIcs20ContractAddr(),
        this.oraidexCommon.network,
        this.oraidexCommon.oraichainTokens
      );

      const routerClient = new OraiswapRouterQueryClient(client, this.oraidexCommon.network.mixer_router);
      const isSufficient = await UniversalSwapHelper.checkFeeRelayer({
        oraichainTokens: this.oraidexCommon.oraichainTokens,
        originalFromToken,
        fromAmount,
        relayerFee,
        routerClient
      });
      if (!isSufficient)
        throw generateError(
          `Your swap amount ${fromAmount} cannot cover the fees for this transaction. Please try again with a higher swap amount`
        );
    }

    return this.transferEvmToIBC(swapRoute);
  }

  // this method allows swapping from cosmos networks to arbitrary networks using ibc wasm hooks
  // Oraichain will be use as a proxy
  // TODO: write test cases
  async swapCosmosToOtherNetwork(destinationReceiver: string) {
    const {
      originalFromToken,
      originalToToken,
      sender,
      fromAmount,
      simulateAmount,
      alphaSmartRoutes,
      userSlippage,
      relayerFee
    } = this.swapData;
    // guard check to see if from token has a pool on Oraichain or not. If not then return error

    const { client } = await this.config.cosmosWallet.getCosmWasmClient(
      {
        chainId: originalFromToken.chainId as CosmosChainId,
        rpc: originalFromToken.rpc
      },
      {
        gasPrice: this.getGasPriceFromToken()
      }
    );
    const amount = toAmount(this.swapData.fromAmount, this.swapData.originalFromToken.decimals).toString();
    // we will be sending to our proxy contract
    const ibcInfo = this.getIbcInfo(originalFromToken.chainId as CosmosChainId, "Oraichain");
    if (!ibcInfo)
      throw generateError(
        `Could not find the ibc info given the from token with coingecko id ${originalFromToken.coinGeckoId}`
      );

    // get swapRoute
    const oraiAddress = await this.config.cosmosWallet.getKeplrAddr("Oraichain");

    let minimumReceive = simulateAmount;
    if (this.config.swapOptions?.isIbcWasm) minimumReceive = await this.calculateMinimumReceive();

    const { swapRoute: completeSwapRoute } = await UniversalSwapHelper.addOraiBridgeRoute(
      { sourceReceiver: oraiAddress, destReceiver: destinationReceiver },
      originalFromToken,
      originalToToken,
      minimumReceive,
      userSlippage,
      this.oraidexCommon,
      this.config.swapOptions,
      alphaSmartRoutes
    );
    const swapRouteSplit = completeSwapRoute.split(":");
    const swapRoute = swapRouteSplit.length === 1 ? "" : swapRouteSplit[1];

    const msgTransferObj = {
      sourcePort: ibcInfo.source,
      receiver: this.getCwIcs20ContractAddr(),
      sourceChannel: ibcInfo.channel,
      token: coin(amount, this.swapData.originalFromToken.denom),
      sender: this.swapData.sender.cosmos,
      memo: JSON.stringify({
        wasm: {
          contract: this.getCwIcs20ContractAddr(),
          msg: {
            ibc_hooks_receive: {
              func: "universal_swap",
              orai_receiver: oraiAddress,
              args: swapRoute
            }
          }
        }
      }),
      timeoutTimestamp: BigInt(calculateTimeoutTimestamp(ibcInfo.timeout))
    };

    let msgTransfer: MsgTransfer | MsgTransferInjective = MsgTransfer.fromPartial(msgTransferObj);
    if (originalFromToken.chainId === "injective-1") {
      msgTransfer = MsgTransferInjective.fromPartial({
        ...msgTransferObj,
        timeoutTimestamp: calculateTimeoutTimestamp(ibcInfo.timeout)
      });
    }

    // check if from chain is noble, use ibc-wasm instead of ibc-hooks
    if (originalFromToken.chainId === "noble-1") {
      if (this.swapData.recipientAddress) {
        const isValidRecipient = checkValidateAddressWithNetwork(
          this.swapData.recipientAddress,
          "Oraichain",
          this.oraidexCommon.cosmosChains
        );

        if (!isValidRecipient.isValid || isValidRecipient.network !== "Oraichain") {
          throw generateError("Recipient address invalid! Only support bridge to Oraichain");
        }
        msgTransfer.receiver = this.swapData.recipientAddress;
      } else {
        msgTransfer.receiver = oraiAddress;
      }

      msgTransfer.memo = swapRoute;
    }

    const msgTransferEncodeObj: EncodeObject = {
      typeUrl: "/ibc.applications.transfer.v1.MsgTransfer",
      value: msgTransfer
    };
    return client.signAndBroadcast(sender.cosmos, [msgTransferEncodeObj], "auto");
  }

  async alphaSmartRouterSwapNewMsg(swapRoute, universalSwapType, receiverAddresses) {
    const {
      sender,
      originalFromToken,
      originalToToken,
      simulateAmount,
      alphaSmartRoutes,
      userSlippage,
      recipientAddress,
      affiliates
    } = this.swapData;

    const universalSwapTypeFromCosmos = [
      "oraichain-to-oraichain",
      "oraichain-to-cosmos",
      "oraichain-to-evm",
      "oraichain-to-ton",
      "cosmos-to-others"
    ].includes(universalSwapType);

    if (universalSwapTypeFromCosmos) {
      if (!alphaSmartRoutes.routes?.length)
        throw generateError(`Missing router universalSwapTypeFromCosmos: ${universalSwapType}!`);

      const isCheckBalance = ["oraichain-to-evm", "oraichain-to-cosmos"].includes(universalSwapType);
      if (!this.config?.swapOptions?.isCheckBalanceIbc && isCheckBalance) {
        const { client } = await this.config.cosmosWallet.getCosmWasmClient(
          {
            chainId: originalFromToken.chainId as CosmosChainId,
            rpc: originalFromToken.rpc
          },
          {
            gasPrice: this.getGasPriceFromToken()
          }
        );
        const ibcInfo = this.getIbcInfo("Oraichain", originalToToken.chainId);
        await UniversalSwapHelper.checkBalanceChannelIbc(
          ibcInfo,
          originalFromToken,
          originalToToken,
          simulateAmount,
          client,
          this.getCwIcs20ContractAddr(),
          this.oraidexCommon.network,
          this.oraidexCommon.oraichainTokens
        );
      }

      const msgs = alphaSmartRoutes.routes.map((route) => {
        return generateMsgSwap(
          route,
          userSlippage / 100,
          receiverAddresses,
          this.oraidexCommon,
          recipientAddress,
          affiliates
        );
      });

      const { client } = await this.config.cosmosWallet.getCosmWasmClient(
        {
          chainId: originalFromToken.chainId as CosmosChainId,
          rpc: originalFromToken.rpc
        },
        {
          gasPrice: this.getGasPriceFromToken()
        }
      );
      return await client.signAndBroadcast(sender.cosmos, msgs, "auto");
    }

    if (universalSwapType === "ton-to-others") return this.transferAndSwapTon(swapRoute);
    return this.transferAndSwap(swapRoute);
  }
  async transferAndSwapTon(swapRoute: string) {
    const {
      sender,
      originalFromToken,
      originalToToken,
      fromAmount,
      userSlippage,
      simulatePrice,
      relayerFee,
      simulateAmount
    } = this.swapData;
    const { ton: tonAddress } = sender;
    if (!tonAddress) throw generateError("Cannot call ton swap if the ton address is empty");
    if (!this.config.cosmosWallet) throw generateError("Cannot transfer and swap if cosmos wallet is not initialized");
    // we get cosmwasm client on Oraichain because this is checking channel balance on Oraichain
    const { client } = await this.config.cosmosWallet.getCosmWasmClient(
      { rpc: this.oraidexCommon.network.rpc, chainId: this.oraidexCommon.network.chainId as CosmosChainId },
      {}
    );

    if (!this.config?.swapOptions?.isCheckBalanceIbc) {
      await UniversalSwapHelper.checkBalanceIBCOraichain(
        originalToToken,
        originalFromToken,
        fromAmount,
        simulateAmount,
        client,
        this.getCwIcs20ContractAddr(),
        this.oraidexCommon.network,
        this.oraidexCommon.oraichainTokens
      );

      const routerClient = new OraiswapRouterQueryClient(client, this.oraidexCommon.network.mixer_router);
      const isSufficient = await UniversalSwapHelper.checkFeeRelayer({
        oraichainTokens: this.oraidexCommon.oraichainTokens,
        originalFromToken,
        fromAmount,
        relayerFee,
        routerClient
      });
      if (!isSufficient)
        throw generateError(
          `Your swap amount ${fromAmount} cannot cover the fees for this transaction. Please try again with a higher swap amount`
        );
    }

    const { createTonBridgeHandler, calculateTimeoutTimestampTon } = await import(
      "@oraichain/tonbridge-sdk/build/utils"
    );

    const tonCenterUrl = await getHttpEndpoint({
      network: "mainnet"
    });
    const handler = await createTonBridgeHandler(
      this.config.cosmosWallet,
      this.config.tonWallet,
      {
        rpc: originalToToken.rpc,
        chainId: COSMOS_CHAIN_IDS.ORAICHAIN
      },
      {
        overrideConfig: {
          tonCenterUrl
        }
      }
    );

    const swapRouteSplit = swapRoute.split(":");
    const memo = swapRouteSplit[1] || "";

    await handler.sendToCosmos(
      handler.wasmBridge.sender,
      toNano(fromAmount),
      originalFromToken.denom,
      {
        queryId: 0,
        value: toNano(0)
      },
      calculateTimeoutTimestampTon(3600),
      memo
    );

    return {
      code: 0,
      status: true,
      sender: sender.ton,
      transactionHash: sender.ton,
      receiver: handler.wasmBridge.sender
    };
  }

  async getToAddressUniversalSwap({ evm, tron, ton }, recipientAddress, originalToToken) {
    if (this.swapData.recipientAddress) {
      const isValidRecipient = checkValidateAddressWithNetwork(
        recipientAddress,
        originalToToken.chainId,
        this.oraidexCommon.cosmosChains
      );

      if (!isValidRecipient.isValid) throw generateError("Recipient address invalid!");

      return originalToToken.chainId === ChainIdEnum.TRON
        ? tronToEthAddress(recipientAddress)
        : this.swapData.recipientAddress;
    } else {
      return await this.getUniversalSwapToAddress(originalToToken.chainId, {
        metamaskAddress: evm,
        tronAddress: tron,
        tonAddress: ton
      });
    }
  }

  async processUniversalSwap() {
    const { evm, tron, ton } = this.swapData.sender;
    const { originalFromToken, originalToToken, simulateAmount, recipientAddress, userSlippage, alphaSmartRoutes } =
      this.swapData;
    const { swapOptions } = this.config;

    const toAddress = await this.getToAddressUniversalSwap(
      { evm, tron, ton },
      this.swapData.recipientAddress,
      originalToToken
    );
    const oraiAddress = await this.config.cosmosWallet.getKeplrAddr(COSMOS_CHAIN_IDS.ORAICHAIN);
    if (!oraiAddress) throw generateError("orai address and obridge address invalid!");
    const isValidRecipientOraichain = checkValidateAddressWithNetwork(
      oraiAddress,
      COSMOS_CHAIN_IDS.ORAICHAIN,
      this.oraidexCommon.cosmosChains
    );
    if (!isValidRecipientOraichain.isValid) throw generateError("orai get address invalid!");

    let injAddress = undefined;
    let tronAddress = undefined;
    let addressParams = {
      oraiAddress,
      injAddress,
      evmInfo: {
        ton: ton,
        [EVM_CHAIN_IDS.ETH]: evm,
        [EVM_CHAIN_IDS.BSC]: evm
      } as any,
      cosmosChains: this.oraidexCommon.cosmosChains
    };

    const isAlphaIbcWasmHasRoute = swapOptions?.isAlphaIbcWasm && alphaSmartRoutes?.routes?.length;

    let minimumReceive = simulateAmount;
    if (swapOptions?.isIbcWasm) minimumReceive = await this.calculateMinimumReceive();
    if (isAlphaIbcWasmHasRoute) {
      const routesFlatten = UniversalSwapHelper.flattenSmartRouters(alphaSmartRoutes.routes);
      const [hasTron, hasInj] = [
        routesFlatten.some((route) => [route.chainId, route.tokenOutChainId].includes(EVM_CHAIN_IDS.TRON)),
        routesFlatten.some((route) => [route.chainId, route.tokenOutChainId].includes(COSMOS_CHAIN_IDS.INJECTVE))
      ];

      if (hasInj) {
        injAddress = await this.config.cosmosWallet.getKeplrAddr(COSMOS_CHAIN_IDS.INJECTVE);
        addressParams.injAddress = injAddress;
      }

      if (hasTron) {
        tronAddress = tronToEthAddress(tron);
        addressParams.evmInfo = {
          ...addressParams.evmInfo,
          [EVM_CHAIN_IDS.TRON]: tronToEthAddress(tron)
        };
      }
    }

    const { swapRoute, universalSwapType } = await UniversalSwapHelper.addOraiBridgeRoute(
      {
        injAddress,
        sourceReceiver: oraiAddress,
        destReceiver: toAddress,
        recipientAddress,
        evmAddress: evm,
        tronAddress,
        tonAddress: ton
      },
      originalFromToken,
      originalToToken,
      minimumReceive,
      userSlippage,
      this.oraidexCommon,
      this.config.swapOptions,
      alphaSmartRoutes
    );

    if (swapOptions?.isAlphaIbcWasm) {
      let receiverAddresses = UniversalSwapHelper.generateAddress(addressParams);
      return this.alphaSmartRouterSwapNewMsg(swapRoute, universalSwapType, receiverAddresses);
    }

    if (universalSwapType === "oraichain-to-oraichain") return this.swap();
    if (universalSwapType === "oraichain-to-cosmos" || universalSwapType === "oraichain-to-evm")
      return this.swapAndTransferToOtherNetworks(universalSwapType);
    if (universalSwapType === "cosmos-to-others") return this.swapCosmosToOtherNetwork(toAddress);
    return this.transferAndSwap(swapRoute);
  }

  async calculateMinimumReceive() {
    const { relayerFee, simulateAmount, originalToToken, bridgeFee = 1, userSlippage = 0 } = this.swapData;
    const { cosmosWallet } = this.config;

    const convertSimulateAmount = simulateAmount;
    let subRelayerFee = relayerFee?.relayerAmount || "0";

    if (originalToToken.coinGeckoId !== "oraichain-token") {
      const { client } = await cosmosWallet.getCosmWasmClient(
        { rpc: this.oraidexCommon.network.rpc, chainId: this.oraidexCommon.network.chainId as CosmosChainId },
        {
          gasPrice: GasPrice.fromString(`${this.oraidexCommon.network.fee.gasPrice}${this.oraidexCommon.network.denom}`)
        }
      );
      if (!!subRelayerFee) {
        const routerClient = new OraiswapRouterQueryClient(client, this.oraidexCommon.network.mixer_router);
        const { amount } = await UniversalSwapHelper.handleSimulateSwap({
          flattenTokens: this.oraidexCommon.flattenTokens,
          oraichainTokens: this.oraidexCommon.oraichainTokens,
          originalFromInfo: this.getTokenOnOraichain("oraichain-token"),
          originalToInfo: this.getTokenOnOraichain(originalToToken.coinGeckoId),
          originalAmount: toDisplay(subRelayerFee),
          routerClient: routerClient,
          routerOption: {
            useIbcWasm: true
          },
          routerConfig: {
            url: "https://osor.oraidex.io",
            path: "/smart-router/alpha-router",
            protocols: ["Oraidex", "OraidexV3"],
            dontAllowSwapAfter: ["Oraidex", "OraidexV3"]
          }
        });
        if (amount) subRelayerFee = amount;
      }
    }

    const bridgeFeeAdjustment = (bridgeFee * Number(convertSimulateAmount)) / 100;
    const slippageAdjustment = (userSlippage * Number(convertSimulateAmount)) / 100;

    const minimumReceive = new BigDecimal(convertSimulateAmount)
      .sub(bridgeFeeAdjustment)
      .sub(slippageAdjustment)
      .sub(subRelayerFee)
      .toString();

    const finalAmount = Math.max(0, Math.floor(Number(minimumReceive)));

    return Number(finalAmount).toLocaleString("fullwide", {
      useGrouping: false
    });
  }
  /**
   * Generate message swap token in Oraichain of smart route
   * @param route
   * @param isLastRoute
   * @returns
   */
  generateMsgsSmartRouterSwap(route: Routes, isLastRoute: boolean) {
    let contractAddr: string = this.oraidexCommon.network.mixer_router;
    const { originalFromToken, fromAmount, affiliates, userSlippage } = this.swapData;
    const fromTokenOnOrai = this.getTokenOnOraichain(originalFromToken.coinGeckoId);
    const _fromAmount = toAmount(fromAmount, fromTokenOnOrai.decimals).toString();
    const isValidSlippage = this.swapData.userSlippage || this.swapData.userSlippage === 0;
    if (!this.swapData.simulatePrice || !isValidSlippage) {
      throw generateError(
        "Could not calculate the minimum receive value because there is no simulate price or user slippage"
      );
    }
    const to = isLastRoute ? this.swapData.recipientAddress : undefined;
    const { info: offerInfo } = parseTokenInfo(fromTokenOnOrai, _fromAmount);
    const msgConvertsFrom = UniversalSwapHelper.generateConvertErc20Cw20Message(
      this.swapData.amounts,
      fromTokenOnOrai,
      this.oraidexCommon.tokenMap,
      this.oraidexCommon.network
    );

    const routes = UniversalSwapHelper.generateMsgsSmartRouterV2withV3(
      [route],
      offerInfo,
      this.oraidexCommon.cosmosTokens
    );
    const msgs: ExecuteInstruction[] = UniversalSwapHelper.buildSwapMsgsFromSmartRoute(
      routes,
      fromTokenOnOrai,
      to,
      contractAddr,
      userSlippage,
      affiliates
    );
    return buildMultipleExecuteMessages(msgs, ...msgConvertsFrom);
  }

  generateMsgsSwap() {
    let input: any;
    let contractAddr: string = this.oraidexCommon.network.mixer_router;
    const { originalFromToken, originalToToken, fromAmount, affiliates, userSlippage } = this.swapData;
    // since we're swapping on Oraichain, we need to get from token on Oraichain
    const fromTokenOnOrai = this.getTokenOnOraichain(originalFromToken.coinGeckoId);
    const toTokenInOrai = this.getTokenOnOraichain(originalToToken.coinGeckoId);
    try {
      const _fromAmount = toAmount(fromAmount, fromTokenOnOrai.decimals).toString();
      const msgConvertsFrom = UniversalSwapHelper.generateConvertErc20Cw20Message(
        this.swapData.amounts,
        fromTokenOnOrai,
        this.oraidexCommon.tokenMap,
        this.oraidexCommon.network
      );
      const msgConvertTo = UniversalSwapHelper.generateConvertErc20Cw20Message(
        this.swapData.amounts,
        toTokenInOrai,
        this.oraidexCommon.tokenMap,
        this.oraidexCommon.network
      );
      const isValidSlippage = userSlippage || userSlippage === 0;
      if (!this.swapData.simulatePrice || !isValidSlippage) {
        throw generateError(
          "Could not calculate the minimum receive value because there is no simulate price or user slippage"
        );
      }

      const { fund: offerSentFund, info: offerInfo } = parseTokenInfo(fromTokenOnOrai, _fromAmount);
      const { fund: askSentFund, info: askInfo } = parseTokenInfo(toTokenInOrai);
      const funds = handleSentFunds(offerSentFund, askSentFund);
      let to = undefined;
      if (this.swapData.recipientAddress && originalToToken.chainId === "Oraichain") {
        const isValidRecipient = checkValidateAddressWithNetwork(
          this.swapData.recipientAddress,
          this.swapData.originalToToken.chainId,
          this.oraidexCommon.cosmosChains
        );

        if (!isValidRecipient.isValid) {
          throw generateError("Recipient address invalid!");
        }

        to = this.swapData.recipientAddress;
      }

      let msgs: ExecuteInstruction[];

      if (this.config.swapOptions?.isIbcWasm) {
        const routes = this.swapData.alphaSmartRoutes?.routes;

        if (!routes?.length) throw "Route not found";

        const hasRouteNotIsOraichain = routes?.some((route) =>
          route.paths.some((path) => path.chainId !== "Oraichain")
        );

        if (hasRouteNotIsOraichain) throw "Only support routes in Oraichain!";

        const routesFlatten = UniversalSwapHelper.flattenSmartRouters(routes);
        const generatedRoutes = UniversalSwapHelper.generateMsgsSmartRouterV2withV3(
          routesFlatten,
          offerInfo,
          this.oraidexCommon.cosmosTokens
        );

        msgs = UniversalSwapHelper.buildSwapMsgsFromSmartRoute(
          generatedRoutes,
          fromTokenOnOrai,
          to,
          contractAddr,
          userSlippage,
          affiliates
        );
      } else {
        const minimumReceive = calculateMinReceive(
          this.swapData.simulatePrice,
          _fromAmount,
          this.swapData.userSlippage,
          fromTokenOnOrai.decimals
        );

        const inputTemp = {
          execute_swap_operations: {
            operations: UniversalSwapHelper.generateSwapOperationMsgs(offerInfo, askInfo),
            minimum_receive: minimumReceive,
            to,
            affiliates
          }
        };

        // if cw20 => has to send through cw20 contract
        if (!fromTokenOnOrai.contractAddress) {
          input = inputTemp;
        } else {
          input = {
            send: {
              contract: contractAddr,
              amount: _fromAmount,
              msg: toBinary(inputTemp)
            }
          };
          contractAddr = fromTokenOnOrai.contractAddress;
        }
        const msg: ExecuteInstruction = {
          contractAddress: contractAddr,
          msg: input,
          funds
        };

        msgs = [msg];
      }
      return buildMultipleExecuteMessages(msgs, ...msgConvertsFrom, ...msgConvertTo);
    } catch (error) {
      throw generateError(`Error generateMsgsSwap: ${JSON.stringify(error.message)}`);
    }
  }

  /**
   * Generate message and binary msg of smart route
   * @param routes
   * @param fromTokenOnOrai
   * @param to
   * @param routerContract
   * @param affiliates
   * @returns
   */
  buildSwapMsgsFromSmartRoute(
    routes: SmartRouteSwapOperations[],
    fromTokenOnOrai: TokenItemType,
    to: string,
    routerContract: string,
    affiliates?: Affiliate[]
  ): ExecuteInstruction[] {
    const msgs: ExecuteInstruction[] = routes.map((route) => {
      const minimumReceive = Math.trunc(
        new BigDecimal(route.returnAmount).mul((100 - this.swapData.userSlippage) / 100).toNumber()
      ).toString();

      const swapOps = {
        execute_swap_operations: {
          operations: route.swapOps,
          minimum_receive: minimumReceive,
          to,
          affiliates
        }
      };

      // if cw20 => has to send through cw20 contract
      if (!fromTokenOnOrai.contractAddress) {
        return {
          contractAddress: routerContract,
          msg: swapOps,
          funds: handleSentFunds(parseTokenInfo(fromTokenOnOrai, route.swapAmount).fund)
        };
      } else {
        return {
          contractAddress: fromTokenOnOrai.contractAddress,
          msg: {
            send: {
              contract: routerContract,
              amount: route.swapAmount,
              msg: toBinary(swapOps)
            }
          },
          funds: []
        };
      }
    });

    return msgs;
  }

  /**
   * Generate message to transfer token from Oraichain to EVM / Cosmos networks using IBC Wasm contract.
   * Example: AIRI/Oraichain -> AIRI/BSC
   * @param ibcInfo
   * @param ibcReceiveAddr
   * @param ibcMemo
   * @returns
   */
  generateMsgsIbcWasm(ibcInfo: IBCInfo, ibcReceiveAddr: string, remoteDenom: string, ibcMemo: string) {
    const toTokenInOrai = this.getTokenOnOraichain(this.swapData.originalToToken.coinGeckoId);
    try {
      const { info: assetInfo } = parseTokenInfo(toTokenInOrai);

      const ibcWasmContractAddress = ibcInfo.source.split(".")[1];
      if (!ibcWasmContractAddress)
        throw generateError("IBC Wasm source port is invalid. Cannot transfer to the destination chain");

      const msg: TransferBackMsg = {
        local_channel_id: ibcInfo.channel,
        remote_address: ibcReceiveAddr,
        remote_denom: remoteDenom,
        timeout: +calculateTimeoutTimestamp(ibcInfo.timeout, this.currentTimestamp), // FIXME: should we use nano with an u64 type? -> probably quite big for a u64
        memo: ibcMemo
      };

      // if asset info is native => send native way, else send cw20 way
      if ("native_token" in assetInfo) {
        const executeMsgSend = {
          transfer_to_remote: msg
        };

        const msgs: ExecuteInstruction = {
          contractAddress: ibcWasmContractAddress,
          msg: executeMsgSend,
          funds: [
            {
              amount: this.swapData.simulateAmount,
              denom: assetInfo.native_token.denom
            }
          ]
        };
        return [msgs];
      }

      const executeMsgSend = {
        send: {
          contract: ibcWasmContractAddress,
          amount: this.swapData.simulateAmount,
          msg: toBinary(msg)
        }
      };

      // generate contract message for CW20 token in Oraichain.
      // Example: tranfer USDT/Oraichain -> AIRI/BSC. _toTokenInOrai is AIRI in Oraichain.
      const instruction: ExecuteInstruction = {
        contractAddress: toTokenInOrai.contractAddress,
        msg: executeMsgSend,
        funds: []
      };
      return [instruction];
    } catch (error) {
      console.log({ error });
    }
  }
}
