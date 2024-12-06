"use client";
import { createContext, useEffect, useState } from "react";
import { delivery_auth } from "../helpers/helper";
export const DeliveryAuthContext = createContext();
const DeliveryAuthContextProvider = ({ children }) => {
  const [delivery, setDelivery] = useState([]);
  useEffect(()=>{
    setDelivery(delivery_auth());
  }, []);
  return (
    <DeliveryAuthContext.Provider value={{ delivery, setDelivery }} >
      {children}
    </DeliveryAuthContext.Provider>
  )
}

export default DeliveryAuthContextProvider