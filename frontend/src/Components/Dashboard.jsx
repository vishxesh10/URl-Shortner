import { useState, useEffect } from "react";

const Dashboard = ({ token, onViewAnalytics, API_BASE }) => {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Shortener form state
  const [originalUrl, setOriginalUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Copy-state to show checkmark per short code
  const [copiedCode, setCopiedCode] = useState("");

  const fetchUrls = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/urls/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUrls(data);
      }
    } catch (err) {
      console.error("Error fetching URLs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUrls();
  }, [token]);

  const handleShorten = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSubmitLoading(true);

    if (!originalUrl) {
      setFormError("Please enter a valid URL.");
      setSubmitLoading(false);
      return;
    }

    try {
      const payload = {
        original_url: originalUrl,
      };

      if (customCode.trim()) {
        payload.custom_code = customCode.trim();
      }

      if (expiresAt) {
        // Convert to ISO string with timezone info
        payload.expires_at = new Date(expiresAt).toISOString();
      }

      const res = await fetch(`${API_BASE}/api/urls/shorten`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to shorten URL.");
      }

      setFormSuccess(`Successfully shortened to: ${data.short_url}`);
      setOriginalUrl("");
      setCustomCode("");
      setExpiresAt("");
      setShowAdvanced(false);
      
      // Refresh list
      fetchUrls();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (shortCode) => {
    if (!window.confirm("Are you sure you want to delete this short URL? All click statistics will be permanently removed.")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/urls/delete/${shortCode}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setUrls(urls.filter((url) => url.short_code !== shortCode));
      } else {
        const data = await res.json();
        alert(data.detail || "Failed to delete URL.");
      }
    } catch (err) {
      alert("An error occurred while deleting the URL.");
    }
  };

  const copyToClipboard = (text, code) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  // Computations
  const totalLinks = urls.length;
  const totalClicks = urls.reduce((sum, item) => sum + (item.click_count || 0), 0);
  
  const now = new Date();
  const activeLinks = urls.filter(item => {
    if (!item.expires_at) return true;
    return new Date(item.expires_at) > now;
  }).length;

  const filteredUrls = urls.filter((url) => {
    const s = search.toLowerCase();
    return (
      url.original_url.toLowerCase().includes(s) ||
      url.short_code.toLowerCase().includes(s)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 pt-24 max-w-6xl mx-auto">
      
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Links</p>
            <h3 className="text-4xl font-extrabold mt-1 text-white">{totalLinks}</h3>
          </div>
          <div className="bg-blue-500/10 text-blue-400 p-4 rounded-xl border border-blue-500/20 text-2xl">
            🔗
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Clicks</p>
            <h3 className="text-4xl font-extrabold mt-1 text-blue-400">{totalClicks}</h3>
          </div>
          <div className="bg-blue-500/10 text-blue-400 p-4 rounded-xl border border-blue-500/20 text-2xl">
            📈
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Active Links</p>
            <h3 className="text-4xl font-extrabold mt-1 text-emerald-400">{activeLinks}</h3>
          </div>
          <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-xl border border-emerald-500/20 text-2xl">
            ⚡
          </div>
        </div>
      </div>

      {/* URL Shortening Form Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-10">
        <h2 className="text-2xl font-bold mb-4 tracking-tight">Create Short Link</h2>
        
        {formError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
            ⚠️ {formError}
          </div>
        )}
        {formSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm px-4 py-3 rounded-xl mb-4">
            ✅ {formSuccess}
          </div>
        )}

        <form onSubmit={handleShorten} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              required
              placeholder="Paste your long destination URL..."
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700/60 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={submitLoading}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-md hover:shadow-blue-600/35 hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center min-w-[140px]"
            >
              {submitLoading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                "Shorten"
              )}
            </button>
          </div>

          {/* Toggle Advanced Options */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1 cursor-pointer focus:outline-none"
            >
              <span>{showAdvanced ? "▼" : "▶"}</span>
              <span>Advanced Options (Custom Alias & Expiry)</span>
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 animate-fadeIn">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Custom Alias (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. portfolio-2026"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Alphanumeric, dashes, underscores only (3-30 chars).</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Expiration Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Link will become invalid after this time.</p>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Database Results Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Your Shortened Links</h2>
          
          {/* Search Box */}
          <div className="relative max-w-sm w-full">
            <input
              type="text"
              placeholder="Search links..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute left-3 top-2.5 text-slate-500 text-sm">🔍</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <span className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
            <p className="text-slate-400 text-sm">Loading links...</p>
          </div>
        ) : filteredUrls.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            {search ? "No links match your search query." : "No links shortened yet. Paste a link above to get started!"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Original Destination</th>
                  <th className="py-3.5 px-4">Short Code</th>
                  <th className="py-3.5 px-4">Clicks</th>
                  <th className="py-3.5 px-4">Expiration Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredUrls.map((item) => {
                  const isExpired = item.expires_at && new Date(item.expires_at) < now;
                  return (
                    <tr
                      key={item.short_code}
                      className="hover:bg-slate-800/25 transition-colors group"
                    >
                      {/* Original Link */}
                      <td className="py-4 px-4 max-w-xs truncate">
                        <a
                          href={item.original_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-300 hover:text-blue-400 hover:underline text-sm font-medium block"
                          title={item.original_url}
                        >
                          {item.original_url}
                        </a>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Created {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Short URL / Code */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800/80 font-mono text-xs text-blue-400 font-semibold">
                            {item.short_code}
                          </span>
                          <button
                            onClick={() => copyToClipboard(item.short_url, item.short_code)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-[10px] cursor-pointer transition-all hover:scale-105"
                            title="Copy link"
                          >
                            {copiedCode === item.short_code ? "✅ Copied" : "📋 Copy"}
                          </button>
                        </div>
                      </td>

                      {/* Clicks */}
                      <td className="py-4 px-4 text-sm font-bold text-slate-200">
                        {item.click_count}
                      </td>

                      {/* Expiry Status */}
                      <td className="py-4 px-4">
                        {item.expires_at ? (
                          isExpired ? (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                              Expired
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              title={`Expires on ${new Date(item.expires_at).toLocaleString()}`}
                            >
                              Expires: {new Date(item.expires_at).toLocaleDateString()}
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-400 border border-slate-700/80">
                            Permanent
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onViewAnalytics(item.short_code)}
                            className="bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white px-3 py-1.5 rounded-lg border border-blue-500/20 hover:border-transparent text-xs font-semibold cursor-pointer transition-all"
                            title="View Analytics"
                          >
                            Stats 📈
                          </button>
                          <button
                            onClick={() => handleDelete(item.short_code)}
                            className="bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1.5 rounded-lg border border-red-500/20 hover:border-transparent text-xs font-semibold cursor-pointer transition-all"
                            title="Delete link"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
