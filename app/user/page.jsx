"use client";

import { useState } from "react";
import Login from "../_components/user_auth/Login";
import SignUp from "../_components/user_auth/SignUp";
import withUserGuest from "../hoc/withUserGuest";

const User = () => {
    const [login, setLogin] = useState(true);
  return (
    <div className="mt-4">
        <title>Login/Signup</title>
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

export default withUserGuest(User)