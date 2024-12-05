"use client";
import { createContext, useEffect, useState } from "react";
export const CartContext = createContext();
const CartContextProvider = ({children}) => {
    const [cart, setCart] = useState([]);
    useEffect(()=>{
        let storage = localStorage.getItem('cart') != null ? JSON.parse(localStorage.getItem('cart')) : [];
        setCart(storage);
    }, []);
    return (
        <CartContext.Provider value={{cart, setCart}}>
            {children}
        </CartContext.Provider>
    )

}

export default CartContextProvider