"use client";
import { useContext, useEffect, useState } from "react";
import { CartContext } from "../contexts/CartContext";
import { isUserAuth, session, session_destroy } from "../helpers/helper";
import Link from "next/link";
import withUserAuth from "../hoc/withUserAuth";

const PlaceOrder = () => {
    const { cart, setCart } = useContext(CartContext);
    const [subTotal, setSubTotal] = useState(0);
    const [shippingCharge, setShippingCharge] = useState(50);
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
    return (
        <div>
            <div className="restaurant-page-banner">
                <h1>Place Order</h1>
            </div>
            <div className="food-list-wrapper">
                <h4 className="ml-3">Foods Information</h4>
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
                <div className="ml-3 mt-3 mb-3">
                    <h4>Shipping Information</h4>
                    <p><b>Address:</b> Dhaka</p>
                    <p><b>Phone:</b> 0171000000</p>
                </div>
                <hr/>
                <div className="ml-3 mt-3 mb-3">
                    <h4>Costing Information</h4>
                    <div align="left" className="">
                        <p><b>Total Items:</b> {cart.length}</p>
                        <p><b>Sub Total:</b>{subTotal}</p>
                        <p><b>Shipping Charge:</b>{shippingCharge}</p>
                        <p><b>Total Amount:</b>{subTotal + shippingCharge}</p>
                    </div>
                    <div align="left" className=" mt-3">
                        <Link href="/" className="order-now-btn">Plce Order</Link>
                    </div>
                </div>
                
                <div align="center" className="mt-5">
                    <Link href="/" className="shopping-btn">Continue Shopping</Link>
                </div>
            </div>
        </div>
    )
}

export default withUserAuth(PlaceOrder)