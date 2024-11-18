import { fetchRetry } from "../helper";
import oraidexJson from "./config/oraidex.json";

// BASE_URL: "https://raw.githubusercontent.com/oraidex/oraidex-sdk",
// SUPPORTED_INFO: "/packages/oraidex-common/src/supported/config/"
const ORAIDEX_API_ENDPOINTS = {
  BASE_URL: "https://api-staging.oraidex.io",
  SUPPORTED_INFO: "/v1/token-map/supported"
};

export const readSupportedChainInfoStatic = async () => {
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  };
  const supportedChainInfo = await (
    await fetchRetry(`${ORAIDEX_API_ENDPOINTS.BASE_URL}${ORAIDEX_API_ENDPOINTS.SUPPORTED_INFO}`, options)
  ).json();

  console.log("supportedChainInfo", supportedChainInfo);

  if (!supportedChainInfo) {
    return oraidexJson;
  }

  return supportedChainInfo;
};
