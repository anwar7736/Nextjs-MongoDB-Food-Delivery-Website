"use client";
import { createContext, useEffect, useState } from "react";
import { restaurant_auth } from "../helpers/helper";
export const AuthContext = createContext();
const AuthContextProvider = ({children}) => {
  const [auth, setAuth] = useState("");
  useEffect(()=>{
    let active = true;
    fetch("/api/v1/auth/session")
      .then(async (response) => response.ok ? response.json() : null)
      .then((result) => {
        if (active) setAuth(result?.data?.type === "restaurant" ? restaurant_auth() : "");
      })
      .catch((error) => console.error("Could not verify restaurant session:", error));
    return () => { active = false; };
  }, []);
  return (
    <AuthContext.Provider value={{auth, setAuth}} >
        {children}
    </AuthContext.Provider>
  )
}

export default AuthContextProvider