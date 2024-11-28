"use client";
import { CartContext } from "@/app/contexts/CartContext";
import { session, session_destroy } from "@/app/helpers/helper";
import { useContext, useEffect, useState } from "react";

const Explore = (props) => {
    const _id = props.params.id;
    const {cart, setCart} = useContext(CartContext);
    const [restaurantDetails, setRestaurantDetails] = useState([]);
    const [foodItems, setFoodItems] = useState([]);
    const [cartIds, setCartIds] = useState(cart ? () => cart.map(item => item._id) : [] );

    const getRestaurantDetails = async () =>
    {
      let res = await fetch(`/api/v1/restaurant/food?restaurant_id=${_id}`);
          res = await res.json();
      if(res.success)
      {
        setRestaurantDetails(res.restaurantDetails);
        setFoodItems(res.foodItems);
        
      }
    }
    const addToCart = (item) => {
      if(cart.length > 0)
      {
        if(cart[0].restaurant_id != item.restaurant_id)
        {
          session_destroy('cart');
        }

        let cartItems = session('cart');
        cartItems.push(item);
        session('cart', cartItems);
      }
      else{
        session('cart', [item]);
      }

      let storedCartIds = cartIds;
      storedCartIds.push(item._id);
      setCartIds(storedCartIds);
      setCart(session('cart'));
    }

    const removeFromCart = (id) => {
      let cartItems = cart.filter(item => item._id != id);
      if(cartItems.length > 0)
      {
        session('cart', cartItems);
      }
      else {
        session_destroy('cart');
      }

      let storedCartIds = cartIds.filter(item => item != id);
      setCartIds(storedCartIds);
      setCart(session('cart'));
    }

    useEffect(()=>{
      getRestaurantDetails();
      
    }, []);

  return (
    <div>
        <div className="restaurant-page-banner">
            <h1>{restaurantDetails?.name && decodeURI(restaurantDetails.name)}</h1>
        </div>
        <div className="details-wrapper">
                <h4>Contact : {restaurantDetails?.phone}</h4>
                <h4>City:{restaurantDetails?.city}</h4>
                <h4>Address:{restaurantDetails?.address}</h4>
                <h4>Email:{restaurantDetails?.email}</h4>
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
                          {
                              cartIds.includes(item._id)
                              ? 
                              (<button className="remove_button" onClick={()=> removeFromCart(item._id)}>Remove From Cart</button>)
                              :
                              (<button className="add_button" onClick={()=> addToCart(item)}>Add to Cart</button>)
                          }

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