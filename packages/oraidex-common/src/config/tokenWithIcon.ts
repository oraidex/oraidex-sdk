import { TokenItemType } from "../token";
import {
  AiriIcon,
  AtomIcon,
  BnbIcon,
  BtcIcon,
  EthIcon,
  HamsterIcon,
  InjIcon,
  KwtIcon,
  MilkyIcon,
  OCHIcon,
  OraiIcon,
  OraiLightIcon,
  OraixIcon,
  OraixLightIcon,
  OsmoIcon,
  OsmoLightIcon,
  PepeIcon,
  ScAtomIcon,
  ScOraiIcon,
  TronIcon,
  UsdcIcon,
  UsdtIcon
} from "./icon";

export type TokenIcon = Pick<TokenItemType, "coinGeckoId" | "Icon" | "IconLight">;

export const tokensIcon: TokenIcon[] = [
  {
    coinGeckoId: "oraichain-token",
    Icon: OraiIcon,
    IconLight: OraiLightIcon
  },
  {
    coinGeckoId: "usd-coin",
    Icon: UsdcIcon,
    IconLight: UsdcIcon
  },
  {
    coinGeckoId: "airight",
    Icon: AiriIcon,
    IconLight: AiriIcon
  },
  {
    coinGeckoId: "tether",
    Icon: UsdtIcon,
    IconLight: UsdtIcon
  },
  {
    coinGeckoId: "tron",
    Icon: TronIcon,
    IconLight: TronIcon
  },
  {
    coinGeckoId: "kawaii-islands",
    Icon: KwtIcon,
    IconLight: KwtIcon
  },
  {
    coinGeckoId: "milky-token",
    Icon: MilkyIcon,
    IconLight: MilkyIcon
  },
  {
    coinGeckoId: "osmosis",
    Icon: OsmoIcon,
    IconLight: OsmoLightIcon
  },
  {
    coinGeckoId: "injective-protocol",
    Icon: InjIcon,
    IconLight: InjIcon
  },
  {
    coinGeckoId: "cosmos",
    Icon: AtomIcon,
    IconLight: AtomIcon
  },
  {
    coinGeckoId: "weth",
    Icon: EthIcon,
    IconLight: EthIcon
  },
  {
    coinGeckoId: "ethereum",
    Icon: EthIcon,
    IconLight: EthIcon
  },
  {
    coinGeckoId: "bitcoin",
    Icon: BtcIcon,
    IconLight: BtcIcon
  },
  {
    coinGeckoId: "wbnb",
    Icon: BnbIcon,
    IconLight: BnbIcon
  },
  {
    coinGeckoId: "binancecoin",
    Icon: BnbIcon,
    IconLight: BnbIcon
  },
  {
    coinGeckoId: "oraidex",
    Icon: OraixIcon,
    IconLight: OraixLightIcon
  },
  {
    coinGeckoId: "scorai",
    Icon: ScOraiIcon,
    IconLight: ScOraiIcon
  },
  {
    coinGeckoId: "scatom",
    Icon: ScAtomIcon,
    IconLight: ScAtomIcon
  },
  {
    coinGeckoId: "och",
    Icon: OCHIcon,
    IconLight: OCHIcon
  },
  {
    coinGeckoId: "pepe",
    Icon: PepeIcon,
    IconLight: PepeIcon
  },
  {
    coinGeckoId: "hamster-kombat",
    Icon: HamsterIcon,
    IconLight: HamsterIcon
  }
];

export const tokenIconByCoingeckoId: Record<string, TokenIcon> = tokensIcon.reduce((acc, cur) => {
  acc[cur.coinGeckoId] = cur;
  return acc;
}, {});
