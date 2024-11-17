"use client";
import { useEffect, useState } from "react";

const Explore = (props) => {
    const _id = props.params.id;
    const [restaurantDetails, setRestaurantDetails] = useState([]);
    const [foodItems, setFoodItems] = useState([]);
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
                  <div className="list-item">
                      <div><img style={{ width: 100 }} src={item.image} /></div>

                      <div>
                          <div>{item.name}</div>
                          <div>{item.price}</div>
                          <div className="description">{item.description}</div>
                          {
                              // cartIds.includes(item._id) ?
                                  // <button  onClick={()=>removeFromCart(item._id)} >Remove From Cart</button>
                                  <button className="">Add to Cart</button>

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