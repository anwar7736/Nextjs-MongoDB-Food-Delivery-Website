"use client";
import { useEffect, useState } from "react";
import { redirect} from "next/navigation";
import { isDeliveryAuth } from "../helpers/helper";

const withDeliveryAuth = (WrappedComponent) => {
  return function DeliveryAuthComponent(props) {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);
    const status = isDeliveryAuth();
    if (!isMounted) return null;
    if (!status)
    {
        redirect('/');
    }

    return <WrappedComponent {...props} />;
  };
};

export default withDeliveryAuth;
