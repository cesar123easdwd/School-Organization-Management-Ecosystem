import React from 'react';

/**
 * StatCard — reusable metric card for dashboard KPI tiles.
 *
 * Props:
 *  icon        {string}  – emoji icon
 *  iconBg      {string}  – CSS background for icon wrapper
 *  glowColor   {string}  – CSS color for glow blob behind icon
 *  label       {string}  – metric name
 *  value       {string}  – formatted metric value
 *  desc        {string}  – optional helper text below label
 *  trend       {string}  – optional trend label (e.g. "↑ 0%")
 *  trendColor  {string}  – CSS class modifier: "neutral" | "up" | "down"
 *  delay       {number}  – animation delay index (1–6)
 */
const StatCard = ({
  icon = '📌',
  iconBg = 'rgba(127,20,22,0.12)',
  glowColor = 'rgba(127,20,22,0.32)',
  label = 'Metric',
  value = '0',
  desc = '',
  trend = '— No change',
  trendColor = 'neutral',
  delay = 1,
}) => {
  return (
    <div className={`stat-card fade-in-up delay-${delay}`} role="region" aria-label={label}>
      {/* Background glow blob */}
      <div
        className="stat-card-glow"
        style={{ background: glowColor }}
        aria-hidden="true"
      />

      {/* Card header: icon + trend */}
      <div className="stat-header">
        <div className="stat-icon-wrap" style={{ background: iconBg }} aria-hidden="true">
          {icon}
        </div>
        <div className={`stat-trend ${trendColor}`} aria-label={`Trend: ${trend}`}>
          {trend}
        </div>
      </div>

      {/* Metric value */}
      <div className="stat-value" aria-live="polite">{value}</div>

      {/* Label & description */}
      <div className="stat-label">{label}</div>
      {desc && <div className="stat-desc">{desc}</div>}
    </div>
  );
};

export default StatCard;
