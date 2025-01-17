import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from 'next/navigation'
import { toast } from "react-toastify";
import ValidationError from "../ValidationError";
import { delivery_auth, restaurant_auth, user_auth } from "@/app/helpers/helper";
import { deleteCookie, setCookie } from "cookies-next";
import { AuthContext } from "@/app/contexts/AuthContext";
import { UserAuthContext } from "@/app/contexts/UserAuthContext";
import { DeliveryAuthContext } from "@/app/contexts/DeliveryAuthContext";
import { session, session_destroy } from "@/app/helpers/SessionHelper";
const SignUp = () => {
  const router = useRouter();
  const {auth, setAuth} = useContext(AuthContext);
  const {user, setUser} = useContext(UserAuthContext);
  const {delivery, setDelivery} = useContext(DeliveryAuthContext);
  const [isDisabled, setIsDisabled] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const signupFormHandler = async (data) => {
    setIsDisabled(true);
    data.login = false;
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
        toast.success(res.message);
    }
    else{
        setIsDisabled(false);
        toast.error(res.message);
        console.log(res);
    }
  }

  return (
    <div align="center">
      <h2 className="font-bold">Registration</h2>
      <div className="w-full max-w-xs">
        <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={ handleSubmit(signupFormHandler)}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="name">
              Name
            </label>
            <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="name" type="text" placeholder="Name" {...register("name", { required: 'This field is required', minLength: {
              value: 3,
              message: 'This should be atleast 3 characters.'
            } })} />
            {errors.name && <ValidationError message={errors.name.message} />}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="phone">
              Phone
            </label>
            <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="phone" type="text" placeholder="Phone" {...register("phone", { required: 'Provide a valid phone number.', pattern: /^([+]{1}[8]{2}|0088)?(01)[3-9]\d{8}$/ } ) } />
            {errors.phone && <ValidationError message={errors.phone.message} />}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="address">
              Address
            </label>
            <textarea className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="address" type="text" placeholder="Address" {...register("address", { required: 'This field is required.' })}></textarea>
            {errors.address && <ValidationError message={errors.address.message} />}
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="password">
              Password
            </label>
            <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 mb-1 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="******************" {...register("password", {
            required: 'This field is required.',
            minLength: {
              value: 4,
              message: 'Provide atleast 4 digits/characters.'
            },
            validate: (value) =>
              value == watch("cpassword") || 'Both password did not matched.'
          })} />
            {errors.password && <ValidationError message={errors.password.message} />}
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="cpassword">
              Re-type Password
            </label>
            <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 mb-1 leading-tight focus:outline-none focus:shadow-outline" id="cpassword" type="password" placeholder="******************" {...register("cpassword", {required:'This field is required.'})}/>
          </div>
          <div className="flex items-center justify-between">
            <button 
              disabled={isDisabled}
              className={`bg-green-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isDisabled ? 'cursor-not-allowed opacity-50' : ''
                  }`}
            type="submit">
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SignUp