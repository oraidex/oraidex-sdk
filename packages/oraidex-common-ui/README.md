# Oraidex Common UI

A React UI library for Oraidex components including TradingView chart integration.

## Installation

```bash
npm install @oraichain/oraidex-common-ui
```

## Peer Dependencies

This library requires the following peer dependencies to be installed in your project:

```bash
npm install react react-dom react-use-websocket socket.io-client
```

### Required Versions

- `react`: ^18.2.0
- `react-dom`: ^18.2.0
- `react-use-websocket`: ^4.5.0
- `socket.io-client`: ^4.8.1

## Usage

```tsx
import { TVChartContainer } from "@oraichain/oraidex-common-ui";

function App() {
  return (
    <TVChartContainer
      currentPair={{ info: "BTC/USDT", symbol: "BTCUSDT" }}
      period="1m"
      socketConfig={{
        socketType: "socketio",
        socketUrl: "wss://your-socket-server.com",
        eventName: "updateOhlcv"
      }}
    />
  );
}
```

## Socket Configuration

The library supports both WebSocket and Socket.IO connections. Make sure to install the required dependencies based on your socket type:

- For WebSocket: `react-use-websocket` is required
- For Socket.IO: `socket.io-client` is required

## Troubleshooting

If you encounter `ChunkLoadError` when using Socket.IO, ensure that:

1. `socket.io-client` is installed as a dependency in your project
2. You're using compatible versions of the peer dependencies
3. Your bundler is configured to handle external dependencies correctly
