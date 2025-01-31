import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useRouter } from 'next/navigation'
import ValidationError from "../ValidationError";
import { delivery_auth, restaurant_auth, user_auth } from "@/app/helpers/helper";
import { deleteCookie, setCookie } from "cookies-next";
import { useContext, useState } from "react";
import { AuthContext } from "@/app/contexts/AuthContext";
import { UserAuthContext } from "@/app/contexts/UserAuthContext";
import { DeliveryAuthContext } from "@/app/contexts/DeliveryAuthContext";
const Login = () => {
    const { auth, setAuth } = useContext(AuthContext);
    const { user, setUser } = useContext(UserAuthContext);
    const { delivery, setDelivery } = useContext(DeliveryAuthContext);
    const [isDisabled, setIsDisabled] = useState(false);
    const router = useRouter();
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        defaultValues: {
            phone: '01710000000',
            password: '1234'
        }
    });
    const loginFormHandler = async (data) => {
        setIsDisabled(true);
        data.login = true;
        let res = await fetch("api/v1/delivery", {
            method: "POST",
            body: JSON.stringify(data)
        });

        res = await res.json();
        if (res.success) {
            delete res.data.password;
            deleteCookie('user_auth');
            setUser(user_auth());
            deleteCookie('restaurant_auth');
            setAuth(restaurant_auth());
            setCookie('delivery_auth', JSON.stringify(res.data));
            setDelivery(delivery_auth());
            let redirectUrl = "/delivery/dashboard";
            router.push(redirectUrl);
            toast.success("Login Successfully");
        }
        else {
            setIsDisabled(false);
            toast.error("Invalid credentials.");
        }

    }
    return (
        <div align="center">
            <h2 className="font-bold">Delivery Partner Login</h2>
            <div className="w-full max-w-xs">
                <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={handleSubmit(loginFormHandler)}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="phone">
                            Phone
                        </label>
                        <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="phone" type="phone" placeholder="Phone" {...register("phone", { required: 'This field is required' })} />
                        {errors.phone && <ValidationError message={errors.phone.message} />}

                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="password">
                            Password
                        </label>
                        <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 mb-1 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="******************" {...register("password", { required: 'This field is required' })} />
                        {errors.password && <ValidationError message={errors.password.message} />}
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            disabled={isDisabled}
                            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isDisabled ? 'cursor-not-allowed opacity-50' : ''
                                }`}
                            type="submit">
                            Login
                        </button>
                        <button className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800" type="button">
                            Forgot Password?
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Login