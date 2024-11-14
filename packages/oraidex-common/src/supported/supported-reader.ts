import { fetchRetry } from "../helper";
import { SupportedChainInfo, SupportedChainInfoReader } from "./types";

const ORAICHAIN_COMMON_GITHUB_API_ENDPOINTS = {
  BASE_URL: "https://raw.githubusercontent.com/oraidex/oraidex-sdk",
  SUPPORTED_INFO: "/packages/oraidex-common/src/supported/config/"
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

export const readSupportedChainInfoStatic = async () => {
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  };
  console.log(
    "requesting . . .",
    `${ORAICHAIN_COMMON_GITHUB_API_ENDPOINTS.BASE_URL}${"/feat/intergrate_common"}${
      ORAICHAIN_COMMON_GITHUB_API_ENDPOINTS.SUPPORTED_INFO
    }${"oraidex.json"}`
  );

  // FIXME: update branch name in url
  const supportedChainInfo = await (
    await fetchRetry(
      `${ORAICHAIN_COMMON_GITHUB_API_ENDPOINTS.BASE_URL}${"/feat/intergrate_common"}${
        ORAICHAIN_COMMON_GITHUB_API_ENDPOINTS.SUPPORTED_INFO
      }${"oraidex.json"}`,
      options
    )
  ).json();

  console.log("supportedChainInfo", supportedChainInfo);

  return supportedChainInfo;
};
