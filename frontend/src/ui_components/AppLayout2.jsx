import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import Footer from "./Footer";  Make Footer2 and use it if a Footer is needed
import NavBar2 from "./NavBar2";
import { useTheme } from "@/context/ThemeContext";

const AppLayout2 = ({ isAuthenticated, username, setIsAuthenticated, setUsername }) => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <div>
      <main className="w-full bg-[#ffffff] dark:bg-[#181A2A]">
        <NavBar2
          darkMode={darkMode}
          handleDarkMode={toggleDarkMode}
          isAuthenticated={isAuthenticated}
          username={username}
          setIsAuthenticated={setIsAuthenticated}
          setUsername={setUsername}
        />
        <ToastContainer />
        <Outlet />
        {/* <Footer /> */}
      </main>
    </div>
  );
};

export default AppLayout2;
