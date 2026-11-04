"use client";
import { useEffect, useState } from "react";
import { redirect} from "next/navigation";
import { isUserAuth } from "../helpers/helper";

const withUserGuest = (WrappedComponent) => {
  return function UserGuestComponent(props) {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);
    const status = isUserAuth();
    if (!isMounted) return null;
    if (status)
    {
        redirect('/user/dashboard');
    }

    return <WrappedComponent {...props} />;
  };
};

export default withUserGuest;
