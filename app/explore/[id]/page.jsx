"use client";
import { CartContext } from "@/app/contexts/CartContext";
import { session, session_destroy } from "@/app/helpers/SessionHelper";
import { toast } from "react-toastify";
import { useContext, useEffect, useState } from "react";

const Explore = (props) => {
  const _id = props.params.id;
  const { cart, setCart } = useContext(CartContext);
  const [restaurantDetails, setRestaurantDetails] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [isDisabled, setIsDisabled] = useState(false);

  const getRestaurantDetails = async () => {
    let res = await fetch(`/api/v1/restaurant/food?restaurant_id=${_id}`);
    res = await res.json();
    if (res.success) {
      setRestaurantDetails(res.restaurantDetails);
      setFoodItems(res.foodItems);

    }
  }
  const addToCart = (item) => {
    setIsDisabled(true);
    item.quantity = 1;
    if (cart.length > 0) {
      if (cart[0].restaurant_id != item.restaurant_id) {
        session_destroy('cart');
      }

      let cartItems = session('cart');
      let index = cartItems.findIndex(cart => cart._id == item._id);
      if (index != -1) {
        cartItems[index].quantity++;
      }
      else {
        cartItems.push(item);
      }

      session('cart', cartItems);
    }
    else {
      session('cart', [item]);
    }
    setCart(session('cart'));
    setIsDisabled(false);
    toast.success("Item added to cart.");
  }

  useEffect(() => {
    getRestaurantDetails();

  }, []);

  return (
    <div>
      <div className="restaurant-page-banner">
        <h1 className="text-lg">
          {restaurantDetails?.name && decodeURI(restaurantDetails.name)}
        </h1>


      </div>
      <div className="flex justify-between flex-wrap bg-green-200 p-2 text-sm text-black">
        <h4>Contact: {restaurantDetails?.phone}</h4>
        <h4>Email: {restaurantDetails?.email}</h4>
        <h4>City: {restaurantDetails?.city}</h4>
        <h4>Address: {restaurantDetails?.address}</h4>
      </div>

      <div className="food-list-wrapper">
        {
          foodItems.length > 0 ? foodItems.map((item) => (
            <div className="list-item" key={item._id}>
              <div><img style={{ width: 100 }} src={item.image} /></div>

              <div>
                <div>{item.name}</div>
                <div>{item.price}</div>
                <div className="description">{item.description}</div>
                <button disabled={isDisabled}
                  className={`add_button ${isDisabled ? 'cursor-not-allowed opacity-50' : ''
                    }`}
                   onClick={() => addToCart(item)}>Add to Cart</button>
              </div>

            </div>
          ))
            : <h1 className="text-center text-red-600"> No Food Items Found for This Restaurant </h1>
        }
      </div>
    </div>
  )
}

export default Explore