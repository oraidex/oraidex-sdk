import { OraidexCommon } from "@oraichain/oraidex-common";
import { Path } from "../../types";
import { validatePath, validateReceiver } from "../common";

export class ChainMsg {
  constructor(
    protected path: Path,
    protected minimumReceive: string,
    protected receiver: string,
    protected currentChainAddress: string,
    protected memo: string = "",
    protected oraidexCommon: OraidexCommon
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
