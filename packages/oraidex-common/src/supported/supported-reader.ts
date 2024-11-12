import { SupportedChainInfo, SupportedChainInfoReader } from "./types";
import { fetchRetry } from "../helper";

export const ORAICHAIN_COMMON_GITHUB_API_ENDPOINTS = {
  BASE_URL: "https://api.github.com",
  SUPPORTED_INFO: "/repos/oraidex/oraidex-sdk/contents/packages/oraidex-common/src/supported/config/"
};

export class SupportedChainInfoReaderFromGit implements SupportedChainInfoReader {
  constructor(private readonly dex: string = "oraidex", private readonly accessToken: string = "") {}

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
        `${ORAICHAIN_COMMON_GITHUB_API_ENDPOINTS.BASE_URL}${ORAICHAIN_COMMON_GITHUB_API_ENDPOINTS.SUPPORTED_INFO}${this.dex}.json?ref=feat/feat/intergrate_common`,
        options
      )
    ).json();

    console.log(
      "url",
      `${ORAICHAIN_COMMON_GITHUB_API_ENDPOINTS.BASE_URL}${ORAICHAIN_COMMON_GITHUB_API_ENDPOINTS.SUPPORTED_INFO}${this.dex}.json?ref=feat/feat/intergrate_common`
    );

    const supportedChainInfo: SupportedChainInfo = await (await fetchRetry(res.download_url)).json();

    return supportedChainInfo;
  }

  static async readSupportedChainInfoStatic(): Promise<SupportedChainInfo> {
    const options = {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    };

    const res = await (
      await fetchRetry(
        `${ORAICHAIN_COMMON_GITHUB_API_ENDPOINTS.BASE_URL}${ORAICHAIN_COMMON_GITHUB_API_ENDPOINTS.SUPPORTED_INFO}oraidex.json?ref=feat/feat/intergrate_common`,
        options
      )
    ).json();

    console.log(
      "url",
      `${ORAICHAIN_COMMON_GITHUB_API_ENDPOINTS.BASE_URL}${ORAICHAIN_COMMON_GITHUB_API_ENDPOINTS.SUPPORTED_INFO}oraidex.json?ref=feat/feat/intergrate_common`
    );

    const supportedChainInfo: SupportedChainInfo = await (await fetchRetry(res.download_url)).json();

    return supportedChainInfo;
  }
}
