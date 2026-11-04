"use client";
import { useEffect, useState } from "react";
import { redirect} from "next/navigation";
import { isRestaurantAuth } from "../helpers/helper";

const withAuth = (WrappedComponent) => {
  return function AuthComponent(props) {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);
    const status = isRestaurantAuth();
    if (!isMounted) return null;
    if (!status)
    {
        redirect('/');
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;
