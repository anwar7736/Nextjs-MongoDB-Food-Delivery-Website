"use client";
import { redirect} from "next/navigation";
import { isDeliveryAuth } from "../helpers/helper";

const withDeliveryAuth = (WrappedComponent) => {
  return function DeliveryAuthComponent(props) {
    const status = isDeliveryAuth();
    if (!status)
    {
        redirect('/user');
    }

    return <WrappedComponent {...props} />;
  };
};

export default withDeliveryAuth;
