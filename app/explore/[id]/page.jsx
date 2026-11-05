"use client";
import { CartContext } from "@/app/contexts/CartContext";
import { session } from "@/app/helpers/SessionHelper";
import { toast } from "react-toastify";
import { useContext, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ImageWithFallback from "../../_components/ImageWithFallback";

const Explore = () => {
  const params = useParams();
  const _id = params.id;
  const { cart, setCart } = useContext(CartContext);
  const [restaurantDetails, setRestaurantDetails] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const getRestaurantDetails = async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const response = await fetch(`/api/v1/restaurant/food?restaurant_id=${encodeURIComponent(_id)}`);
      const result = await response.json();
      if (!response.ok || !result.success || !result.restaurantDetails) {
        throw new Error(result.message || "Unable to load this restaurant.");
      }
      setRestaurantDetails(result.restaurantDetails);
      setFoodItems(result.foodItems || []);
    } catch (error) {
      console.error("Restaurant foods loading failed:", error);
      setLoadError("Unable to load this restaurant's menu. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }
  const addToCart = (item) => {
    setIsDisabled(true);
    const cartItem = {
      ...item,
      restaurant_id: item.restaurant_id || _id,
      restaurant_name: restaurantDetails?.name || "Restaurant",
      quantity: 1,
    };
    const cartItems = session('cart') || [];
    const index = cartItems.findIndex((cart) => cart._id === item._id);
    if (index !== -1) {
      cartItems[index].quantity = Math.min(99, Number(cartItems[index].quantity) + 1);
    }
    else {
      cartItems.push(cartItem);
    }
    session('cart', cartItems);
    setCart(cartItems);
    setIsDisabled(false);
    toast.success("Item added to cart.");
  }

  useEffect(() => {
    if (_id) getRestaurantDetails();
  }, [_id]);

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
        {isLoading ? (
          <p className="text-center" role="status">Loading menu…</p>
        ) : loadError ? (
          <p className="text-center text-red-600" role="alert">{loadError}</p>
        ) : foodItems.length > 0 ? (
          <div className="food-card-grid">
            {foodItems.map((item) => (
              <article className="food-card" key={item._id}>
                <ImageWithFallback src={item.image} alt={item.name} />
                <div className="food-card-content">
                  <h2>{item.name}</h2>
                  <p className="food-card-price">Tk {Number(item.price).toFixed(2)}</p>
                  {item.description && <p className="description">{item.description}</p>}
                  <button disabled={isDisabled}
                    className={`add_button ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
                    onClick={() => addToCart(item)}>Add to Cart</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <h1 className="text-center text-red-600">No food items found for this restaurant.</h1>
        )}
      </div>
    </div>
  )
}

export default Explore