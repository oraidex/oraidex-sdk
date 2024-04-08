import { Event } from "@cosmjs/stargate";
import { invokableMachineStateKeys } from "../constants";
import { createCosmosIntepreter } from "../intepreters/cosmos.intepreter";
import { EventHandler } from "./event.handler";

export class OraichainHandler extends EventHandler {
  public handleEvent(eventData: any[]) {
    for (const eventItem of eventData) {
      const events: Event[] = eventItem.result.events;
      // FIXME: we should not use events.find here. we need to exhaustively search for the attr type as one tx can include many transactions
      if (eventItem.result.log.includes("transfer_back_to_remote_chain")) {
        // create new machine so we start a new context for the transaction
        const intepreter = createCosmosIntepreter(this.db);
        this.im.appendIntepreter(intepreter);
        intepreter.start();
        intepreter.send({ type: invokableMachineStateKeys.STORE_ON_RECV_PACKET_ORAICHAIN, payload: eventItem });
        return;
      }
      if (events.find((attr) => attr.type === "recv_packet")) {
        this.im.transitionInterpreters(invokableMachineStateKeys.STORE_ON_RECV_PACKET_ORAICHAIN, eventItem);
        return;
      }
      if (events.find((attr) => attr.type === "acknowledge_packet")) {
        this.im.transitionInterpreters(invokableMachineStateKeys.STORE_ON_ACKNOWLEDGEMENT_ORAICHAIN, eventItem);
        return;
      }
    }
  }
}
