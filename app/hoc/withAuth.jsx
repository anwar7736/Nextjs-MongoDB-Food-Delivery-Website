"use client";
import { useEffect } from "react";
import { redirect} from "next/navigation";
import { isRestaurantAuth } from "../helpers/helper";

const withAuth = (WrappedComponent) => {
  return function AuthComponent(props) {
    const status = isRestaurantAuth();
    if (!status)
    {
        redirect('/restaurant');
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;
