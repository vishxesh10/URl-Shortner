import { useState } from "react";

const Content = ({ onNavigateToAuth, API_BASE }) => {
  const [originalUrl, setOriginalUrl] = useState("");
  const [sessionUrls, setSessionUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Copy state per code
  const [copiedCode, setCopiedCode] = useState("");

  const handleShorten = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!originalUrl) {
      setError("Please enter a valid URL.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/urls/shorten`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ original_url: originalUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to shorten URL.");
      }

      setSuccess(`Link shortened!`);
      // Add to session list (top of array)
      setSessionUrls([data, ...sessionUrls]);
      setOriginalUrl("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, code) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center pt-28 max-w-4xl mx-auto">
      
      {/* Hero Section */}
      <div className="text-center mb-10 max-w-2xl">
        <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-4">
          Shorten Your Links, <span className="text-blue-500">Track Analytics.</span>
        </h2>
        <p className="text-slate-400 text-base md:text-lg">
          Create clean, concise redirection links in seconds. Sign up to customize URLs, set expiration dates, and monitor traffic logs.
        </p>
      </div>

      {/* Input Box Card */}
      <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm px-4 py-3 rounded-xl">
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleShorten} className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            required
            placeholder="Paste your long link here..."
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700/60 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-md hover:shadow-blue-600/35 hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center min-w-[140px]"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              "Shorten Link"
            )}
          </button>
        </form>
      </div>

      {/* Session shortened Links Table */}
      {sessionUrls.length > 0 && (
        <div className="w-full mt-10 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-x-auto">
          <h2 className="text-xl font-bold text-slate-200 mb-4 tracking-tight">
            Shortened in this Session
          </h2>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Original URL</th>
                <th className="py-3 px-4 font-semibold">Short Code</th>
                <th className="py-3 px-4 font-semibold text-right">Short URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {sessionUrls.map((item) => (
                <tr
                  key={item.short_code}
                  className="hover:bg-slate-800/20 transition-colors"
                >
                  <td className="py-3.5 px-4 text-xs text-slate-300 max-w-xs truncate">
                    {item.original_url}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                    <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-[10px] text-blue-400 font-semibold">
                      {item.short_code}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={item.short_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        {item.short_url}
                      </a>
                      <button
                        onClick={() => copyToClipboard(item.short_url, item.short_code)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-2 py-1 rounded border border-slate-700 text-[10px] cursor-pointer font-medium"
                      >
                        {copiedCode === item.short_code ? "Copied! ✅" : "Copy 📋"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Content;
