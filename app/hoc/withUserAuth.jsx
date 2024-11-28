"use client";
import { redirect} from "next/navigation";
import { isUserAuth } from "../helpers/helper";

const withUserAuth = (WrappedComponent) => {
  return function UserAuthComponent(props) {
    const status = isUserAuth();
    if (!status)
    {
        redirect('/user');
    }

    return <WrappedComponent {...props} />;
  };
};

export default withUserAuth;
