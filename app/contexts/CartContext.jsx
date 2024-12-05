"use client";
import { createContext, useEffect, useState } from "react";
import { session } from "../helpers/SessionHelper";
export const CartContext = createContext();
const CartContextProvider = ({children}) => {
    const [cart, setCart] = useState([]);
    useEffect(()=>{
        let storage = session('cart');
        setCart(storage);
    }, []);
    return (
        <CartContext.Provider value={{cart, setCart}}>
            {children}
        </CartContext.Provider>
    )

}

export default CartContextProvider