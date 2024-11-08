import tokenListJson from "./config/oraidex.json";
import { SupportedChainInfo, SupportedChainInfoReader } from "./types";

export class SupportedChainInfoReaderFromConfig implements SupportedChainInfoReader {
  constructor() {}

  readSupportedChainInfo(): SupportedChainInfo {
    const supportedChainInfo = tokenListJson;
    return supportedChainInfo;
  }
}
