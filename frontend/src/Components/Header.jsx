const Header = ({ user, page, onNavigate, onLogout }) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md text-white py-4 px-6 fixed top-0 left-0 w-full z-50 border-b border-slate-800 shadow-xl">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Logo and Home Redirection */}
        <button
          onClick={() => onNavigate(user ? "dashboard" : "landing")}
          className="text-2xl font-black tracking-tight text-blue-400 flex items-center gap-2 cursor-pointer focus:outline-none"
        >
          <span>🔗</span>
          <span>LinkShort</span>
        </button>

        {/* Authentication Options / User State */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* User Dashboard / Navigation Greeting */}
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Logged in as <strong className="text-slate-100">{user.username}</strong></span>
              </div>
              
              {page === "analytics" && (
                <button
                  onClick={() => onNavigate("dashboard")}
                  className="bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold px-4 py-2 rounded-xl border border-slate-800 cursor-pointer transition-all"
                >
                  Dashboard
                </button>
              )}

              <button
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              {/* Login / Register Buttons */}
              <button
                onClick={() => onNavigate("login")}
                className="text-slate-400 hover:text-white text-xs font-semibold px-3 py-2 cursor-pointer transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate("register")}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/25 cursor-pointer transition-all"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
