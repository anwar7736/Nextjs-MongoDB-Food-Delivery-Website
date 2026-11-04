"use client";
import { useEffect, useState } from "react";
import { redirect} from "next/navigation";
import { isDeliveryAuth } from "../helpers/helper";

const withDeliveryGuest = (WrappedComponent) => {
  return function DeliveryGuestComponent(props) {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);
    const status = isDeliveryAuth();
    if (!isMounted) return null;
    if (status)
    {
        redirect('/delivery/dashboard');
    }

    return <WrappedComponent {...props} />;
  };
};

export default withDeliveryGuest;
