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
        let cartItems = cart.filter(item => item._id != id);
        if (cartItems.length > 0) {
            session('cart', cartItems);
        }
        else {
            session_destroy('cart');
        }

        setCart(session('cart'));
        toast.success("Item has been removed.");
    }

    const quantityChange = (item, newQty) => {
        let cartItems = cart;
        let index = cartItems.findIndex(row => row._id == item._id);
        if (index != -1 && newQty > 0) {
            cartItems[index].quantity = Number(newQty);
            session('cart', cartItems);
            setCart(session('cart'));
            toast.success("Item quantity updated.");
        }

    }

    const increaseQty = (item) => {
        let cartItems = cart;
        let index = cartItems.findIndex(row => row._id == item._id);
        if (index != -1) {
            cartItems[index].quantity++;
            session('cart', cartItems);
            setCart(session('cart'));
            toast.success("Item quantity increased.");
        }
    }

    const decreaseQty = (item) => {
        let cartItems = cart;
        let index = cartItems.findIndex(row => row._id == item._id);
        if (index != -1) {
            if (cartItems[index].quantity > 1) {
                cartItems[index].quantity--;
                session('cart', cartItems);
                setCart(session('cart'));
                toast.success("Item quantity decreased.");
            }
        }
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

        let res = await fetch("/api/v1/order", {
            method: "POST",
            body: JSON.stringify(data)
        });
        res = await res.json();
        if (res.success) {
            session_destroy('cart');
            setCart(session('cart'));
            toast.success(res.message);
            router.push('/user/dashboard');
        }
        else{
            setIsDisabled(false);
            toast.success(res.message);
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
                        <div className="list-item" key={item._id}>
                            <div><img style={{ width: 100 }} src={item.image} /></div>

                            <div>
                                <div>{item.name}</div>
                                <div>{item.price}</div>
                                <div>
                                    <button onClick={() => decreaseQty(item)}>-</button>
                                    <input type="number" value={item.quantity} className="onlyNumber shadow appearance-none border border-green-300 rounded w-12 py-1 px-1 text-gray-700 leading-tight focus:outline-none focus:shadow-outline m-2" onChange={(e) => quantityChange(item, e.target.value)} />
                                    <button onClick={() => increaseQty(item)}>+</button>
                                </div>
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
                    (<div>

                        <div className="ml-3 mt-3 mb-3">
                            <h4>Shipping Information</h4>
                            <p><b>Address:</b> Dhaka</p>
                            <p><b>Phone:</b> 0171000000</p>
                        </div>
                        <hr />
                        <div className="ml-3 mt-3 mb-3">
                            <h4>Costing Information</h4>
                            <div align="left" className="">
                                <p><b>Total Items:</b> {cart.length}</p>
                                <p><b>Sub Total:</b>{subTotal}</p>
                                <p><b>Shipping Charge:</b>{shippingCharge}</p>
                                <p><b>Total Amount:</b>{subTotal + shippingCharge}</p>
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