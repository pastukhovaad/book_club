import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NavBar from "./NavBar";
import { useTheme } from "@/context/ThemeContext";

const AppLayout = () => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <div>
      <main className="min-h-screen w-full bg-[#ffffff] dark:bg-[#181A2A]">
        <NavBar
          darkMode={darkMode}
          handleDarkMode={toggleDarkMode}
        />
        <ToastContainer />
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
              Загрузка...
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};

export default AppLayout;
