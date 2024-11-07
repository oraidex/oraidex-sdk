import { SupportedChainInfoReaderFromGit } from "../supported-reader";

(async () => {
  const readerInstance = new SupportedChainInfoReaderFromGit("oraidex", "");

  const tokens = await readerInstance.readSupportedChainInfo();

  console.log("tokens", tokens);
})();
