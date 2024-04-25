export enum StateDBStatus {
  PENDING = "PENDING",
  FINISHED = "FINISHED"
}

export enum ForwardTagOnOraichain {
  COSMOS = "Cosmos",
  EVM = "Evm"
}

export enum OraichainEventHandler {
  OnRecvPacket,
  OnAcknowledgement
}
