import { SupportChainInfoImpl, SupportedChainInfoReaderFromGit } from "./supported";

(async () => {
  const readerInstance = new SupportedChainInfoReaderFromGit();
  const supportedChainIns = await SupportChainInfoImpl.create(readerInstance);
  // const supportedChainIns = await SupportChainInfoImpl.create();
  const tokenListSupports = supportedChainIns.supportedChainInfo;
})();
