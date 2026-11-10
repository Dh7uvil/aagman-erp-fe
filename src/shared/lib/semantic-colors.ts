/** Semantic CSS colors for charts (success = green, warning = amber, etc.). */
export const SEMANTIC_CHART = {
  primary: "var(--chart-1)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--destructive)",
  info: "var(--info)",
  neutral: "var(--chart-5)",
} as const;

/** Distinct hues for multi-series charts; excludes danger red except for error semantics. */
export const CATEGORICAL_CHART_COLORS = [
  SEMANTIC_CHART.primary,
  "var(--chart-2)",
  SEMANTIC_CHART.warning,
  SEMANTIC_CHART.info,
  SEMANTIC_CHART.neutral,
] as const;
