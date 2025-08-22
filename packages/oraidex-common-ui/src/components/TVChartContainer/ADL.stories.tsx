import { Meta, StoryObj } from "@storybook/react";
import React from "react";
import TVChartContainer, { TVChartContainerProsp } from "./TVChartContainer";
import { Bar } from "./helpers/types";
import axios from "axios";

const DATA_PAIRS = [
  {
    id: "1704-sol-8mGGF37Yqp8fmb2BvVJuZKVxBMs4qbqvSw4W4KdnS6DF",
    symbol: "SOL/213",
    from: "11111111111111111111111111111111",
    to: "8mGGF37Yqp8fmb2BvVJuZKVxBMs4qbqvSw4W4KdnS6DF",
    fromDecimal: 9,
    toDecimal: 6,
    priceScale: 1e12,
    useRawVolume: true,
    info: "sol-8mGGF37Yqp8fmb2BvVJuZKVxBMs4qbqvSw4W4KdnS6DF"
  }
];

const meta: Meta<typeof TVChartContainer> = {
  component: TVChartContainer,
  title: "ADL TradingView",
  argTypes: {}
};
export default meta;

type Story = StoryObj<typeof TVChartContainer>;

export const ADLChart: Story = (args: TVChartContainerProsp) => (
  <div style={{ height: "80vh" }}>
    <TVChartContainer {...args} />;
  </div>
);

const customTimeFrames = [
  { text: "1h", resolution: "1", description: "1 Hour" },
  { text: "4h", resolution: "5", description: "4 Hours" },
  { text: "1d", resolution: "15", description: "1 Day" },
  { text: "1w", resolution: "60", description: "1 Week" },
  { text: "1m", resolution: "240", description: "1 Month" },
  { text: "3m", resolution: "1440", description: "3 Months" }
];

const MAP_TF_SECOND_NUMBER_TO_STRING = {
  [60 * 1]: "1m",
  [60 * 5]: "5m",
  [60 * 15]: "15m",
  [60 * 45]: "45m",
  [60 * 60]: "1h",
  [60 * 60 * 2]: "2h",
  [60 * 60 * 4]: "4h",
  [60 * 60 * 6]: "6h",
  [60 * 60 * 8]: "8h",
  [60 * 60 * 12]: "12h",
  [60 * 60 * 24]: "1d"
};

const fetchDataChart = async (params: { pair: string; startTime: number; endTime: number; tf: number }) => {
  const { pair, startTime, endTime, tf } = params;

  try {
    const timeframe = MAP_TF_SECOND_NUMBER_TO_STRING[tf];

    const res = await axios.get(
      `https://backend-release.agents.land/chart/ohlcv/ecsdsq91zCdS9wStAy7qzHSKQWKDqRdTMxgqGj7ct9e?timeframe=${timeframe}`,
      {}
    );

    const data = [...(res.data.ohlcv || [])].map((i) => {
      return {
        ...i,
        open: Number(i.open),
        high: Number(i.high),
        low: Number(i.low),
        close: Number(i.close),
        volume: Number(i.volume)
      };
    });

    return data;
  } catch (e) {
    console.error("GetTokenChartPrice", e);
    return [];
  }
};

ADLChart.args = {
  theme: "dark",
  currentPair: DATA_PAIRS[0],
  pairsChart: DATA_PAIRS,
  setChartTimeFrame: (resolution) => {
    console.log({ resolutionUpdate: resolution });
  },

  baseUrl: "https://backend-release.agents.land",

  // Custom period configuration
  customPeriodConfig: {
    defaultCountBack: 1000,
    maxCountBack: 3000,
    minTimeRange: 24 * 60 * 60, // 1 day
    maxTimeRange: 365 * 24 * 60 * 60, // 1 year
    customResolutions: {
      "1": { countBack: 1500, timeRange: 10 * 24 * 60 * 60 }, // 1m: 1500 bars, 10 days
      "5": { countBack: 1200, timeRange: 20 * 24 * 60 * 60 }, // 5m: 1200 bars, 20 days
      "15": { countBack: 800, timeRange: 40 * 24 * 60 * 60 }, // 15m: 800 bars, 40 days
      "60": { countBack: 600, timeRange: 90 * 24 * 60 * 60 }, // 1h: 600 bars, 90 days
      "1440": { countBack: 300, timeRange: 365 * 24 * 60 * 60 } // 1d: 300 bars, 1 year
    }
  },
  customExchangeName: "ADL",

  // Custom time frames
  customTimeFrames: null,
  fetchDataChart,

  socketConfig: {
    eventName: "updateOhlcv",
    socketType: "socketio",
    socketUrl: "https://backend-release.agents.land",
    pairMapping: DATA_PAIRS,
    reconnectInterval: 3000,
    retryOnError: false,
    reconnectAttempts: 5,
    socketIOOptions: {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      reconnectionDelayMax: 5000
    }
  }
};

