import { NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const ResponsiveNavBar = ({logout}) => {
  const { isAuthenticated, username } = useAuth();
  
  return (
    <nav className="max-container padding-x py-6 max-md:block hidden dark:text-[#FFFFFF]">
    <ul className="flex items-center justify-center gap-6 text-[#3B3C4A] lg:flex-1 flex-col dark:text-[#FFFFFF]">

   
    {isAuthenticated ? (
            <>
              <li>Hi, {username}</li>
              <li onClick={logout} className="cursor-pointer">Logout</li>
            </>
          ) : (
            <>
              <li>
                <NavLink
                  to="/signin"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Login
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/signup"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Register
                </NavLink>
              </li>
            </>
          )}

          <li className="font-semibold">
            <NavLink
              to="/create_book"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Создать книгу
            </NavLink>
          </li>



        

     


    </ul>
  </nav>
  )
}

export default ResponsiveNavBar
