import { SupportedChainInfoReaderFromGit } from "./supported-reader";
import { SupportedChainInfo, SupportedChainInfoReader, SupportedTokens } from "./types";

export class SupportChainInfoImpl implements SupportedTokens {
  constructor(public readonly supportedChainInfo: SupportedChainInfo) {}

  static async create(supportedReader?: SupportedChainInfoReader) {
    const supportedChainInfo = await supportedReader.readSupportedChainInfo();
    // const supportedChainInfo = await SupportedChainInfoReaderFromGit.readSupportedChainInfoStatic();
    const info = new SupportChainInfoImpl(supportedChainInfo);
    return info;
  }

  getSupportedTokensByChain = (chainId: string) => {
    return this.supportedChainInfo[chainId];
  };
}
