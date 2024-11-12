import {
  BridgeAppCurrency as BridgeAppCurrencyCommon,
  CustomChainInfo as CustomChainInfoCommon,
  OraiCommon
} from "@oraichain/common";
import {
  AMM_V3_CONTRACT,
  CONVERTER_CONTRACT,
  FACTORY_CONTRACT,
  FACTORY_V2_CONTRACT,
  MIXED_ROUTER,
  MULTICALL_CONTRACT,
  ORACLE_CONTRACT,
  ORAIDEX_BID_POOL_CONTRACT,
  ORAIDEX_LISTING_CONTRACT,
  REWARDER_CONTRACT,
  ROUTER_V2_CONTRACT,
  STAKING_CONTRACT
} from "./constant";
import { SupportChainInfoImpl, SupportedChainInfo, SupportedChainInfoReaderFromGit } from "./supported";
import { fetchRetry } from "./helper";

export type NetworkName =
  | "Oraichain"
  | "Cosmos Hub"
  | "Osmosis"
  | "OraiBridge"
  | "BNB Chain"
  | "Ethereum"
  | "Kawaiiverse"
  | "Kawaiiverse EVM"
  | "Tron Network"
  | "Injective"
  | "Noble"
  | "Neutaro"
  | "Celestia";

export type CosmosChainId =
  | "Oraichain" // oraichain
  | "oraibridge-subnet-2" // oraibridge
  | "osmosis-1" // osmosis
  | "cosmoshub-4" // cosmos hub
  | "injective-1" // injective network
  | "kawaii_6886-1" // kawaii subnetwork
  | "noble-1" // noble network
  | "Neutaro-1" // neutaro network;
  | "celestia"; // Celestia

export type EvmChainId =
  | "0x38" // bsc
  | "0x01" // ethereum
  | "0x1ae6" // kawaii
  | "0x2b6653dc"; // tron

export type NetworkChainId = CosmosChainId | EvmChainId;

export type CoinGeckoId =
  | "oraichain-token"
  | "osmosis"
  | "cosmos"
  | "ethereum"
  | "binancecoin"
  | "airight"
  | "oraidex"
  | "tether"
  | "kawaii-islands"
  | "milky-token"
  | "scorai"
  | "oraidex"
  | "usd-coin"
  | "tron"
  | "weth"
  | "wbnb"
  | "scatom"
  | "injective-protocol"
  | "bitcoin"
  | "neutaro"
  | "och"
  | "celestia"
  | "the-open-network"
  | "pepe"
  | "simon-s-cat"
  | "hamster-kombat";

export type NetworkType = "cosmos" | "evm";
export interface NetworkConfig {
  coinType?: number;
  explorer: string;
  /** Fixed fee */
  fee: { gasPrice: string; amount: string; gas: string };
  factory: string;
  factory_v2: string;
  oracle: string;
  staking: string;
  router: string;
  mixer_router: string;
  denom: string;
  prefix: string;
  rewarder: string;
  converter: string;
  oraidex_listing: string;
  bid_pool: string;
  multicall: string;
  pool_v3: string;
}

export type CoinIcon = any;
export type BridgeAppCurrency = BridgeAppCurrencyCommon;
export type CoinType = 118 | 60 | 195;

export type CustomChainInfo = CustomChainInfoCommon;

let oraiCommon: OraiCommon = null;
let supportedChainIds = [];
let tokenListSupports: SupportedChainInfo = {};
let mapDenomWithCoinGeckoId = {};

const ORAICHAIN_COMMON_GITHUB_API_ENDPOINTS = {
  BASE_URL: "https://api.github.com",
  SUPPORTED_INFO: "/repos/oraidex/oraidex-sdk/contents/packages/oraidex-common/src/supported/config/"
};

const readSupportedChainInfoStatic = async () => {
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  };

  const res = await (
    await fetchRetry(
      `${ORAICHAIN_COMMON_GITHUB_API_ENDPOINTS.BASE_URL}${ORAICHAIN_COMMON_GITHUB_API_ENDPOINTS.SUPPORTED_INFO}oraidex.json?ref=feat/intergrate_common`,
      options
    )
  ).json();

  console.log(
    "url",
    `${ORAICHAIN_COMMON_GITHUB_API_ENDPOINTS.BASE_URL}${ORAICHAIN_COMMON_GITHUB_API_ENDPOINTS.SUPPORTED_INFO}oraidex.json?ref=feat/intergrate_common`
  );

  const supportedChainInfo = await (await fetchRetry(res.download_url)).json();

  return supportedChainInfo;
};

