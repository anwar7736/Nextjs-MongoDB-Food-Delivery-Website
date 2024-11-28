"use client";
import { createContext, useState } from "react";
import { restaurant_auth, user_auth } from "../helpers/helper";
export const UserAuthContext = createContext();
const UserAuthContextProvider = ({children}) => {
  const [user, setUser] = useState(user_auth());
  return (
    <UserAuthContext.Provider value={{user, setUser}} >
        {children}
    </UserAuthContext.Provider>
  )
}

export default UserAuthContextProvider