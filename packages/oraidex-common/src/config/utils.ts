import { flatten } from "lodash";
import { chainInfos as customChainInfos } from "../network";
import { tokens } from "../token";
import { ChainIcon, chainIcons } from "./chainInfosWithIcon";
import { OraiIcon, OraiLightIcon } from "./icon";
import { TokenIcon, tokensIcon } from "./tokenWithIcon";

console.log("tokens-first", tokens);

const [otherChainTokens, oraichainTokens] = tokens || [[], []];

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

// mapped chain info with icon
export const chainInfosWithIcon = mapListWithIcon(customChainInfos, chainIcons, "chainId");

// mapped token with icon
export const oraichainTokensWithIcon = mapListWithIcon(oraichainTokens, tokensIcon, "coinGeckoId");
export const otherTokensWithIcon = mapListWithIcon(otherChainTokens, tokensIcon, "coinGeckoId");

export const tokensWithIcon = [otherTokensWithIcon, oraichainTokensWithIcon];
export const flattenTokensWithIcon = flatten(tokensWithIcon);