const initOraiCommon = async () => {
  if (!oraiCommon) {
    oraiCommon = await OraiCommon.initializeFromBackend();

    // const readerInstance = new SupportedChainInfoReaderFromGit();
    // const supportedChainIns = await SupportChainInfoImpl.create(readerInstance);
    // tokenListSupports = { ...supportedChainIns.supportedChainInfo };
    const tokenListSupports = await readSupportedChainInfoStatic();

    supportedChainIds.push(...Object.keys(tokenListSupports));
    Object.values(tokenListSupports).map((item) => {
      mapDenomWithCoinGeckoId = Object.values(item).reduce((acc, cur) => {
        acc[cur.denom] = cur.coingecko_id;

        return acc;
      }, {});
    });
  }

  return { oraiCommon, supportedChainIds };
};
await initOraiCommon();

export const defaultBech32Config = (
  mainPrefix: string,
  validatorPrefix = "val",
  consensusPrefix = "cons",
  publicPrefix = "pub",
  operatorPrefix = "oper"
) => {
  return {
    bech32PrefixAccAddr: mainPrefix,
    bech32PrefixAccPub: mainPrefix + publicPrefix,
    bech32PrefixValAddr: mainPrefix + validatorPrefix + operatorPrefix,
    bech32PrefixValPub: mainPrefix + validatorPrefix + operatorPrefix + publicPrefix,
    bech32PrefixConsAddr: mainPrefix + validatorPrefix + consensusPrefix,
    bech32PrefixConsPub: mainPrefix + validatorPrefix + consensusPrefix + publicPrefix
  };
};

export const OraiToken: BridgeAppCurrency = {
  coinDenom: "ORAI",
  coinMinimalDenom: "orai",
  coinDecimals: 6,
  coinGeckoId: "oraichain-token",
  bridgeTo: ["0x38", "0x01", "injective-1"],
  coinImageUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/7533.png",
  gasPriceStep: {
    low: 0.003,
    average: 0.005,
    high: 0.007
  }
};

export const OraiBToken: BridgeAppCurrency = {
  coinDenom: "ORAIB",
  coinMinimalDenom: "uoraib",
  coinDecimals: 6,
  gasPriceStep: {
    low: 0,
    average: 0,
    high: 0
  }
};

export const KawaiiToken: BridgeAppCurrency = {
  coinDenom: "ORAIE",
  coinMinimalDenom: "oraie",
  coinDecimals: 18,
  coinGeckoId: "kawaii-islands",
  gasPriceStep: {
    low: 0,
    average: 0.000025,
    high: 0.00004
  }
};

export const InjectiveToken: BridgeAppCurrency = {
  coinDenom: "INJ",
  coinMinimalDenom: "inj",
  coinDecimals: 18,
  coinGeckoId: "injective-protocol",
  gasPriceStep: {
    low: 5000000000,
    average: 25000000000,
    high: 50000000000
  }
};

export const AtomToken: BridgeAppCurrency = {
  coinDenom: "ATOM",
  coinMinimalDenom: "uatom",
  coinDecimals: 6,
  coinGeckoId: "cosmos",
  coinImageUrl: "https://dhj8dql1kzq2v.cloudfront.net/white/atom.png",
  gasPriceStep: {
    low: 0,
    average: 0.025,
    high: 0.04
  }
};

export const NeutaroToken: BridgeAppCurrency = {
  coinDenom: "NTMPI",
  coinMinimalDenom: "uneutaro",
  coinDecimals: 6,
  coinGeckoId: "neutaro",
  coinImageUrl: "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/Neutaro/chain.png",
  gasPriceStep: {
    low: 0.01,
    average: 0.025,
    high: 0.03
  }
};

export const NativeUsdcNobleToken: BridgeAppCurrency = {
  coinDenom: "USDC",
  coinMinimalDenom: "uusdc",
  coinDecimals: 6,
  coinGeckoId: "usd-coin",
  coinImageUrl: "https://raw.githubusercontent.com/cosmos/chain-registry/master/noble/images/USDCoin.png",
  gasPriceStep: {
    low: 0,
    average: 0.025,
    high: 0.03
  }
};

