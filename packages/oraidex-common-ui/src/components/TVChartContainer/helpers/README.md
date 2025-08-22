# useChartSocket Hook

Hook này hỗ trợ cả WebSocket thông thường và Socket.IO để nhận dữ liệu real-time cho biểu đồ.

## Cách sử dụng

### 1. WebSocket (mặc định)

```typescript
import { useChartSocket } from "./helpers/useChartSocket";

const { currentPair, data, isConnected, socketType } = useChartSocket({
  currentPair: { info: "BTCUSDT", symbol: "BTC/USDT" },
  period: "1m",
  socketConfig: {
    socketType: "websocket", // mặc định
    wsUrl: "wss://your-websocket-server.com",
    pairMapping: pairs,
    reconnectInterval: 3000,
    retryOnError: true,
    reconnectAttempts: 5
  }
});
```

### 2. Socket.IO

```typescript
import { useChartSocket } from "./helpers/useChartSocket";

const { currentPair, data, isConnected, socketType } = useChartSocket({
  currentPair: { info: "BTCUSDT", symbol: "BTC/USDT" },
  period: "1m",
  socketConfig: {
    socketType: "socketio",
    socketUrl: "https://your-socketio-server.com",
    pairMapping: pairs,
    reconnectInterval: 3000,
    retryOnError: true,
    reconnectAttempts: 5,
    socketIOOptions: {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      reconnectionDelayMax: 5000
    }
  }
});
```

## Cấu hình SocketConfig

| Thuộc tính          | Kiểu                        | Mô tả                                       |
| ------------------- | --------------------------- | ------------------------------------------- |
| `socketType`        | `'websocket' \| 'socketio'` | Loại socket sử dụng (mặc định: 'websocket') |
| `wsUrl`             | `string`                    | URL WebSocket server                        |
| `socketUrl`         | `string`                    | URL Socket.IO server                        |
| `pairMapping`       | `PairToken[]`               | Mapping các cặp token                       |
| `reconnectInterval` | `number`                    | Thời gian giữa các lần reconnect (ms)       |
| `retryOnError`      | `boolean`                   | Có retry khi có lỗi không                   |
| `reconnectAttempts` | `number`                    | Số lần thử reconnect tối đa                 |
| `socketIOOptions`   | `object`                    | Tùy chọn cấu hình Socket.IO                 |

## Events Socket.IO

Hook này lắng nghe các events sau từ Socket.IO server:

- `chart_data`: Dữ liệu biểu đồ
- `trade_event`: Sự kiện giao dịch

### Format dữ liệu expected:

```typescript
{
  stream: 'BTCUSDT@1m',
  data: {
    // Dữ liệu biểu đồ hoặc trade
  }
}
```

## Return Values

| Thuộc tính    | Kiểu                               | Mô tả                    |
| ------------- | ---------------------------------- | ------------------------ |
| `currentPair` | `{ info: string; symbol: string }` | Cặp token hiện tại       |
| `data`        | `any`                              | Dữ liệu real-time        |
| `isConnected` | `boolean`                          | Trạng thái kết nối       |
| `socketType`  | `string`                           | Loại socket đang sử dụng |

## Ví dụ sử dụng trong TVChartContainer

```typescript
// WebSocket
<TVChartContainer
  currentPair={currentPair}
  socketConfig={{
    socketType: 'websocket',
    wsUrl: 'wss://api.example.com/ws',
    pairMapping: pairs
  }}
/>

// Socket.IO
<TVChartContainer
  currentPair={currentPair}
  socketConfig={{
    socketType: 'socketio',
    socketUrl: 'https://api.example.com',
    pairMapping: pairs,
    socketIOOptions: {
      transports: ['websocket'],
      reconnection: true
    }
  }}
/>
```
