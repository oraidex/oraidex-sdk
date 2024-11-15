import { fetchRetry } from "../helper";
import { SupportedChainInfo, SupportedChainInfoReader } from "./types";

const ORAICHAIN_COMMON_GITHUB_API_ENDPOINTS = {
  BASE_URL: "https://raw.githubusercontent.com/oraidex/oraidex-sdk",
  SUPPORTED_INFO: "/packages/oraidex-common/src/supported/config/"
};

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
