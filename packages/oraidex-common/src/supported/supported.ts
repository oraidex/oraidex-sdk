import { SupportedChainInfo, SupportedChainInfoReader, SupportedTokens } from "./types";

export class SupportChainInfoImpl implements SupportedTokens {
  constructor(public readonly supportedChainInfo: SupportedChainInfo) {}

  static create(supportedReader: SupportedChainInfoReader) {
    const supportedChainInfo = supportedReader.readSupportedChainInfo();
    const info = new SupportChainInfoImpl(supportedChainInfo);
    return info;
  }

  getSupportedTokensByChain = (chainId: string) => {
    return this.supportedChainInfo[chainId];
  };
}
