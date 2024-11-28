import { ChainInfos, OraiCommon, TokenItems } from "@oraichain/common";
import { flatten } from "lodash";
import { mapListWithIcon, tokensIcon } from "./config";

export class TokenService {
  constructor(private readonly tokenConfig: TokenItems, private readonly chainConfig: ChainInfos) {}

  static async load(): Promise<TokenService> {
    const oraiCommon = await OraiCommon.initializeFromBackend("https://oraicommon-staging.oraidex.io", "oraidex");
    return new TokenService(oraiCommon.tokenItems, oraiCommon.chainInfos);
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
}

// const main = async () => {
//   const tokenService = await TokenService.load();
// };

// main()
//   .then(() => {
//     console.log("Done");
//   })
//   .catch((error) => {
//     console.error(error);
//   });
