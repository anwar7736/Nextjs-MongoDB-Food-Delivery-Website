"use client";
import withUserAuth from "@/app/hoc/withUserAuth";
import { useForm } from "react-hook-form";
import toast from 'cogo-toast-react-17-fix';
import ValidationError from "@/app/_components/ValidationError";
import { user_auth } from "@/app/helpers/helper";
import { setCookie } from "cookies-next";
import { useContext, useEffect, useState } from "react";
import { UserAuthContext } from "@/app/contexts/UserAuthContext";
const Profile = () => {
    const [user, setUser] = useState([]);
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        reset,
    } = useForm();

    const signupFormHandler = async (data) => {
        let res = await fetch(`/api/v1/user/profile/${user._id}`, {
            method: "PUT",
            body: JSON.stringify(data)
        });

        res = await res.json();
        if (res.success) {
            setCookie('user_auth', JSON.stringify(res.data));
            setUser(user_auth());
            toast.success(res.message);
        }
        else {
            toast.error(res.message);
        }
    }

    useEffect(()=>{
        setUser(user_auth());
        reset({
            name: user?.name,
            phone: user?.phone,
            address: user?.address,
        });
    }, []);

    return (
        <div align="center">
            <title>User Profile</title>
            <div className="w-full max-w-xs">
                <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={handleSubmit(signupFormHandler)}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="name">
                            Name
                        </label>
                        <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="name" type="text" placeholder="Name" {...register("name", {
                            required: 'This field is required', minLength: {
                                value: 3,
                                message: 'This should be atleast 3 characters.'
                            }
                        })} />
                        {errors.name && <ValidationError message={errors.name.message} />}
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="phone">
                            Phone
                        </label>
                        <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="phone" type="text" placeholder="Phone" {...register("phone", { required: 'Provide a valid phone number.', pattern: /^([+]{1}[8]{2}|0088)?(01)[3-9]\d{8}$/ })} />
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
                            Current Password
                        </label>
                        <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 mb-1 leading-tight focus:outline-none focus:shadow-outline" id="old_password" type="password" placeholder="******************" {...register("old_password", {
                            minLength: {
                                value: 4,
                                message: 'Provide atleast 4 digits/characters.'
                            }
                        } )} />
                        {errors?.old_password && <ValidationError message={errors?.old_password?.message} />}
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="password">
                            Password
                        </label>
                        <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 mb-1 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="******************" {...register("password", {
                            minLength: {
                                value: 4,
                                message: 'Provide atleast 4 digits/characters.'
                            },
                            validate: (value) =>
                                value == watch("cpassword") || 'Both password did not matched.'
                        })} />
                        {errors?.password && <ValidationError message={errors?.password?.message} />}
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="cpassword">
                            Re-type Password
                        </label>
                        <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 mb-1 leading-tight focus:outline-none focus:shadow-outline" id="cpassword" type="password" placeholder="******************" {...register("cpassword")} />
                    </div>
                    <div className="flex items-center justify-between">
                        <button className="bg-green-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
                            Update
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default withUserAuth(Profile)