"use client";
import { useEffect, useState } from "react";
import { redirect} from "next/navigation";
import { isUserAuth } from "../helpers/helper";

const withUserAuth = (WrappedComponent) => {
  return function UserAuthComponent(props) {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);
    const status = isUserAuth();
    if (!isMounted) return null;
    if (!status)
    {
        redirect('/');
    }

    return <WrappedComponent {...props} />;
  };
};

export default withUserAuth;
