import { Meta, StoryObj } from "@storybook/react";
import React from "react";
import TVChartContainer, { TVChartContainerProsp } from "./TVChartContainer";
import { Bar } from "./helpers/types";

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

  fetchDataChart: async (prams: { pair: string; startTime: number; endTime: number; tf: number }): Promise<Bar[]> => {
    const { pair, startTime, endTime, tf } = prams;
    console.log("params ADL", prams);

    if (tf === 300) {
      // 5 minutes
      console.log("Handling 5 minute timeframe");
      return [
        {
          open: 0.0000001764,
          high: 0.0000001764,
          low: 0.0000001764,
          close: 0.0000001764,
          volume: 21.484603799999974,
          time: 1755764700
        },
        {
          open: 0.0000001764,
          high: 0.0000001299,
          low: 0.0000001299,
          close: 0.0000001299,
          volume: 15.82385410362631,
          time: 1755765000
        },
        {
          open: 0.0000001299,
          high: 0.0000004868,
          low: 0.0000001385,
          close: 0.0000004015,
          volume: 467.1363022425914,
          time: 1755771000
        },
        {
          open: 0.0000004015,
          high: 0.0000003363,
          low: 0.0000001887,
          close: 0.0000002461,
          volume: 94.04308292588681,
          time: 1755771300
        }
      ];
    }

    console.log("Using default data for timeframe:", tf);
    return [
      {
        open: 0.0000001764,
        high: 0.0000001764,
        low: 0.0000001764,
        close: 0.0000001764,
        volume: 2100000000000.484603799999974,
        time: 1755764940
      },
      {
        open: 0.0000001764,
        high: 0.0000001299,
        low: 0.0000001299,
        close: 0.0000001299,
        volume: 15.82385410362631,
        time: 1755765060
      },
      {
        open: 0.0000001299,
        high: 0.0000002107,
        low: 0.0000001385,
        close: 0.0000001866,
        volume: 47.50443799379911,
        time: 1755771000
      },
      {
        open: 0.0000001866,
        high: 0.0000002354,
        low: 0.0000001672,
        close: 0.0000001976,
        volume: 79.48632810005907,
        time: 1755771060
      },
      {
        open: 0.0000001976,
        high: 0.0000002465,
        low: 0.0000001785,
        close: 0.0000002113,
        volume: 42.73754986507767,
        time: 1755771120
      },
      {
        open: 0.0000002113,
        high: 0.000000285,
        low: 0.0000002182,
        close: 0.0000002667,
        volume: 106.67999860517273,
        time: 1755771180
      },
      {
        open: 0.0000002667,
        high: 0.0000004868,
        low: 0.0000002319,
        close: 0.0000004015,
        volume: 190.7279876784828,
        time: 1755771240
      },
      {
        open: 0.0000004015,
        high: 0.0000003363,
        low: 0.0000002154,
        close: 0.0000002154,
        volume: 48.394105519939586,
        time: 1755771300
      },
      {
        open: 0.0000002154,
        high: 0.0000002728,
        low: 0.0000001887,
        close: 0.0000002461,
        volume: 45.64897740594722,
        time: 1755771360
      }
    ];
  }

  // socketConfig: {
  //   wsUrl: BASE_SOCKET_URL.ORDERBOOK_STAGING
  // }
};

// export const BtcUsdtODTChart: Story = (args: TVChartContainerProsp) => (
//   <div style={{ height: "80vh" }}>
//     <TVChartContainer {...args} />;
//   </div>
// );
// BtcUsdtODTChart.args = {
//   theme: "dark",
//   currentPair: {
//     symbol: "BTC/USDT",
//     info: "orai10g6frpysmdgw5tdqke47als6f97aqmr8s3cljsvjce4n5enjftcqtamzsd - orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh"
//   },
//   pairsChart: [
//     {
//       symbol: "BTC/USDT",
//       info: "orai10g6frpysmdgw5tdqke47als6f97aqmr8s3cljsvjce4n5enjftcqtamzsd-orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh"
//     }
//   ],
//   setChartTimeFrame: (resolution) => {
//     console.log({ resolutionUpdate: resolution });
//   },

//   baseUrl: BASE_API_URL.ORDERBOOK_STAGING,

//   fetchDataChart: async (prams: { pair: string; startTime: number; endTime: number; tf: number }): Promise<Bar[]> => {
//     const { pair, startTime, endTime, tf } = prams;
//     console.log("params", prams);

//     try {
//       const res = await axios.get(BASE_API_URL.ORDERBOOK_STAGING + "/v1/candles/", {
//         params: {
//           pair: pair.split("-").join(" - "),
//           startTime: Math.round(startTime / 60),
//           endTime: Math.round(endTime / 60),
//           tf: tf / 60
//         }
//       });

//       return [...res.data].map((i) => {
//         if (i.high > 200) {
//           i.high = i.close + 1;
//           i.open = i.close + 0.5;
//         }

//         return i;
//       });
//     } catch (e) {
//       console.error("GetTokenChartPrice", e);
//       return [];
//     }
//   },
//   socketConfig: {
//     wsUrl: BASE_SOCKET_URL.ORDERBOOK_STAGING,
//     pairMapping: DATA_PAIRS
//   }
// };

// export const XOCHUsdtODTChart: Story = (args: TVChartContainerProsp) => (
//   <div style={{ height: "80vh" }}>
//     <TVChartContainer {...args} />;
//   </div>
// );
// XOCHUsdtODTChart.args = {
//   theme: "dark",
//   currentPair: {
//     symbol: "xOCH/USDT",
//     info: "orai1lplapmgqnelqn253stz6kmvm3ulgdaytn89a8mz9y85xq8wd684s6xl3lt - orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh"
//   },
//   pairsChart: [
//     {
//       symbol: "xOCH/USDT",
//       info: "orai1lplapmgqnelqn253stz6kmvm3ulgdaytn89a8mz9y85xq8wd684s6xl3lt-orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh"
//     }
//   ],
//   setChartTimeFrame: (resolution) => {
//     console.log({ resolutionUpdate: resolution });
//   },

//   baseUrl: BASE_API_URL.ORDERBOOK_STAGING,

//   fetchDataChart: async (prams: { pair: string; startTime: number; endTime: number; tf: number }): Promise<Bar[]> => {
//     const { pair, startTime, endTime, tf } = prams;
//     console.log("params", prams);

//     try {
//       const res = await axios.get(BASE_API_URL.ORDERBOOK_STAGING + "/v1/candles/", {
//         params: {
//           pair: pair.split("-").join(" - "),
//           startTime: Math.round(startTime / 60),
//           endTime: Math.round(endTime / 60),
//           tf: tf / 60
//         }
//       });

//       return [...res.data].map((i) => {
//         if (i.high > 200) {
//           i.high = i.close + 1;
//           i.open = i.close + 0.5;
//         }

//         return i;
//       });
//     } catch (e) {
//       console.error("GetTokenChartPrice", e);
//       return [];
//     }
//   },
//   socketConfig: {
//     wsUrl: BASE_SOCKET_URL.ORDERBOOK_STAGING,
//     pairMapping: DATA_PAIRS
//   }
// };
