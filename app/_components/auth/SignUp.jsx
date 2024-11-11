import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from 'next/navigation'
import toast from 'cogo-toast-react-17-fix';
const SignUp = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const signupFormHandler = async (data) => {
    data.login = false;
    let res = await fetch("api/v1/restaurant", {
        method: "POST",
        body: JSON.stringify(data)
    });

    res = await res.json();
    if(res.success)
    {
        delete res.data.password;
        localStorage.setItem('auth', JSON.stringify(res.data));
        router.push("/restaurant/dashboard");
        toast.success(res.message);
    }
    else{
        toast.error(res.message);
        console.log(res);
    }
  }

  return (
    <div align="center">
      <h2 className="font-bold">Restaurant Registration</h2>
      <div className="w-full max-w-xs">
        <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={ handleSubmit(signupFormHandler)}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="name">
              Name
            </label>
            <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="name" type="text" placeholder="Name" {...register("name", { required: true, minLength: 3 })} />
            {errors.name && <p className="text-red-500 text-sm text-start">This field is required.</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="phone">
              Phone
            </label>
            <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="phone" type="text" placeholder="Phone" {...register("phone", { required: true,pattern: /^([+]{1}[8]{2}|0088)?(01)[3-9]\d{8}$/ } ) } />
            {errors.phone && <p className="text-red-500 text-sm text-start">Provide a valid phone number.</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="city">
              City
            </label>
            <select name="city" id="city" className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" {...register("city", { required: true })} >
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
            {errors.city && <p className="text-red-500 text-sm text-start">This field is required.</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="address">
              Address
            </label>
            <textarea className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="address" type="text" placeholder="Address" {...register("address", { required: true })}></textarea>
            {errors.address && <p className="text-red-500 text-sm text-start">This field is required.</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="email">
              Email
            </label>
            <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="email" type="email" placeholder="Email" {...register("email", { required: true })}/>
            {errors.email && <p className="text-red-500 text-sm text-start">Provide a valid email address.</p>}
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="password">
              Password
            </label>
            <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 mb-1 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="******************" {...register("password", {
            required: 'Provide atleast 4 digits/characters.',
            validate: (value) =>
              value == watch("cpassword") || 'Both password did not matched.'
          })} />
            {errors.password && <p className="text-red-500 text-sm text-start">{errors.password.message}</p>}
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="cpassword">
              Re-type Password
            </label>
            <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 mb-1 leading-tight focus:outline-none focus:shadow-outline" id="cpassword" type="password" placeholder="******************" {...register("cpassword", {required:true})}/>
          </div>
          <div className="flex items-center justify-between">
            <button className="bg-green-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SignUp