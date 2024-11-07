export type SupportedChainInfo = {
  [chainId: string]: {
    coin: {
      [name: string]: {
        denom: string;
        coingecko_id: string;
      };
    };
  };
};

export interface SupportedChainInfoReader {
  readSupportedChainInfo(): Promise<SupportedChainInfo>;
}

export interface SupportedTokens {
  oraichainSupportedTokens: string[];
}
