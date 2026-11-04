"use client";
import { useContext, useEffect, useState } from "react";
import { CartContext } from "../contexts/CartContext";
import { isUserAuth } from "../helpers/helper";
import { session, session_destroy } from "../helpers/SessionHelper";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { hasCookie } from "cookies-next";
import { toast } from "react-toastify";
import ImageWithFallback from "../_components/ImageWithFallback";

const Cart = () => {
    const router = useRouter();
    const { cart, setCart } = useContext(CartContext);
    const [subTotal, setSubTotal] = useState(0);
    const calculateSubTotal = () => {
        const total = cart.reduce((total, item) => total + (item.quantity * item.price), 0);
        return total;
    }
    useEffect(() => {
        setSubTotal(calculateSubTotal());
    }, [cart]);

    const removeFromCart = (id) => {
        const cartItems = cart.filter(item => item._id !== id);
        if (cartItems.length > 0) {
            session('cart', cartItems);
        }
        else {
            session_destroy('cart');
        }

        setCart(cartItems);
        toast.success("Item has been removed.");
    }

    const quantityChange = (item, newQty) => {
        const quantity = Number(newQty);
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return;
        const cartItems = cart.map((row) => row._id === item._id ? { ...row, quantity } : row);
        session('cart', cartItems);
        setCart(cartItems);
    }

    const increaseQty = (item) => {
        const cartItems = cart.map((row) => row._id === item._id && row.quantity < 99
            ? { ...row, quantity: row.quantity + 1 }
            : row);
        session('cart', cartItems);
        setCart(cartItems);
    }

    const decreaseQty = (item) => {
        const cartItems = cart.map((row) => row._id === item._id && row.quantity > 1
            ? { ...row, quantity: row.quantity - 1 }
            : row);
        session('cart', cartItems);
        setCart(cartItems);
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
                        <article className="cart-item-card" key={item._id}>
                            <ImageWithFallback src={item.image} alt={item.name} />
                            <div className="cart-item-details">
                                <h2>{item.name}</h2>
                                <p>Tk {Number(item.price).toFixed(2)} each</p>
                                <div className="cart-quantity">
                                    <button aria-label={`Decrease ${item.name} quantity`} onClick={() => decreaseQty(item)}>-</button>
                                    <input type="number" min="1" max="99" value={item.quantity} aria-label={`${item.name} quantity`} className="onlyNumber" onChange={(e) => quantityChange(item, e.target.value)}/>
                                    <button aria-label={`Increase ${item.name} quantity`} onClick={() => increaseQty(item)}>+</button>
                                </div>
                                <button className="remove_button" onClick={() => removeFromCart(item._id)}>Remove</button>
                            </div>
                            <strong className="cart-item-total">Tk {(item.price * item.quantity).toFixed(2)}</strong>
                        </article>
                    ))
                        : (<h1 className="text-center text-red-600">Your cart is empty!</h1>)
                }
                {
                    cart.length > 0 &&
                    <div>
                        <div align="left" className="mt-5 ml-3">
                            <p><b>Total Items:</b> {cart.reduce((total, item) => total + item.quantity, 0)}</p>
                            <p><b>Sub Total:</b> Tk {subTotal.toFixed(2)}</p>
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