import { fetchRetry } from "../helper";
import oraidexJson from "./config/oraidex.json";

// BASE_URL: "https://raw.githubusercontent.com/oraidex/oraidex-sdk",
// SUPPORTED_INFO: "/packages/oraidex-common/src/supported/config/"
const ORAIDEX_API_ENDPOINTS = {
  BASE_URL: "https://oraicommon-staging.oraidex.io",
  SUPPORTED_INFO: "/api/v1/supported-tokens/oraidex"
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

  if (!supportedChainInfo) {
    return oraidexJson;
  }

  return supportedChainInfo;
};
