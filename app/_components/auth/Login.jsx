import { useForm } from "react-hook-form";
import toast from 'cogo-toast-react-17-fix';
import { useRouter } from 'next/navigation'
const Login = () => {
    const router = useRouter();
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
      } = useForm();
    const loginFormHandler = async (data) => {
        data.login = true;
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
            toast.success("Login Successfully");
        }
        else{
            toast.error("Invalid credentials.");
        }
        
    }
    return (
        <div align="center">
            <h2 className="font-bold">Restaurant Login</h2>
            <div className="w-full max-w-xs">
                <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={handleSubmit(loginFormHandler)}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="email">
                            Email
                        </label>
                        <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="email" type="email" placeholder="Email" {...register("email", { required: true })}/>
                        {errors.email && <p className="text-red-500 text-sm text-start">This field is required.</p>}
                        
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="password">
                            Password
                        </label>
                        <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 mb-1 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="******************" {...register("password", { required: true })}/>
                        {errors.password && <p className="text-red-500 text-sm text-start">This field is required.</p>}
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