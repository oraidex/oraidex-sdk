const fetchRetry = async (url, options?: any) => {
  let retry = options?.retry ?? 3;
  const { callback, timeout = 30000, ...init } = options || {};
  init.signal = AbortSignal.timeout(timeout);
  while (retry > 0) {
    try {
      return await fetch(url, init);
    } catch (e) {
      callback?.(retry);
      retry--;
      if (retry === 0) {
        throw e;
      }
    }
  }
};

const ORAICHAIN_COMMON_GITHUB_API_ENDPOINTS = {
  BASE_URL: "https://raw.githubusercontent.com/oraidex/oraidex-sdk",
  // SUPPORTED_INFO: "/oraidex/oraidex-sdk/main/packages/oraidex-common/src/supported/config/"
  SUPPORTED_INFO: "/packages/oraidex-common/src/supported/config/"
};

const readSupportedChainInfoStatic = async () => {
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

readSupportedChainInfoStatic();
