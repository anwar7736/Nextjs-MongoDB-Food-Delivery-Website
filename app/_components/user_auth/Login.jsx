import { useForm } from "react-hook-form";
import toast from 'cogo-toast-react-17-fix';
import { useRouter } from 'next/navigation'
import ValidationError from "../ValidationError";
import { delivery_auth, restaurant_auth, user_auth } from "@/app/helpers/helper";
import { deleteCookie, setCookie } from "cookies-next";
import { useContext } from "react";
import { AuthContext } from "@/app/contexts/AuthContext";
import { UserAuthContext } from "@/app/contexts/UserAuthContext";
import { DeliveryAuthContext } from "@/app/contexts/DeliveryAuthContext";
import { session, session_destroy } from "@/app/helpers/SessionHelper";
const Login = () => {
    const {auth, setAuth} = useContext(AuthContext);
    const {user, setUser} = useContext(UserAuthContext);
    const {delivery, setDelivery} = useContext(DeliveryAuthContext);
    const router = useRouter();
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
      } = useForm();
    const loginFormHandler = async (data) => {
        data.login = true;

        let res = await fetch("api/v1/user", {
            method: "POST",
            body: JSON.stringify(data)
        });

        res = await res.json();
        if(res.success)
        {
            delete res.data.password;
            deleteCookie('delivery_auth');
            setDelivery(delivery_auth());
            deleteCookie('restaurant_auth');
            setAuth(restaurant_auth());
            setCookie('user_auth', JSON.stringify(res.data));
            setUser(user_auth());
            let redirectUrl = "/user/dashboard";
            let url = session('redirect_url');
            if(url && url.length > 0)
            {
                redirectUrl = url;
                session_destroy('redirect_url');
            }
            router.push(redirectUrl);
            toast.success("Login Successfully");
        }
        else{
            toast.error("Invalid credentials.");
        }
        
    }
    return (
        <div align="center">
            <h2 className="font-bold">Login</h2>
            <div className="w-full max-w-xs">
                <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={handleSubmit(loginFormHandler)}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="phone">
                            Phone
                        </label>
                        <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="phone" type="phone" placeholder="Phone" {...register("phone", { required: 'This field is required' })}/>
                        {errors.phone && <ValidationError message={errors.phone.message} />}
                        
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="password">
                            Password
                        </label>
                        <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 mb-1 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="******************" {...register("password", { required: 'This field is required' })}/>
                        {errors.password && <ValidationError message={errors.password.message} />}
                    </div>
                    <div className="flex items-center justify-between">
                        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
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