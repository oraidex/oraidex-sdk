import { TokenItemType } from "src/format-types";
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
  NobleIcon,
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
export type ChainIcon = {
  Icon: any;
  IconLight?: any;
  chainId: string;
};

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

export const chainIcons: ChainIcon[] = [
  {
    chainId: "Oraichain",
    Icon: OraiIcon,
    IconLight: OraiLightIcon
  },
  {
    chainId: "kawaii_6886-1",
    Icon: KwtIcon,
    IconLight: KwtIcon
  },
  {
    chainId: "osmosis-1",
    Icon: OsmoIcon,
    IconLight: OsmoLightIcon
  },
  {
    chainId: "injective-1",
    Icon: InjIcon,
    IconLight: InjIcon
  },
  {
    chainId: "cosmoshub-4",
    Icon: AtomIcon,
    IconLight: AtomIcon
  },
  {
    chainId: "0x01",
    Icon: EthIcon,
    IconLight: EthIcon
  },
  {
    chainId: "0x2b6653dc",
    Icon: TronIcon,
    IconLight: TronIcon
  },
  {
    chainId: "0x38",
    Icon: BnbIcon,
    IconLight: BnbIcon
  },
  {
    chainId: "0x1ae6",
    Icon: KwtIcon,
    IconLight: KwtIcon
  },
  {
    chainId: "noble-1",
    Icon: NobleIcon,
    IconLight: NobleIcon
  }
];

export const tokenIconByCoingeckoId: Record<string, TokenIcon> = tokensIcon.reduce((acc, cur) => {
  acc[cur.coinGeckoId] = cur;
  return acc;
}, {});

export const chainIconByChainId: Record<string, ChainIcon> = chainIcons.reduce((acc, cur) => {
  acc[cur.chainId] = cur;
  return acc;
}, {});

export const mapListWithIcon = (list: any[], listIcon: ChainIcon[] | TokenIcon[], key: "chainId" | "coinGeckoId") => {
  return list.map((item) => {
    let Icon = OraiIcon;
    let IconLight = OraiLightIcon;

    //@ts-ignore
    const findedItem = listIcon.find((icon) => icon[key] === item[key]);
    if (findedItem) {
      Icon = findedItem.Icon;
      IconLight = findedItem.IconLight;
    }

    return {
      ...item,
      Icon,
      IconLight
    };
  });
};
