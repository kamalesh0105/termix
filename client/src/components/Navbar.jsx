import { React, useState } from "react";

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  return (
    <nav className="border-b border-gray-950/5 dark:border-white/10 w-full fixed top-0 z-50 bg-[#0c0c1c]">
      <div className="h-14 flex justify-between gap-8 px-2 lg:px-4 md:px-3 items-center">
        <div className="flex items-center mx-5">
          <a href="/">
            <img src="vite.svg" alt="React Logo" />
          </a>
          <h1 className="text-xl dark:text-white">Termix</h1>
        </div>
        <div className="[&>a]:px-3 [&>a]:py-1 [&>a]:rounded-md [&>a]:bg-gray-900 space-x-2">
          <a href="/">Home</a>
          <a href="/dashboard">DashBoard</a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
