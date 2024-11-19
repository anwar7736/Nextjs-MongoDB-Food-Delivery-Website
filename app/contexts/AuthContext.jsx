"use client";
import { createContext, useState } from "react";
import { restaurant_auth } from "../helpers/helper";
export const AuthContext = createContext();
const AuthContextProvider = ({children}) => {
  const [auth, setAuth] = useState(restaurant_auth());
  return (
    <AuthContext.Provider value={{auth, setAuth}} >
        {children}
    </AuthContext.Provider>
  )
}

export default AuthContextProvider