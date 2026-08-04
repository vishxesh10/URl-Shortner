import { useState, useEffect } from "react";

const AnalyticsView = ({ token, shortCode, onBack, API_BASE }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/analytics/${shortCode}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const json = await res.json();
        
        if (res.ok) {
          setData(json);
        } else {
          setError(json.detail || "Failed to load analytics.");
        }
      } catch (err) {
        setError("Network error. Failed to load click analytics.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [shortCode, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center pt-20">
        <span className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
        <p className="text-slate-400 text-sm mt-4">Analyzing link redirect logs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 pt-24 max-w-4xl mx-auto text-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl mb-6">
          <p className="text-lg font-semibold mb-2">Error Loading Analytics</p>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={onBack}
          className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-6 py-2.5 rounded-xl cursor-pointer transition-all"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  // Aggregate stats
  const { total_clicks, created_at, expires_at, clicks_over_time, referrers, browsers, os_distribution, clicks } = data;

  // Chart computations (SVG Clicks Over Time)
  const chartDates = Object.keys(clicks_over_time);
  const chartClicks = Object.values(clicks_over_time);
  const maxClicks = Math.max(...chartClicks, 5); // Fallback to 5 to avoid flat chart

  const svgWidth = 800;
  const svgHeight = 250;
  const padding = 40;

  // Compute SVG Points
  let pointsStr = "";
  let filledPointsStr = ``;
  const pointsList = [];

  if (chartDates.length > 1) {
    chartDates.forEach((date, i) => {
      const x = padding + (i * (svgWidth - padding * 2)) / (chartDates.length - 1);
      const val = clicks_over_time[date];
      const y = svgHeight - padding - (val * (svgHeight - padding * 2)) / maxClicks;
      pointsList.push({ x, y, val, date });
    });
    pointsStr = pointsList.map(p => `${p.x},${p.y}`).join(" ");
    filledPointsStr = `${padding},${svgHeight - padding} ` + pointsStr + ` ${svgWidth - padding},${svgHeight - padding}`;
  } else if (chartDates.length === 1) {
    // Single point edge case
    const x = svgWidth / 2;
    const val = chartClicks[0];
    const y = svgHeight - padding - (val * (svgHeight - padding * 2)) / maxClicks;
    pointsList.push({ x, y, val, date: chartDates[0] });
    pointsStr = `${padding},${y} ${svgWidth - padding},${y}`;
    filledPointsStr = `${padding},${svgHeight - padding} ${padding},${y} ${svgWidth - padding},${y} ${svgWidth - padding},${svgHeight - padding}`;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 pt-24 max-w-6xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <button
            onClick={onBack}
            className="text-sm font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 cursor-pointer focus:outline-none mb-3"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Analytics for <span className="text-blue-400">/{shortCode}</span>
          </h1>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-400 self-start">
          <span className="font-semibold text-slate-300">Created:</span> {new Date(created_at).toLocaleString()}
          {expires_at && (
            <span className="block mt-1">
              <span className="font-semibold text-slate-300">Expires:</span> {new Date(expires_at).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Main Stats Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md">
        <div>
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Click Redirects</p>
          <h3 className="text-5xl font-black mt-1 text-blue-400">{total_clicks}</h3>
        </div>
        <div className="flex-1 max-w-xl text-slate-400 text-sm bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
          <p className="font-semibold text-slate-300 mb-1">Destination URL:</p>
          <a
            href={clicks.length > 0 ? "redirect" : "#"}
            className="text-blue-400 hover:underline break-all"
            target="_blank"
            rel="noreferrer"
          >
            {clicks.length > 0 ? "Target Link Active" : "No redirect logs recorded yet."}
          </a>
        </div>
      </div>

      {/* SVG Click Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl mb-8">
        <h3 className="text-xl font-bold tracking-tight mb-6">Click History (Over Time)</h3>
        
        {chartDates.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
            No redirection click history available yet.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full min-w-[700px] h-auto overflow-visible"
            >
              {/* Grid Lines */}
              <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="#334155" strokeWidth="0.5" strokeDasharray="3" />
              <line x1={padding} y1={svgHeight / 2} x2={svgWidth - padding} y2={svgHeight / 2} stroke="#334155" strokeWidth="0.5" strokeDasharray="3" />
              <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#475569" strokeWidth="1" />

              {/* Area under the line */}
              {filledPointsStr && (
                <polygon
                  points={filledPointsStr}
                  fill="url(#chartGrad)"
                  opacity="0.15"
                />
              )}

              {/* Line Plot */}
              {pointsStr && (
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={pointsStr}
                />
              )}

              {/* Points circles and labels */}
              {pointsList.map((p, i) => (
                <g key={i} className="group">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="5"
                    fill="#3b82f6"
                    stroke="#0f172a"
                    strokeWidth="2.5"
                  />
                  {/* Tooltip on hover */}
                  <rect
                    x={p.x - 20}
                    y={p.y - 32}
                    width="40"
                    height="20"
                    rx="4"
                    fill="#1e293b"
                    stroke="#475569"
                    strokeWidth="0.5"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  />
                  <text
                    x={p.x}
                    y={p.y - 18}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="bold"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    {p.val}
                  </text>
                  
                  {/* X Axis labels */}
                  <text
                    x={p.x}
                    y={svgHeight - padding + 20}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9"
                    fontWeight="medium"
                  >
                    {p.date.substring(5)} {/* MM-DD */}
                  </text>
                </g>
              ))}

              {/* Gradients */}
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        )}
      </div>

      {/* Detail Aggregates (Referrers, Browsers, OS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        
        {/* Referrers Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>🌐</span> Referrers
          </h4>
          {Object.keys(referrers).length === 0 ? (
            <p className="text-slate-500 text-sm py-6">No referrer data collected.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(referrers).map(([ref, count]) => {
                const percentage = total_clicks > 0 ? (count / total_clicks) * 100 : 0;
                return (
                  <div key={ref}>
                    <div className="flex justify-between text-xs font-semibold mb-1 text-slate-300">
                      <span>{ref}</span>
                      <span>{count} click{count !== 1 ? "s" : ""} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Browsers Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>💻</span> Browsers
          </h4>
          {Object.keys(browsers).length === 0 ? (
            <p className="text-slate-500 text-sm py-6">No browser data collected.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(browsers).map(([browser, count]) => {
                const percentage = total_clicks > 0 ? (count / total_clicks) * 100 : 0;
                return (
                  <div key={browser}>
                    <div className="flex justify-between text-xs font-semibold mb-1 text-slate-300">
                      <span>{browser}</span>
                      <span>{count} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* OS Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>📱</span> Operating Systems
          </h4>
          {Object.keys(os_distribution).length === 0 ? (
            <p className="text-slate-500 text-sm py-6">No OS data collected.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(os_distribution).map(([os, count]) => {
                const percentage = total_clicks > 0 ? (count / total_clicks) * 100 : 0;
                return (
                  <div key={os}>
                    <div className="flex justify-between text-xs font-semibold mb-1 text-slate-300">
                      <span>{os}</span>
                      <span>{count} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Raw click log table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h4 className="text-xl font-bold tracking-tight mb-4">Click Redirect Logs (Recent 100)</h4>
        {clicks.length === 0 ? (
          <p className="text-slate-500 text-sm py-6 text-center">No redirection click logs recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px] text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Browser</th>
                  <th className="py-3 px-4">OS</th>
                  <th className="py-3 px-4">Referrer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {clicks.map((click, i) => (
                  <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4 font-mono">
                      {new Date(click.clicked_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-blue-400">
                      {click.ip_address || "Unknown"}
                    </td>
                    <td className="py-3 px-4">{click.browser || "Unknown"}</td>
                    <td className="py-3 px-4">{click.os || "Unknown"}</td>
                    <td className="py-3 px-4 truncate max-w-xs" title={click.referrer}>
                      {click.referrer || "Direct"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default AnalyticsView;