export const OsmoToken: BridgeAppCurrency = {
  coinDenom: "OSMO",
  coinMinimalDenom: "uosmo",
  coinDecimals: 6,
  coinGeckoId: "osmosis",
  coinImageUrl: "https://dhj8dql1kzq2v.cloudfront.net/white/osmo.png",
  gasPriceStep: {
    low: 0,
    average: 0.025,
    high: 0.04
  }
};

export const oraichainNetwork: CustomChainInfo = {
  ...oraiCommon.chainInfos.getSpecificChainInfo("Oraichain"),
  bech32Config: defaultBech32Config("orai"),
  currencies: oraiCommon.chainInfos.getSpecificChainInfo("Oraichain").currencies.map((currency) => {
    const coingeckoId =
      mapDenomWithCoinGeckoId[currency.coinMinimalDenom] || mapDenomWithCoinGeckoId[currency.contractAddress];
    if (coingeckoId) {
      return {
        ...currency,
        coinGeckoId: coingeckoId
      };
    }
    return currency;
  })
};

export const chainInfos: CustomChainInfo[] = oraiCommon.chainInfos.chainInfos
  .filter((chain) => supportedChainIds.includes(chain.chainId))
  .map((c) => {
    const updatedCurrencies = c.currencies.map((currency) => {
      const coingeckoId =
        mapDenomWithCoinGeckoId[currency.coinMinimalDenom] || mapDenomWithCoinGeckoId[currency.contractAddress];
      if (coingeckoId) {
        return {
          ...currency,
          coinGeckoId: coingeckoId
        };
      }
      return currency;
    });

    return {
      ...c,
      currencies: updatedCurrencies,
      Icon: c.chainLogoSvg || c.chainLogoPng,
      IconLight: c.chainLogoSvg || c.chainLogoPng
    };
  });

export const network: CustomChainInfo & NetworkConfig = {
  ...oraichainNetwork,
  prefix: oraichainNetwork.bech32Config.bech32PrefixAccAddr,
  denom: "orai",
  coinType: oraichainNetwork.bip44.coinType as any,
  fee: { gasPrice: "0.00506", amount: "1518", gas: "2000000" }, // 0.000500 ORAI
  factory: FACTORY_CONTRACT,
  factory_v2: FACTORY_V2_CONTRACT,
  router: ROUTER_V2_CONTRACT,
  mixer_router: MIXED_ROUTER,
  oracle: ORACLE_CONTRACT,
  staking: STAKING_CONTRACT,
  rewarder: REWARDER_CONTRACT,
  converter: CONVERTER_CONTRACT,
  oraidex_listing: ORAIDEX_LISTING_CONTRACT,
  multicall: MULTICALL_CONTRACT,
  bid_pool: ORAIDEX_BID_POOL_CONTRACT,
  explorer: "https://scan.orai.io",
  pool_v3: AMM_V3_CONTRACT
};

// exclude kawaiverse subnet and other special evm that has different cointype
export const evmChains = chainInfos.filter((c) => c.networkType === "evm");
export const cosmosChains: CustomChainInfo[] = chainInfos.filter((c) => c.networkType === "cosmos");

// evm network
export enum Networks {
  mainnet = 1,
  ropsten = 3,
  rinkeby = 4,
  goerli = 5,
  optimism = 10,
  kovan = 42,
  matic = 137,
  kovanOptimism = 69,
  xdai = 100,
  goerliOptimism = 420,
  arbitrum = 42161,
  rinkebyArbitrum = 421611,
  goerliArbitrum = 421613,
  mumbai = 80001,
  sepolia = 11155111,
  avalancheMainnet = 43114,
  avalancheFuji = 43113,
  fantomTestnet = 4002,
  fantom = 250,
  bsc = 56,
  bsc_testnet = 97,
  moonbeam = 1284,
  moonriver = 1285,
  moonbaseAlphaTestnet = 1287,
  harmony = 1666600000,
  cronos = 25,
  fuse = 122,
  songbirdCanaryNetwork = 19,
  costonTestnet = 16,
  boba = 288,
  aurora = 1313161554,
  astar = 592,
  okc = 66,
  heco = 128,
  metis = 1088,
  rsk = 30,
  rskTestnet = 31,
  evmos = 9001,
  evmosTestnet = 9000,
  thundercore = 108,
  thundercoreTestnet = 18,
  oasis = 26863,
  celo = 42220,
  godwoken = 71402,
  godwokentestnet = 71401,
  klatyn = 8217,
  milkomeda = 2001,
  kcc = 321,
  kawaiiverse = 6886,
  etherlite = 111,
  tron = 728126428
}
