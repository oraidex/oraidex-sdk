import { ChainInfos, MULTICALL_CONTRACT, OraiCommon, TokenItems } from "@oraichain/common";
import { flatten } from "lodash";
import { chainIcons, mapListWithIcon, tokensIcon } from "./config";
import {
  AMM_V3_CONTRACT,
  CONVERTER_CONTRACT,
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
import bech32 from "bech32";
import { CustomChainInfo, NetworkConfig } from "./network";
import { validateEvmAddress, validateTronAddress } from "./helper";

export class OraidexCommon {
  constructor(private readonly tokenConfig: TokenItems, private readonly chainConfig: ChainInfos) {}

  static async load(): Promise<OraidexCommon> {
    const oraiCommon = await OraiCommon.initializeFromBackend("https://oraicommon-staging.oraidex.io", "oraidex");
    return new OraidexCommon(oraiCommon.tokenItems, oraiCommon.chainInfos);
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
      coinType: this.oraichainNetwork.bip44.coinType as any,
      fee: { gasPrice: "0.00506", amount: "1518", gas: "2000000" }, // 0.000500 ORAI
      factory: FACTORY_CONTRACT,
      factory_v2: FACTORY_V2_CONTRACT,
      router: ROUTER_V2_CONTRACT,
      mixer_router: MIXED_ROUTER,
      oracle: ORACLE_CONTRACT,
      staking: STAKING_CONTRACT,
      rewarder: REWARDER_CONTRACT,
      converter: CONVERTER_CONTRACT,
      oraidex_listing: ORAIDEX_LISTING_CONTRACT,
      multicall: MULTICALL_CONTRACT,
      bid_pool: ORAIDEX_BID_POOL_CONTRACT,
      explorer: "https://scan.orai.io",
      pool_v3: AMM_V3_CONTRACT
    };
  }

  get evmChains() {
    return this.chainConfig.evmChains;
  }

  get cosmosChains() {
    return this.chainConfig.cosmosChains;
  }

  validateAndIdentifyCosmosAddress(address: string, network: string) {
    try {
      const cosmosAddressRegex = /^[a-z]{1,6}[0-9a-z]{0,64}$/;
      if (!cosmosAddressRegex.test(address)) {
        throw new Error("Invalid address");
      }

      const decodedAddress = bech32.decode(address);
      const prefix = decodedAddress.prefix;

      let chainInfo;
      const networkMap = this.cosmosChains.reduce((acc, cur) => {
        if (cur.chainId === network) chainInfo = cur;
        return {
          ...acc,
          [cur.bech32Config.bech32PrefixAccAddr]: true
        };
      }, {});

      if (chainInfo && chainInfo.bech32Config.bech32PrefixAccAddr !== prefix) {
        throw new Error("Network doesn't match");
      }

      if (networkMap.hasOwnProperty(prefix)) {
        return {
          isValid: true,
          network
        };
      } else {
        throw new Error("Unsupported address network");
      }
    } catch (error) {
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  checkValidateAddressWithNetwork(address: string, network: string) {
    switch (network) {
      case "0x01":
      case "0x38":
        return validateEvmAddress(address, network);

      // tron
      case "0x2b6653dc":
        return validateTronAddress(address, network);

      default:
        return this.validateAndIdentifyCosmosAddress(address, network);
    }
  }

  get chainInfosWithIcon() {
    return mapListWithIcon(this.chainInfos, chainIcons, "chainId");
  }
}

const main = async () => {
  const tokenService = await OraidexCommon.load();
  console.log(tokenService.oraichainNetwork);
};

main()
  .then(() => {
    console.log("Done");
  })
  .catch((error) => {
    console.error(error);
  });
