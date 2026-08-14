import React from 'react';

export default function HealthRadar({ healthScore }) {
  const {
    score = 100,
    style_score = 100,
    bug_score = 100,
    security_score = 100,
    performance_score = 100,
  } = healthScore || {};

  // 5 axes: [Security, Logic, Performance, Style, Architecture]
  const axes = [
    { label: 'Security', value: security_score },
    { label: 'Logic', value: bug_score },
    { label: 'Performance', value: performance_score },
    { label: 'Style/PEP8', value: style_score },
    { label: 'Architecture', value: score },
  ];

  const size = 180;
  const center = size / 2;
  const radius = center - 30;
  const totalAxes = axes.length;
  const angleSlice = (Math.PI * 2) / totalAxes;

  // Convert (angle, val 0-100) to (x, y)
  const getCoordinates = (index, value) => {
    const angle = angleSlice * index - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Polygon points
  const points = axes.map((a, i) => {
    const { x, y } = getCoordinates(i, a.value);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Grid Circles */}
        {[0.25, 0.5, 0.75, 1].map((level, idx) => (
          <polygon
            key={idx}
            points={axes.map((_, i) => {
              const { x, y } = getCoordinates(i, level * 100);
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="currentColor"
            className="text-slate-800/80 stroke-1"
          />
        ))}

        {/* Axis Lines */}
        {axes.map((_, i) => {
          const { x, y } = getCoordinates(i, 100);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="currentColor"
              className="text-slate-800 stroke-1"
            />
          );
        })}

        {/* Value Polygon */}
        <polygon
          points={points}
          fill="rgba(99, 102, 241, 0.25)"
          stroke="#6366f1"
          strokeWidth="2"
          className="transition-all duration-500"
        />

        {/* Value Points & Labels */}
        {axes.map((axis, i) => {
          const { x, y } = getCoordinates(i, axis.value);
          const labelCoord = getCoordinates(i, 122);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="3" fill="#818cf8" />
              <text
                x={labelCoord.x}
                y={labelCoord.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[9px] font-mono fill-slate-400 font-semibold"
              >
                {axis.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="text-[10px] font-mono text-slate-500 mt-2">5-Axis Health Radar</div>
    </div>
  );
}
