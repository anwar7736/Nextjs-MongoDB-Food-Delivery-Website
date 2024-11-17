"use client";

import { useState } from "react";
import Login from "../_components/auth/Login";
import SignUp from "../_components/auth/SignUp";
import { getCookie} from "cookies-next";

const Restaurant = () => {
    const [login, setLogin] = useState(true);
  return (
    <div className="mt-4">
        {
            login ? <Login/> : <SignUp/>
        }
        
        <div align="center">
            <button className="text-red-500" onClick={()=>setLogin(!login)}>
                {
                    login ? 'Not yet a registered? Register' : 'Already have an account? Login'
                }
            </button>
        </div>
    </div>
  )
}

export default Restaurant