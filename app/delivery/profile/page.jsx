"use client";
import withDeliveryAuth from "@/app/hoc/withDeliveryAuth";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import ValidationError from "@/app/_components/ValidationError";
import { delivery_auth } from "@/app/helpers/helper";
import { setCookie } from "cookies-next";
import { useContext, useEffect, useState } from "react";
import { DeliveryAuthContext } from "@/app/contexts/DeliveryAuthContext";
const Profile = () => {
    const {delivery, setDelivery} = useContext(DeliveryAuthContext);
    const [isDisabled, setIsDisabled] = useState(false);
    let auth = delivery_auth();
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        reset,
    } = useForm({
        defaultValues:{
            name: auth?.name,
            phone: auth?.phone,
            city: auth?.city,
            address: auth?.address,
        }
    });

    useEffect(()=>{
        if(!auth)
        {
            redirect("/delivery");
        }
    }, []);

    const signupFormHandler = async (data) => {
        setIsDisabled(true);
        let res = await fetch(`/api/v1/delivery/profile/${auth._id}`, {
            method: "PUT",
            body: JSON.stringify(data)
        });

        res = await res.json();
        if (res.success) {
            setCookie('delivery_auth', JSON.stringify(res.data));
            setDelivery(delivery_auth());
            toast.success(res.message);
        }
        else {
            setIsDisabled(false);
            toast.error(res.message);
        }
    }

    return (
        <div align="center">
            <title>Restaurant Profile</title>
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
                        <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="city">
                            City
                        </label>
                        <select name="city" id="city" className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" {...register("city", { required: 'This field is required' })} >
                            <option value="">Select Any City</option>
                            <option value="Dhaka">Dhaka</option>
                            <option value="Chattogram">Chattogram</option>
                            <option value="Khulna">Khulna</option>
                            <option value="Rajshahi">Rajshahi</option>
                            <option value="Sylhet">Sylhet</option>
                            <option value="Barishal">Barishal</option>
                            <option value="Rangpur">Rangpur</option>
                            <option value="Mymensingh">Mymensingh</option>
                            <option value="Comilla">Comilla</option>
                            <option value="Narayanganj">Narayanganj</option>
                            <option value="Gazipur">Gazipur</option>
                        </select>
                        {errors.city && <ValidationError message={errors.city.message} />}
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
                        <button 
                        disabled={isDisabled}
                        className={`bg-green-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isDisabled ? 'cursor-not-allowed opacity-50' : ''
                            }`}
                         type="submit">
                            Update
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Profile