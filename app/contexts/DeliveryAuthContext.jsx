"use client";
import { createContext, useEffect, useState } from "react";
import { delivery_auth } from "../helpers/helper";
export const DeliveryAuthContext = createContext();
const DeliveryAuthContextProvider = ({ children }) => {
  const [delivery, setDelivery] = useState("");
  useEffect(()=>{
    let active = true;
    fetch("/api/v1/auth/session")
      .then(async (response) => response.ok ? response.json() : null)
      .then((result) => {
        if (active) setDelivery(result?.data?.type === "delivery" ? delivery_auth() : "");
      })
      .catch((error) => console.error("Could not verify delivery session:", error));
    return () => { active = false; };
  }, []);
  return (
    <DeliveryAuthContext.Provider value={{ delivery, setDelivery }} >
      {children}
    </DeliveryAuthContext.Provider>
  )
}

export default DeliveryAuthContextProvider