// fetchDataChart: async (prams: { pair: string; startTime: number; endTime: number; tf: number }): Promise<Bar[]> => {
//   const { pair, startTime, endTime, tf } = prams;
//   console.log("params ADL", prams);

//   if (tf === 300) {
//     // 5 minutes
//     console.log("Handling 5 minute timeframe");
//     return [
//       {
//         open: 0.0000001764,
//         high: 0.0000001764,
//         low: 0.0000001764,
//         close: 0.0000001764,
//         volume: 21.484603799999974,
//         time: 1755764700
//       },
//       {
//         open: 0.0000001764,
//         high: 0.0000001299,
//         low: 0.0000001299,
//         close: 0.0000001299,
//         volume: 15.82385410362631,
//         time: 1755765000
//       },
//       {
//         open: 0.0000001299,
//         high: 0.0000004868,
//         low: 0.0000001385,
//         close: 0.0000004015,
//         volume: 467.1363022425914,
//         time: 1755771000
//       },
//       {
//         open: 0.0000004015,
//         high: 0.0000003363,
//         low: 0.0000001887,
//         close: 0.0000002461,
//         volume: 94.04308292588681,
//         time: 1755771300
//       }
//     ];
//   }

//   console.log("Using default data for timeframe:", tf);
//   return [
//     {
//       open: 0.0000001764,
//       high: 0.0000001764,
//       low: 0.0000001764,
//       close: 0.0000001764,
//       volume: 2100000000000.484603799999974,
//       time: 1755764940
//     },
//     {
//       open: 0.0000001764,
//       high: 0.0000001299,
//       low: 0.0000001299,
//       close: 0.0000001299,
//       volume: 15.82385410362631,
//       time: 1755765060
//     },
//     {
//       open: 0.0000001299,
//       high: 0.0000002107,
//       low: 0.0000001385,
//       close: 0.0000001866,
//       volume: 47.50443799379911,
//       time: 1755771000
//     },
//     {
//       open: 0.0000001866,
//       high: 0.0000002354,
//       low: 0.0000001672,
//       close: 0.0000001976,
//       volume: 79.48632810005907,
//       time: 1755771060
//     },
//     {
//       open: 0.0000001976,
//       high: 0.0000002465,
//       low: 0.0000001785,
//       close: 0.0000002113,
//       volume: 42.73754986507767,
//       time: 1755771120
//     },
//     {
//       open: 0.0000002113,
//       high: 0.000000285,
//       low: 0.0000002182,
//       close: 0.0000002667,
//       volume: 106.67999860517273,
//       time: 1755771180
//     },
//     {
//       open: 0.0000002667,
//       high: 0.0000004868,
//       low: 0.0000002319,
//       close: 0.0000004015,
//       volume: 190.7279876784828,
//       time: 1755771240
//     },
//     {
//       open: 0.0000004015,
//       high: 0.0000003363,
//       low: 0.0000002154,
//       close: 0.0000002154,
//       volume: 48.394105519939586,
//       time: 1755771300
//     },
//     {
//       open: 0.0000002154,
//       high: 0.0000002728,
//       low: 0.0000001887,
//       close: 0.0000002461,
//       volume: 45.64897740594722,
//       time: 1755771360
//     }
//   ];
// },
