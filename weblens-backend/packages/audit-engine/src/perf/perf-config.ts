export interface PerfEngineConfig {
  titleMinLength: number;
  // Các config khác sẽ thêm dần theo rules
}

export const DEFAULT_PERF_CONFIG: PerfEngineConfig = {
  titleMinLength: 30,
};
