import { PeriodParams } from "../charting_library";

export interface CustomPeriodConfig {
  defaultCountBack?: number;
  maxCountBack?: number;
  minTimeRange?: number; // in seconds
  maxTimeRange?: number; // in seconds
  customResolutions?: Record<
    string,
    {
      countBack: number;
      timeRange: number;
    }
  >;
}

export const useCustomPeriodParams = (config: CustomPeriodConfig = {}) => {
  const {
    defaultCountBack = 500,
    maxCountBack = 2000,
    minTimeRange = 24 * 60 * 60, // 1 day
    maxTimeRange = 365 * 24 * 60 * 60, // 1 year
    customResolutions = {}
  } = config;

  const customizePeriodParams = (originalParams: PeriodParams, resolution: string): PeriodParams => {
    const now = Math.floor(Date.now() / 1000);
    const customConfig = customResolutions[resolution];

    let countBack = originalParams.countBack;
    let from = originalParams.from;
    let to = originalParams.to;

    console.debug("[useCustomPeriodParams] Original params:", {
      resolution,
      originalParams,
      customConfig,
      now,
      hasCustomConfig: !!customConfig
    });

    // Apply custom resolution config only if resolution is valid and config exists
    if (customConfig && customConfig.countBack > 0 && customConfig.timeRange > 0) {
      //   console.log("[useCustomPeriodParams] Applying custom config for resolution:", resolution);
      countBack = customConfig.countBack;
      if (originalParams.firstDataRequest) {
        from = now - customConfig.timeRange;
        to = now;
        // console.log("[useCustomPeriodParams] First data request - using custom time range:", {
        //   from: new Date(from * 1000),
        //   to: new Date(to * 1000),
        //   timeRange: customConfig.timeRange
        // });
      }
    } else {
      console.log("[useCustomPeriodParams] No custom config for resolution:", resolution);
    }

    // Apply global limits
    countBack = Math.min(countBack, maxCountBack);
    countBack = Math.max(countBack, 1);

    // Ensure time range is within limits
    const timeRange = to - from;
    if (timeRange < minTimeRange) {
      from = to - minTimeRange;
      console.log("[useCustomPeriodParams] Time range too small, adjusted from:", new Date(from * 1000));
    }
    if (timeRange > maxTimeRange) {
      from = to - maxTimeRange;
      console.log("[useCustomPeriodParams] Time range too large, adjusted from:", new Date(from * 1000));
    }

    const result = {
      ...originalParams,
      countBack,
      from,
      to
    };

    console.log("[useCustomPeriodParams] Final result:", {
      resolution,
      result,
      timeRange: result.to - result.from
    });
    return result;
  };

  return {
    customizePeriodParams
  };
};
