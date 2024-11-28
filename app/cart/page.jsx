"use client";
import { useContext, useEffect, useState } from "react";
import { CartContext } from "../contexts/CartContext";
import { isUserAuth, session, session_destroy } from "../helpers/helper";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { hasCookie } from "cookies-next";

const Cart = () => {
    const router = useRouter();
    const { cart, setCart } = useContext(CartContext);
    const [subTotal, setSubTotal] = useState(0);
    const calculateSubTotal = () => {
        const total = cart.reduce((total, item) => total + item.price, 0);
        return total;
    }
    useEffect(() => {
        setSubTotal(calculateSubTotal());
    }, [cart]);
    const removeFromCart = (id) => {
        let cartItems = cart.filter(item => item._id != id);
        if (cartItems.length > 0) {
            session('cart', cartItems);
        }
        else {
            session_destroy('cart');
        }

        setCart(session('cart'));
    }
    const orderNow = () => {
        if (!isUserAuth()) {
            session('redirect_url', "/place_order");
            router.push('/user');
        }
        else {
            router.push('/place_order');
        }
    }
    return (
        <div>
            <div className="restaurant-page-banner">
                <h1>Cart Details</h1>
            </div>
            <div className="food-list-wrapper">
                {
                    cart.length > 0 ? cart.map((item) => (
                        <div className="list-item" key={item._id}>
                            <div><img style={{ width: 100 }} src={item.image} /></div>

                            <div>
                                <div>{item.name}</div>
                                <div>{item.price}</div>
                                <div className="description">{item.description}</div>
                                {
                                    (<button className="remove_button" onClick={() => removeFromCart(item._id)}>Remove</button>)
                                }

                            </div>

                        </div>
                    ))
                        : (<h1 className="text-center text-red-600">Your cart is empty!</h1>)
                }
                {
                    cart.length > 0 &&
                    <div>
                        <div align="left" className="mt-5 ml-3">
                            <p><b>Total Items:</b> {cart.length}</p>
                            <p><b>Sub Total:</b>{subTotal}</p>
                        </div>
                        <div align="left" className="mt-5 ml-3">
                            <button onClick={() => orderNow()} className="order-now-btn">Order Now</button>
                        </div>
                    </div>
                }
                <div align="center" className="mt-5">
                    <Link href="/" className="shopping-btn">Continue Shopping</Link>
                </div>
            </div>
        </div>
    )
}

export default Cart