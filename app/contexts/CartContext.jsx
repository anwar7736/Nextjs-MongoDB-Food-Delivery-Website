"use client";
import { createContext, useState } from "react";
import { session } from "../helpers/helper";
export const CartContext = createContext();
const CartContextProvider = ({children}) => {
    const [cart, setCart] = useState(session('cart'));
    return (
        <CartContext.Provider value={{cart, setCart}}>
            {children}
        </CartContext.Provider>
    )

}

export default CartContextProvider