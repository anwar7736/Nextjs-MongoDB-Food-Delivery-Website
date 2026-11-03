"use client";
import { createContext, useEffect, useState } from "react";
import { restaurant_auth, user_auth } from "../helpers/helper";
export const UserAuthContext = createContext();
const UserAuthContextProvider = ({children}) => {
  const [user, setUser] = useState("");
  useEffect(()=>{
    let active = true;
    fetch("/api/v1/auth/session")
      .then(async (response) => response.ok ? response.json() : null)
      .then((result) => {
        if (active) setUser(result?.data?.type === "user" ? user_auth() : "");
      })
      .catch((error) => console.error("Could not verify user session:", error));
    return () => { active = false; };
  }, []);
  return (
    <UserAuthContext.Provider value={{user, setUser}} >
        {children}
    </UserAuthContext.Provider>
  )
}

export default UserAuthContextProvider