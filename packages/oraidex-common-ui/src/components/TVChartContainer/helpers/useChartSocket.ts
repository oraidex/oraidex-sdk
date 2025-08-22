import { PAIRS, WEBSOCKET_RECONNECT_ATTEMPTS, WEBSOCKET_RECONNECT_INTERVAL } from "@oraichain/oraidex-common";
import { handleTradeEvent } from "./streaming";
import { useEffect, useState, useRef } from "react";
import { WS_URL } from "./requests";
import useWebSocket from "react-use-websocket";
import { PairToken } from "./useTVDatafeed";
import { io } from "socket.io-client";

export type LastJsonMessageType = {
  data: any;
  stream: string;
};

export type SocketConfig = {
  eventName?: string;
  wsUrl?: string;
  socketUrl?: string; // For Socket.IO
  socketType?: "websocket" | "socketio";
  pairMapping?: PairToken[];
  reconnectInterval?: number;
  retryOnError?: boolean;
  reconnectAttempts?: number;
  socketIOOptions?: {
    transports?: string[];
    autoConnect?: boolean;
    reconnection?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    reconnectionDelayMax?: number;
  };
};

export const useChartSocket = ({
  currentPair,
  period,
  socketConfig
}: {
  currentPair: { info: string; symbol: string };
  period: string;
  socketConfig?: SocketConfig;
}) => {
  const [currentData, setData] = useState(null);
  const [currentPeriod, setPeriod] = useState<string>(period);
  const [pairActive, setPairActive] = useState<{ info: string; symbol: string }>(currentPair);
  const [isConnected, setIsConnected] = useState(false);
  const socketIORef = useRef<any>(null);

  const {
    retryOnError = true,
    reconnectAttempts,
    reconnectInterval,
    wsUrl: socketUrl,
    socketUrl: socketIOUrl,
    socketType = "websocket",
    pairMapping = PAIRS as unknown as PairToken[],
    socketIOOptions = {},
    eventName
  } = socketConfig || {};

  // WebSocket implementation
  const { lastJsonMessage, sendJsonMessage } = useWebSocket<LastJsonMessageType>(
    socketType === "websocket" ? socketUrl || WS_URL : null,
    {
      onOpen: () => {
        console.info("useChartSocket: connect WebSocket - ", socketUrl);
        setIsConnected(true);
      },
      onClose: () => {
        console.info("useChartSocket: WebSocket connection closed.");
        setIsConnected(false);
      },
      onReconnectStop(numAttempts) {
        if (numAttempts === (reconnectAttempts || WEBSOCKET_RECONNECT_ATTEMPTS))
          console.info("useChartSocket: Reconnection reaches above limit. Unsubscribe to all!");
      },
      shouldReconnect: () => true,
      onError: (error) => {
        if (!socketUrl) {
          console.warn("useChartSocket: Not have socketUrl option in websocket!", JSON.stringify(error));
          return;
        }
        console.error("useChartSocket: Have something went wrong with connection.", JSON.stringify(error));
      },
      reconnectAttempts: !socketUrl ? 0 : reconnectAttempts || WEBSOCKET_RECONNECT_ATTEMPTS,
      reconnectInterval: !socketUrl ? 0 : reconnectInterval || WEBSOCKET_RECONNECT_INTERVAL,
      retryOnError: !!retryOnError
    }
  );

  // Socket.IO implementation
  useEffect(() => {
    if (socketType === "socketio" && socketIOUrl) {
      const ohlcvHandler = (payload: any) => {
        try {
          const event =
            Array.isArray(payload) && payload.length === 2 && typeof payload[0] === "string" ? payload[1] : payload;

          console.log("event", { event, payload });

          if (!event) return;

          const { tokenMint, open, high, low, close, volume, minute } = event;

          // Try to find the mapped pair
          const mapped = (pairMapping || []).find((p: any) => {
            // ADL story pairs expose `to` and `info` fields
            return (
              (p as any)?.to === tokenMint ||
              (typeof (p as any)?.info === "string" && (p as any).info.endsWith(tokenMint)) ||
              (typeof (p as any)?.id === "string" && (p as any).id.includes(tokenMint))
            );
          });

          // Only handle if it matches current active pair (when we can determine it)
          const mappedInfo = (mapped as any)?.info as string | undefined;
          const isActivePair = mappedInfo ? mappedInfo === pairActive.info : true;

          if (!isActivePair) return;

          const timeInSeconds = typeof minute === "number" ? minute * 60 : undefined;
          if (!timeInSeconds) return;

          const tradeData = {
            open,
            high,
            low,
            close,
            volume,
            time: timeInSeconds,
            pair: mappedInfo || pairActive.info
          } as any;

          setData(tradeData);
          handleTradeEvent(tradeData, pairMapping);
        } catch (err) {
          console.error("useChartSocket: error handling updateOhlcv", err);
        }
      };
      const initSocketIO = async () => {
        try {
          const socket = io(socketIOUrl, {
            transports: ["websocket"], // "polling"
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: reconnectAttempts || WEBSOCKET_RECONNECT_ATTEMPTS,
            reconnectionDelay: reconnectInterval || WEBSOCKET_RECONNECT_INTERVAL,
            reconnectionDelayMax: 5000,
            ...socketIOOptions
          });

          socket.on("connect", () => {
            console.info("useChartSocket: Socket.IO connected - ", socketIOUrl);
            setIsConnected(true);
          });

          socket.on("disconnect", () => {
            console.info("useChartSocket: Socket.IO disconnected");
            setIsConnected(false);
          });

          socket.on("connect_error", (error) => {
            console.error("useChartSocket: Socket.IO connection error", error);
          });

          socket.on("reconnect_attempt", (attemptNumber) => {
            console.info(`useChartSocket: Socket.IO reconnection attempt ${attemptNumber}`);
          });

          socket.on("reconnect_failed", () => {
            console.error("useChartSocket: Socket.IO reconnection failed");
          });

          // Listen for ADL updateOhlcv events
          socket.on(eventName || "updateOhlcv", ohlcvHandler);

          socketIORef.current = socket;
        } catch (error) {
          console.error("useChartSocket: Failed to initialize Socket.IO", error);
        }
      };

      initSocketIO();

      return () => {
        if (socketIORef.current) {
          socketIORef.current.off(eventName || "updateOhlcv", ohlcvHandler);
          socketIORef.current.disconnect();
          socketIORef.current = null;
        }
      };
    }
  }, [
    socketType,
    socketIOUrl,
    currentPair.info,
    period,
    pairMapping,
    reconnectAttempts,
    reconnectInterval,
    socketIOOptions,
    pairActive.info
  ]);

  // WebSocket subscription logic
  useEffect(() => {
    if (socketType === "websocket" && sendJsonMessage && currentPair && period) {
      if (period !== currentPeriod || currentPair.info !== pairActive?.info) {
        sendJsonMessage({
          id: 1,
          method: "UNSUBSCRIBE",
          params: [`${pairActive.info}@${currentPeriod}`]
        });

        setPeriod(period);
        setPairActive(currentPair);
      }

      console.info("SUBSCRIBE", {
        id: 1,
        method: "SUBSCRIBE",
        params: [`${currentPair.info}@${period}`]
      });

      sendJsonMessage({
        id: 1,
        method: "SUBSCRIBE",
        params: [`${currentPair.info}@${period}`]
      });

      return () => {
        sendJsonMessage({
          id: 1,
          method: "UNSUBSCRIBE",
          params: [`${currentPair.info}@${period}`]
        });
      };
    }
  }, [sendJsonMessage, currentPair, period, socketType]);

  // // Socket.IO subscription logic
  // useEffect(() => {
  //   if (socketType === "socketio" && socketIORef.current && isConnected && currentPair && period) {
  //     if (period !== currentPeriod || currentPair.info !== pairActive?.info) {
  //       // Unsubscribe from previous pair/period
  //       socketIORef.current.emit("unsubscribe", {
  //         stream: `${pairActive.info}@${currentPeriod}`
  //       });

  //       setPeriod(period);
  //       setPairActive(currentPair);
  //     }

  //     console.info("Socket.IO SUBSCRIBE", {
  //       stream: `${currentPair.info}@${period}`
  //     });

  //     // Subscribe to new pair/period
  //     socketIORef.current.emit("subscribe", {
  //       stream: `${currentPair.info}@${period}`
  //     });

  //     return () => {
  //       socketIORef.current.emit("unsubscribe", {
  //         stream: `${currentPair.info}@${period}`
  //       });
  //     };
  //   }
  // }, [socketType, isConnected, currentPair, period, currentPeriod, pairActive]);

  // Handle WebSocket messages
  useEffect(() => {
    if (socketType === "websocket" && lastJsonMessage && lastJsonMessage.data) {
      const { data, stream } = lastJsonMessage || {};

      if (stream === `${currentPair.info}@${period}`) {
        setData(data);
        handleTradeEvent(data, pairMapping);
      }
    }
  }, [lastJsonMessage, socketType, currentPair.info, period, pairMapping]);

  return {
    currentPair,
    data: currentData,
    isConnected,
    socketType
  };
};
