"use client";
import { createContext, useState } from "react";
import { delivery_auth } from "../helpers/helper";
export const DeliveryAuthContext = createContext();
const DeliveryAuthContextProvider = ({ children }) => {
  const [delivery, setDelivery] = useState(delivery_auth());
  return (
    <DeliveryAuthContext.Provider value={{ delivery, setDelivery }} >
      {children}
    </DeliveryAuthContext.Provider>
  )
}

export default DeliveryAuthContextProvider