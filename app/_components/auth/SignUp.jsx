import { useState } from "react";

const SignUp = () => {
  const [form, setForm] = useState([]);
  const signupFormHandler = (e) => {
      e.preventDefault();
      console.log(e);
      
  }
  return (
    <div align="center">
      <h2 className="font-bold">Restaurant Registration</h2>
      <div className="w-full max-w-xs">
        <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={signupFormHandler}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="name">
              Name
            </label>
            <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="name" type="text" placeholder="Name" />
            <p className="text-red-500 text-sm text-start">This field is required.</p>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="phone">
              Phone
            </label>
            <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="phone" type="text" placeholder="Phone" />
            <p className="text-red-500 text-sm text-start">This field is required.</p>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="city">
              City
            </label>
            <select name="city" id="city" className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1">
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
            <p className="text-red-500 text-sm text-start">This field is required.</p>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="address">
              Address
            </label>
            <textarea className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="address" type="text" placeholder="Address" ></textarea>
            <p className="text-red-500 text-sm text-start">This field is required.</p>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="username">
              Email
            </label>
            <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="username" type="email" placeholder="Email" />
            <p className="text-red-500 text-sm text-start">This field is required.</p>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="password">
              Password
            </label>
            <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 mb-1 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="******************" />
            <p className="text-red-500 text-sm text-start">This field is required.</p>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="cpassword">
              Re-type Password
            </label>
            <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 mb-1 leading-tight focus:outline-none focus:shadow-outline" id="cpassword" type="password" placeholder="******************" />
            <p className="text-red-500 text-sm text-start">This field is required.</p>
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