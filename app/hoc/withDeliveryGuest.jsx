"use client";
import { redirect} from "next/navigation";
import { isDeliveryAuth } from "../helpers/helper";

const withDeliveryGuest = (WrappedComponent) => {
  return function DeliveryGuestComponent(props) {
    const status = isDeliveryAuth();
    if (status)
    {
        redirect('/user/dashboard');
    }

    return <WrappedComponent {...props} />;
  };
};

export default withDeliveryGuest;
