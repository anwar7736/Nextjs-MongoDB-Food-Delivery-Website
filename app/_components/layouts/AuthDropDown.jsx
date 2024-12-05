
import React from 'react'

const AuthDropDown = () => {
    return (
        <div className="dropdown">
            <button className="dropbtn px-4 py-2 text-xs rounded-full font-bold text-white border-2 border-red bg-red-500 transition-all ease-in-out duration-300 hover:bg-transparent hover:text-white">{user?.name}</button>
            <div className="dropdown-content">
                <Link href="#">Profile</Link>
                <Link href="#" onClick={() => Logout(1)}>Sign Out</Link>
            </div>
        </div>
    )
}

export default AuthDropDown