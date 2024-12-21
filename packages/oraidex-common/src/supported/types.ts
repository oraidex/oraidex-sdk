export type SupportedChainInfo = {
  [chainId: string]: Record<string, SupportedTokenInfo>;
};

export type SupportedTokenInfo = {
  denom: string;
  coingecko_id: string;
};

export interface SupportedChainInfoReader {
  readSupportedChainInfo(): Promise<SupportedChainInfo>;
}

export interface SupportedTokens {
  getSupportedTokensByChain: (chainId: string) => Record<string, SupportedTokenInfo>;
}
