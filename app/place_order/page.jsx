"use client";
import { useContext, useEffect, useState } from "react";
import { CartContext } from "../contexts/CartContext";
import { isUserAuth, user_auth } from "../helpers/helper";
import Link from "next/link";
import { session, session_destroy } from "../helpers/SessionHelper";
import withUserAuth from "../hoc/withUserAuth";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const PlaceOrder = () => {
    const router = useRouter();
    const { cart, setCart } = useContext(CartContext);
    const [subTotal, setSubTotal] = useState(0);
    const [shippingCharge, setShippingCharge] = useState(50);
    const [isDisabled, setIsDisabled] = useState(false);
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

    const orderSubmit = async () => {
        setIsDisabled(true);
        let data = {
            "user_id": user_auth()._id,
            "restaurant_id": cart[0].restaurant_id,
            "total": subTotal,
            "shipping_charge": shippingCharge,
            "items": []
        };

        cart.map(item => {
            data.items.push({
                "id": item._id,
                "quantity": item.quantity,
                "price": item.price,
            })
        });

        try {
            const response = await fetch("/api/v1/order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                toast.error(result.message || "Unable to place this order.");
                return;
            }
            session_destroy('cart');
            setCart([]);
            toast.success(result.message);
            router.push('/user/dashboard');
        } catch (error) {
            console.error("Order placement failed:", error);
            toast.error("Unable to place this order.");
        } finally {
            setIsDisabled(false);
        }
    }
    return (
        <div>
            <div className="restaurant-page-banner">
                <h1>Place Order</h1>
            </div>
            <div className="food-list-wrapper">
                {
                    cart.length > 0 && (<h4 className="ml-3">Foods Information</h4>)
                }
                {
                    cart.length > 0 ? cart.map((item) => (
                        <article className="cart-item-card" key={item._id}>
                            <img src={item.image} alt={item.name} />
                            <div className="cart-item-details">
                                <h2>{item.name}</h2>
                                <p>Tk {Number(item.price).toFixed(2)} each</p>
                                <div className="cart-quantity">
                                    <button aria-label={`Decrease ${item.name} quantity`} onClick={() => decreaseQty(item)}>-</button>
                                    <input type="number" min="1" max="99" value={item.quantity} aria-label={`${item.name} quantity`} className="onlyNumber" onChange={(e) => quantityChange(item, e.target.value)} />
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
                    (<div>

                        <div className="ml-3 mt-3 mb-3">
                            <h4>Shipping Information</h4>
                            <p><b>Address:</b> {user_auth()?.address || "Add an address in your profile."}</p>
                            <p><b>Phone:</b> {user_auth()?.phone || "Add a phone number in your profile."}</p>
                        </div>
                        <hr />
                        <div className="ml-3 mt-3 mb-3">
                            <h4>Costing Information</h4>
                            <div align="left" className="">
                                <p><b>Total Items:</b> {cart.reduce((total, item) => total + item.quantity, 0)}</p>
                                <p><b>Sub Total:</b> Tk {subTotal.toFixed(2)}</p>
                                <p><b>Shipping Charge:</b> Tk {shippingCharge.toFixed(2)}</p>
                                <p><b>Total Amount:</b> Tk {(subTotal + shippingCharge).toFixed(2)}</p>
                            </div>
                            <div align="left" className=" mt-3">
                                <button 
                                disabled={isDisabled}
                                className={`order-now-btn ${isDisabled ? 'cursor-not-allowed opacity-50' : ''
                                 }`} 
                                onClick={() => orderSubmit()}>Place Order</button>
                            </div>
                        </div>
                    </div>)
                }
                <div align="center" className="mt-5">
                    <Link href="/" className="shopping-btn">Continue Shopping</Link>
                </div>
            </div>
        </div>
    )
}

export default withUserAuth(PlaceOrder)