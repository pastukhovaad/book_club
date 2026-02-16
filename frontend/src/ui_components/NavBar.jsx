import { Switch } from "@/components/ui/switch";
import { FaHamburger } from "react-icons/fa";
import ResponsiveNavBar from "./ResponsiveNavBar";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { IoHomeOutline } from 'react-icons/io5'
import { useAuth } from "@/context/AuthContext";


const NavBar = ({
  darkMode,
  handleDarkMode,
}) => {
  const [showNavBar, setShowNavBar] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, username, logout: authLogout } = useAuth();

  function logout() {
    authLogout();
    navigate("/");
  }

  return (
    <>
      <nav className="max-container padding-x py-6 flex justify-between items-center  gap-6 sticky top-0 z-10 bg-[#FFFFFF] dark:bg-[#141624]">
        <Link to="/" className="flex items-center justify-end gap-3 text-[#3B3C4A] text-2xl dark:text-[#FFFFFF]">
          <IoHomeOutline size={24} />
          <p>На главную</p>
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
              <li onClick={logout} className="cursor-pointer">
                Выйти
              </li>
              <li><NavLink
                  to={`/notifications`}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Уведомления
                </NavLink></li>
              <li><NavLink
                  to={`/quests`}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Задания
                </NavLink></li>
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
            <NavLink
              to="/groups"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Группы
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/books"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Книги
            </NavLink>
          </li>

          <li>
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
          logout={logout}
        />
      )}
    </>
  );
};

export default NavBar;
