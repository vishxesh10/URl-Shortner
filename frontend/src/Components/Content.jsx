import { useState, useEffect } from "react";

const Content = () => {
  const [urls, seturl] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/all")
      .then((res) => res.json())
      .then((data) => seturl(data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center pt-16">
      {/* Input Box Card */}
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Enter your long URL..."
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer">
          Shorten URL
        </button>
      </div>

      {/* Database Results Table */}
      <div className="w-full max-w-4xl mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl overflow-x-auto">
        <h2 className="text-xl font-bold text-slate-200 mb-4">
          Database Records
        </h2>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <th className="py-3 px-4">Original URL</th>
              <th className="py-3 px-4">Short Code</th>
              <th className="py-3 px-4">Short URL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {urls.map((item) => (
              <tr
                key={item.short_code}
                className="hover:bg-slate-800/40 transition-colors"
              >
                {/* Original URL Column */}
                <td className="py-3.5 px-4 text-xs text-slate-300 max-w-xs truncate">
                  {item.original_url}
                </td>

                {/* Short Code Column */}
                <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                  <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">
                    {item.short_code}
                  </span>
                </td>

                {/* Short URL Link Column */}
                <td className="py-3.5 px-4 text-xs font-semibold">
                  <a
                    href={item.short_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    {item.short_url}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Content;
