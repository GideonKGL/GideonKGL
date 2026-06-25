import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ReportMetric } from "@shared/types";
import { compactNumber } from "@renderer/utils/format";

interface MetricCardProps {
  metric: ReportMetric;
}

export function MetricCard({ metric }: MetricCardProps) {
  const isPositive = metric.trend >= 0;
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <article className="metric-card">
      <span>{metric.label}</span>
      <strong>
        {compactNumber(metric.value)}
        {metric.unit ? <small>{metric.unit}</small> : null}
      </strong>
      <em className={isPositive ? "trend-positive" : "trend-negative"}>
        <TrendIcon size={15} />
        {Math.abs(metric.trend)}%
      </em>
    </article>
  );
}
