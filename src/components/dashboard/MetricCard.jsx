import React from 'react';
import './MetricCard.css';

export function MetricCard({ title, value, subtitle, trend, trendValue, icon }) {
  const isPositive = trend === 'up';

  return (
    <div className="metric-card glass-panel">
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        <div className="metric-icon">{icon}</div>
      </div>
      <div className="metric-content">
        <h2 className="metric-value">{value}</h2>
        {trendValue && (
          <div className="metric-trend-container">
            <span className={`trend-badge ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? '↑' : '↓'} {trendValue}
            </span>
            <span className="metric-subtitle">{subtitle}</span>
          </div>
        )}
        {!trendValue && subtitle && (
          <div className="metric-trend-container">
            <span className="metric-subtitle">{subtitle}</span>
          </div>
        )}
      </div>
    </div>
  );
}
