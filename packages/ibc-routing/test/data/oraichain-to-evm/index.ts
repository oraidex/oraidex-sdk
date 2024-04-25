import fs from "fs";
import path from "path";

export const TransferBackToRemoteTxData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "./transfer_back_to_remote.json")).toString("utf-8")
);

export const OnRecvPacketTxData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "./on_recv_packet.json")).toString("utf-8")
);

export const OnRequestBatchTxData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "./request_batch.json")).toString("utf-8")
);

export const BatchSendToEthClaimTxData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "./batch_send_to_eth_claim.json")).toString("utf-8")
);
