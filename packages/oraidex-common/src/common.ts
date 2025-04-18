import { ChainInfos, MULTICALL_CONTRACT, OraiCommon, TokenItems } from "@oraichain/common";
import { flatten } from "lodash";
import { chainIcons, mapListWithIcon, tokensIcon } from "./config";
import {
  AMM_V3_CONTRACT,
  CONVERTER_CONTRACT,
  CW20_STAKING_CONTRACT,
  FACTORY_CONTRACT,
  FACTORY_V2_CONTRACT,
  MIXED_ROUTER,
  ORACLE_CONTRACT,
  ORAIDEX_BID_POOL_CONTRACT,
  ORAIDEX_LISTING_CONTRACT,
  REWARDER_CONTRACT,
  ROUTER_V2_CONTRACT,
  solChainId,
  STAKING_CONTRACT
} from "./constant";
import { CustomChainInfo } from "./format-types";
import { ChainIdEnum } from "./interface";
import { NetworkConfig } from "./network";

export class OraidexCommon {
  static instance: OraidexCommon;

  constructor(public readonly tokenConfig: TokenItems, public readonly chainConfig: ChainInfos) {}

  static async load(): Promise<OraidexCommon> {
    if (!OraidexCommon.instance) {
      const oraiCommon = await OraiCommon.initializeFromBackend("https://oraicommon.oraidex.io", "oraidex");
      OraidexCommon.instance = new OraidexCommon(oraiCommon.tokenItems, oraiCommon.chainInfos);
    }
    return OraidexCommon.instance;
  }

  get oraichainTokens() {
    return this.tokenConfig.oraichainTokens;
  }

  get otherChainTokens() {
    return this.tokenConfig.otherChainTokens;
  }

  get oraichainEvmTokens() {
    return this.tokenConfig.oraichainTokens.filter((token: any) => token.evmExtendInfo);
  }

  get chainInfosCommon() {
    return this.chainConfig;
  }

  get tokens() {
    return this.tokenConfig.tokens;
  }

  get flattenTokens() {
    return this.tokenConfig.flattenTokens;
  }

  get tokenMap() {
    return this.tokenConfig.tokenMap;
  }

  get assetInfoMap() {
    return this.tokenConfig.assetInfoMap;
  }

  get cosmosTokens() {
    return this.tokenConfig.cosmosTokens;
  }

  get cw20Tokens() {
    return this.tokenConfig.cw20Tokens;
  }

  get cw20TokenMap() {
    return this.tokenConfig.cw20TokenMap;
  }

  get evmTokens() {
    return this.tokenConfig.evmTokens;
  }

  get kawaiiTokens() {
    return this.tokenConfig.kawaiiTokens;
  }

  get btcTokens() {
    return this.flattenTokens.filter((token) => token.chainId === ChainIdEnum.Bitcoin);
  }

  get solTokens() {
    return this.flattenTokens.filter((token) => token.chainId === solChainId);
  }

  get tonTokens() {
    return this.flattenTokens.filter((token) => token.chainId === "ton");
  }

  get oraichainTokensWithIcon() {
    return mapListWithIcon(this.oraichainTokens, tokensIcon, "coinGeckoId");
  }

  get otherTokensWithIcon() {
    return mapListWithIcon(this.otherChainTokens, tokensIcon, "coinGeckoId");
  }

  get tokensWithIcon() {
    return [this.otherTokensWithIcon, this.oraichainTokensWithIcon];
  }

  get flattenTokensWithIcon() {
    return flatten(this.tokensWithIcon);
  }

  get oraichainNetwork() {
    return this.chainConfig.getSpecificChainInfo("Oraichain");
  }

  get chainInfos() {
    return this.chainConfig.chainInfos;
  }

  get network(): CustomChainInfo & NetworkConfig {
    return {
      ...this.oraichainNetwork,

      coinType: this.oraichainNetwork.coinType,
      explorer: "https://scanium.io/Oraichain",
      fee: { gasPrice: "0.00506", amount: "1518", gas: "2000000" }, // 0.000500 ORAI
      factory: FACTORY_CONTRACT,
      factory_v2: FACTORY_V2_CONTRACT,
      oracle: ORACLE_CONTRACT,
      staking: STAKING_CONTRACT,
      router: ROUTER_V2_CONTRACT,
      mixer_router: MIXED_ROUTER,
      denom: "orai",
      prefix: this.oraichainNetwork.bech32Config.bech32PrefixAccAddr,
      rewarder: REWARDER_CONTRACT,
      converter: CONVERTER_CONTRACT,
      oraidex_listing: ORAIDEX_LISTING_CONTRACT,
      bid_pool: ORAIDEX_BID_POOL_CONTRACT,
      multicall: MULTICALL_CONTRACT,
      pool_v3: AMM_V3_CONTRACT,
      staking_oraix: CW20_STAKING_CONTRACT,
      indexer_v3: "https://ammv3-indexer.oraidex.io/"
    };
  }

  get evmChains() {
    return this.chainConfig.evmChains;
  }

  get cosmosChains() {
    return this.chainConfig.cosmosChains;
  }

  get btcChains() {
    return this.chainInfos.filter((c) => c.networkType === "bitcoin");
  }

  get chainInfosWithIcon() {
    return mapListWithIcon(this.chainInfos, chainIcons, "chainId");
  }

  get celestiaNetwork() {
    return this.chainConfig.getSpecificChainInfo("celestia");
  }

  get tonNetworkMainnet() {
    return this.chainConfig.getSpecificChainInfo("ton");
  }
}
