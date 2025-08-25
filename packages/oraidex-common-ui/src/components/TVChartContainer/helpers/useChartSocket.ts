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
  currentPair: PairToken;
  period: string;
  socketConfig?: SocketConfig;
}) => {
  const [currentData, setData] = useState(null);
  const [currentPeriod, setPeriod] = useState<string>(period);
  const [pairActive, setPairActive] = useState<PairToken>(currentPair);
  const [isConnected, setIsConnected] = useState(false);
  const socketIORef = useRef<any>(null);

  const {
    retryOnError = true,
    reconnectAttempts,
    reconnectInterval,
    wsUrl,
    socketUrl: socketIOUrl,
    socketType = "websocket",
    pairMapping = PAIRS as unknown as PairToken[],
    socketIOOptions = {},
    eventName
  } = socketConfig || {};

  // WebSocket implementation
  const { lastJsonMessage, sendJsonMessage } = useWebSocket<LastJsonMessageType>(
    socketType === "websocket" ? wsUrl || WS_URL : null,
    {
      onOpen: () => {
        console.info("useChartSocket: connect WebSocket - ", wsUrl);
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
        if (!wsUrl) {
          console.warn("useChartSocket: Not have socketUrl option in websocket!", JSON.stringify(error));
          return;
        }
        console.error("useChartSocket: Have something went wrong with connection.", JSON.stringify(error));
      },
      reconnectAttempts: !wsUrl ? 0 : reconnectAttempts || WEBSOCKET_RECONNECT_ATTEMPTS,
      reconnectInterval: !wsUrl ? 0 : reconnectInterval || WEBSOCKET_RECONNECT_INTERVAL,
      retryOnError: !!retryOnError
    }
  );

  const ohlcvHandler = (payload: any) => {
    try {
      const event =
        Array.isArray(payload) && payload.length === 2 && typeof payload[0] === "string" ? payload[1] : payload;

      // console.log("event", { event, payload });

      if (!event) return;

      const { tokenMint, open, high, low, close, volume, minute } = event;

      const isCurrentSubscribeToken = tokenMint?.toLowerCase() === (pairActive || currentPair)?.to?.toLowerCase();

      if (!isCurrentSubscribeToken) return;

      const timeInSeconds = typeof minute === "number" ? minute * 60 : undefined;
      if (!timeInSeconds) return;

      const tradeData = {
        open,
        high,
        low,
        close,
        volume,
        time: timeInSeconds,
        pair: pairActive.info
      } as any;

      setData(tradeData);
      handleTradeEvent(tradeData, pairMapping);
    } catch (err) {
      console.error("useChartSocket: error handling updateOhlcv", err);
    }
  };

  // Socket.IO implementation - Initialize socket
  useEffect(() => {
    // FIXME: currently: allway create instance of socket.io
    if (socketType === "socketio" && socketIOUrl) {
      const socket = io(socketIOUrl, {
        transports: ["websocket"],
        reconnectionAttempts: reconnectAttempts || WEBSOCKET_RECONNECT_ATTEMPTS,
        reconnectionDelay: reconnectInterval || WEBSOCKET_RECONNECT_INTERVAL,
        ...socketIOOptions
      });

      socket.on("connect", () => {
        console.info("useChartSocket: Socket.IO connected - ", socketIOUrl, socket.id);
        setIsConnected(true);
      });

      socket.on("disconnect", (reason) => {
        console.info("useChartSocket: Socket.IO disconnected", reason, socket.id);
        setIsConnected(false);
      });

      socket.on("connect_error", (error) => {
        if (socket.active) {
          // temporary failure, the socket will automatically try to reconnect
          console.warn("useChartSocket: Temporary connection error, attempting to reconnect...", error.message);
        } else {
          // the connection was denied by the server
          console.error("useChartSocket: Connection denied by server", error.message);
          setIsConnected(false);
        }
      });

      socketIORef.current = socket;

      return () => {
        if (socketIORef.current) {
          socketIORef.current.off("connect");
          socketIORef.current.off("disconnect");
          socketIORef.current.off("connect_error");
          socketIORef.current.disconnect();
          socketIORef.current = null;
          setIsConnected(false);
        }
      };
    }
    // FIXME: socketConfig,... is constant so no need add to dependency array
    // }, [socketType, socketIOUrl, reconnectAttempts, reconnectInterval, socketIOOptions]);
  }, []);

  // Socket.IO implementation - Handle events
  useEffect(() => {
    if (socketType === "socketio" && socketIORef.current) {
      const socket = socketIORef.current;

      // Listen for ADL updateOhlcv events
      socket.on(eventName || "updateOhlcv", ohlcvHandler);

      return () => {
        socket.off(eventName || "updateOhlcv", ohlcvHandler);
      };
    }
  }, [socketType, eventName]);

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
