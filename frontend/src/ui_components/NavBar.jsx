import { Switch } from "@/components/ui/switch";
import { FaHamburger } from "react-icons/fa";
import ResponsiveNavBar from "./ResponsiveNavBar";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

const NavBar = ({
  darkMode,
  handleDarkMode,
  isAuthenticated,
  username,
  setIsAuthenticated,
  setUsername,
}) => {
  const [showNavBar, setShowNavBar] = useState(false);

  function logout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setIsAuthenticated(false);
    setUsername(null);
  }

  return (
    <>
      <nav className="max-container padding-x py-6 flex justify-between items-center  gap-6 sticky top-0 z-10 bg-[#FFFFFF] dark:bg-[#141624]">
        <Link to="/" className="text-[#141624] text-2xl dark:text-[#FFFFFF]">
          Book sharing
        </Link>
        <ul className="flex items-center  justify-end gap-9 text-[#3B3C4A] lg:flex-1 max-md:hidden dark:text-[#FFFFFF]">
          {isAuthenticated ? (
            <>
              <li><NavLink
                  to={`/profile/${username}`}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Привет, {username}
                </NavLink></li>
              <li><NavLink
                  to={`/notifications`}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Уведомления
                </NavLink></li>
              <li onClick={logout} className="cursor-pointer">
                Выйти
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink
                  to="/signin"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Войти
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/signup"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Зарегистрироваться
                </NavLink>
              </li>
            </>
          )}

          <li>
            {/* className="font-semibold" */}
            <NavLink
              to="/groups"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Группы
            </NavLink>
          </li>

          <li>
            {/* className="font-semibold" */}
            <NavLink
              to="/books"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Книги
            </NavLink>
          </li>

          <li>
            {/* className="font-semibold" */}
            <NavLink
              to="/create_book"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Создать книгу
            </NavLink>
          </li>
        </ul>

        <Switch onCheckedChange={handleDarkMode} checked={darkMode} />
        <FaHamburger
          className="text-2xl cursor-pointer hidden max-md:block dark:text-white"
          onClick={() => setShowNavBar((curr) => !curr)}
        />
      </nav>

      {showNavBar && (
        <ResponsiveNavBar
          isAuthenticated={isAuthenticated}
          username={username}
          logout={logout}
        />
      )}
    </>
  );
};

export default NavBar;
