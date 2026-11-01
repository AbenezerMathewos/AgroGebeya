import { useState, useMemo } from 'react';

export default function PriceSparkline({
  basePrice = 5000,
  trend = 'rising',
  height = 42,
  width = 130,
  showBadge = true,
  unit = 'ETB',
}) {
  const [hoverIndex, setHoverIndex] = useState(null);

  // Generate 14 deterministic data points based on basePrice and trend
  const dataPoints = useMemo(() => {
    const points = [];
    const variance = basePrice * 0.08;
    const trendFactor = trend === 'rising' ? 1.07 : trend === 'falling' ? 0.93 : 1.01;

    for (let i = 0; i < 12; i++) {
      const progress = i / 11;
      const noise = Math.sin(i * 1.8) * variance * 0.45;
      const trendOffset = (progress * (trendFactor - 1)) * basePrice;
      const val = Math.round(basePrice * (trend === 'rising' ? 0.94 : 1.06) + trendOffset + noise);
      points.push(val);
    }
    return points;
  }, [basePrice, trend]);

  const min = Math.min(...dataPoints);
  const max = Math.max(...dataPoints);
  const range = max - min || 1;

  const startVal = dataPoints[0];
  const endVal = dataPoints[dataPoints.length - 1];
  const percentChange = (((endVal - startVal) / startVal) * 100).toFixed(1);
  const isPositive = endVal >= startVal;

  // Build SVG points
  const padding = 4;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  const coordinates = dataPoints.map((val, i) => {
    const x = padding + (i / (dataPoints.length - 1)) * graphWidth;
    const y = height - padding - ((val - min) / range) * graphHeight;
    return { x, y, val };
  });

  const pathD = coordinates.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${coordinates[coordinates.length - 1].x},${height} L ${coordinates[0].x},${height} Z`;

  const strokeColor = isPositive ? '#10b981' : '#ef4444';
  const fillColor = isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';

  return (
    <div className="sparkline-wrapper">
      <div className="sparkline-container" style={{ width: `${width}px`, height: `${height}px` }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="sparkline-svg"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={`sparkGrad-${isPositive ? 'pos' : 'neg'}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isPositive ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'} />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {/* Area Fill */}
          <path d={areaD} fill={`url(#sparkGrad-${isPositive ? 'pos' : 'neg'})`} />

          {/* Sparkline Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Hover Circles */}
          {coordinates.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r={hoverIndex === idx ? 4 : 2}
              fill={hoverIndex === idx ? '#ffffff' : strokeColor}
              stroke={strokeColor}
              strokeWidth={hoverIndex === idx ? 2 : 0}
              className="spark-point"
              onMouseEnter={() => setHoverIndex(idx)}
            />
          ))}
        </svg>

        {/* Hover Floating Tooltip */}
        {hoverIndex !== null && (
          <div
            className="spark-tooltip"
            style={{
              left: `${coordinates[hoverIndex].x}px`,
              top: `${Math.max(0, coordinates[hoverIndex].y - 24)}px`,
            }}
          >
            {coordinates[hoverIndex].val.toLocaleString()} {unit}
          </div>
        )}
      </div>

      {showBadge && (
        <span className={`spark-change-badge ${isPositive ? 'pos' : 'neg'}`}>
          {isPositive ? '▲ +' : '▼ '}
          {percentChange}% (30d)
        </span>
      )}
    </div>
  );
}
