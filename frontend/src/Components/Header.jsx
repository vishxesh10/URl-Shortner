const Header = () => {
  return (
    <header className="bg-slate-900 text-white py-6 px-4 shadow-lg border-b border-slate-800">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-blue-400">
          🔗 URL Shortener API
        </h1>
        <span className="bg-blue-500/10 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full border border-blue-500/20">
          v1.0
        </span>
      </div>
    </header>
  );
};

export default Header;
