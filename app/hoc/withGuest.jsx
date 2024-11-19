"use client";
import { useEffect } from "react";
import { redirect} from "next/navigation";
import { isRestaurantAuth } from "../helpers/helper";

const withGuest = (WrappedComponent) => {
  return function GuestComponent(props) {
    const status = isRestaurantAuth();
    if (status)
    {
        redirect('/restaurant/dashboard');
    }

    return <WrappedComponent {...props} />;
  };
};

export default withGuest;
