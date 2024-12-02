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
  STAKING_CONTRACT
} from "./constant";
import { CustomChainInfo, NetworkConfig } from "./network";

export class OraidexCommon {
  static instance: OraidexCommon;

  constructor(public readonly tokenConfig: TokenItems, public readonly chainConfig: ChainInfos) {}

  static async load(): Promise<OraidexCommon> {
    if (!OraidexCommon.instance) {
      const oraiCommon = await OraiCommon.initializeFromBackend("https://oraicommon-staging.oraidex.io", "oraidex");
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
    // TODO: update later
    //   bech32Config: defaultBech32Config("orai"),
    // currencies: oraiCommon.chainInfos.getSpecificChainInfo("Oraichain").currencies.map((currency) => {
    //   const coingeckoId =
    //     mapDenomWithCoinGeckoId[currency.coinMinimalDenom] || mapDenomWithCoinGeckoId[currency.contractAddress];
    //   if (coingeckoId) {
    //     return {
    //       ...currency,
    //       coinGeckoId: coingeckoId,
    //       bridgeTo: !supportedBridge.Oraichain?.[coingeckoId]?.length
    //         ? undefined
    //         : supportedBridge.Oraichain?.[coingeckoId]
    //     };
    //   }
    //   return currency;
    // })
  }

  get chainInfos() {
    return this.chainConfig.chainInfos;
    // TODO: update later
    //   .filter((chain) => supportedChainIds.includes(chain.chainId))
    // .map((c) => {
    //   const updatedCurrencies = c.currencies.map((currency) => {
    //     const coingeckoId =
    //       mapDenomWithCoinGeckoId[currency.coinMinimalDenom] || mapDenomWithCoinGeckoId[currency.contractAddress];
    //     if (coingeckoId) {
    //       return {
    //         ...currency,
    //         coinGeckoId: coingeckoId,
    //         bridgeTo: !supportedBridge[c.chainId]?.[coingeckoId]?.length
    //           ? undefined
    //           : supportedBridge[c.chainId]?.[coingeckoId]
    //       };
    //     }
    //     return currency;
    //   });

    //   return {
    //     ...c,
    //     currencies: updatedCurrencies,
    //     Icon: c.chainLogoSvg || c.chainLogoPng,
    //     IconLight: c.chainLogoSvg || c.chainLogoPng
    // };
  }

  get network(): CustomChainInfo & NetworkConfig {
    return {
      ...this.oraichainNetwork,
      prefix: this.oraichainNetwork.bech32Config.bech32PrefixAccAddr,
      denom: "orai",
      coinType: this.oraichainNetwork.bip44.coinType,
      fee: { gasPrice: "0.00506", amount: "1518", gas: "2000000" }, // 0.000500 ORAI
      factory: FACTORY_CONTRACT,
      factory_v2: FACTORY_V2_CONTRACT,
      router: ROUTER_V2_CONTRACT,
      oracle: ORACLE_CONTRACT,
      staking: STAKING_CONTRACT,
      rewarder: REWARDER_CONTRACT,
      converter: CONVERTER_CONTRACT,
      oraidex_listing: ORAIDEX_LISTING_CONTRACT,
      bid_pool: ORAIDEX_BID_POOL_CONTRACT,
      staking_oraix: CW20_STAKING_CONTRACT,
      multicall: MULTICALL_CONTRACT,
      explorer: "https://scan.orai.io",
      pool_v3: AMM_V3_CONTRACT,
      indexer_v3: "https://ammv3-indexer.oraidex.io/"
    };
  }

  get evmChains() {
    return this.chainConfig.evmChains;
  }

  get cosmosChains() {
    return this.chainConfig.cosmosChains;
  }

  get chainInfosWithIcon() {
    return mapListWithIcon(this.chainInfos, chainIcons, "chainId");
  }

  get celestiaNetwork() {
    return this.chainConfig.getSpecificChainInfo("celestia");
  }
}
