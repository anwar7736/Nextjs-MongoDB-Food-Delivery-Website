"use client";
import { redirect} from "next/navigation";
import { isUserAuth } from "../helpers/helper";

const withUserGuest = (WrappedComponent) => {
  return function UserGuestComponent(props) {
    const status = isUserAuth();
    if (status)
    {
        redirect('/user/dashboard');
    }

    return <WrappedComponent {...props} />;
  };
};

export default withUserGuest;
