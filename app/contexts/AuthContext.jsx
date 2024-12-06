"use client";
import { createContext, useEffect, useState } from "react";
import { restaurant_auth } from "../helpers/helper";
export const AuthContext = createContext();
const AuthContextProvider = ({children}) => {
  const [auth, setAuth] = useState([]);
  useEffect(()=>{
    setAuth(restaurant_auth());
  }, []);
  return (
    <AuthContext.Provider value={{auth, setAuth}} >
        {children}
    </AuthContext.Provider>
  )
}

export default AuthContextProvider