import { SupportedChainInfo, SupportedChainInfoReader } from "./types";
import { fetchRetry } from "../helper";

export const ORAICHAIN_COMMON_GITHUB_API_ENDPOINTS = {
  BASE_URL: "https://api.github.com",
  SUPPORTED_INFO: "/repos/oraidex/oraidex-sdk/contents/packages/oraidex-common/src/supported/config/"
};

export class SupportedChainInfoReaderFromGit implements SupportedChainInfoReader {
  private readonly dex: string;
  private readonly accessToken: string;
  constructor() {
    this.dex = "oraidex";
    this.accessToken = "";
  }

  async readSupportedChainInfo(): Promise<SupportedChainInfo> {
    const options = {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    };
    if (this.accessToken) {
      options.headers["Authorization"] = `Bearer ${this.accessToken}`;
      options.headers["X-GitHub-Api-Version"] = "2022-11-28";
    }

    const res = await (
      await fetchRetry(
        `${ORAICHAIN_COMMON_GITHUB_API_ENDPOINTS.BASE_URL}${ORAICHAIN_COMMON_GITHUB_API_ENDPOINTS.SUPPORTED_INFO}${this.dex}.json?ref=feat/token_map`,
        options
      )
    ).json();

    const supportedChainInfo: SupportedChainInfo = await (await fetchRetry(res.download_url)).json();

    return supportedChainInfo;
  }
}
