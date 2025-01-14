import { Affiliate } from "@oraichain/oraidex-contracts-sdk/build/OraiswapMixedRouter.types";
import { Path } from "../../types";
import { validatePath, validateReceiver } from "../common";

export class ChainMsg {
  constructor(
    protected path: Path,
    protected minimumReceive: string,
    protected receiver: string,
    protected currentChainAddress: string,
    protected memo: string = "",
    protected affiliates: Affiliate[] = []
  ) {
    // validate path
    validatePath(path);
    validateReceiver(receiver, currentChainAddress, path.chainId);
  }

  setMinimumReceive(minimumReceive: string) {
    this.minimumReceive = minimumReceive;
  }

  getMinimumReceive() {
    return this.minimumReceive;
  }
}
