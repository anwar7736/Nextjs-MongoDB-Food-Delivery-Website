"use client";
import { useEffect, useState } from "react";
import { redirect} from "next/navigation";
import { isRestaurantAuth } from "../helpers/helper";

const withGuest = (WrappedComponent) => {
  return function GuestComponent(props) {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);
    const status = isRestaurantAuth();
    if (!isMounted) return null;
    if (status)
    {
        redirect('/restaurant/dashboard');
    }

    return <WrappedComponent {...props} />;
  };
};

export default withGuest;
