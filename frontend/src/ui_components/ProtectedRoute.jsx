import { jwtDecode } from "jwt-decode"
import { useState, useEffect }  from "react"
import Spinner from "./Spinner"
import { Navigate, useLocation } from "react-router-dom"

const ProtectedRoute = ({children}) => {

    const [isAuthorized, setIsAuthorized] = useState(null)
    const location = useLocation()

    useEffect(() => {
        const token = localStorage.getItem("access")
        const refresh = localStorage.getItem("refresh")

        if (!token) {
            setIsAuthorized(Boolean(refresh))
            return
        }

        try {
            const decodedToken = jwtDecode(token)
            const expiry_date = decodedToken.exp
            const current_time = Date.now() / 1000

            if (expiry_date && current_time < expiry_date) {
                setIsAuthorized(true)
                return
            }
        } catch (err) {
            console.log(err)
        }

        setIsAuthorized(Boolean(refresh))
    }, [])


    if(isAuthorized === null){
        return <Spinner />
    }

  return (
    <>
        {isAuthorized ? children : <Navigate to="/signin" state={{from:location}} replace />}
    </>
  )
}

export default ProtectedRoute
