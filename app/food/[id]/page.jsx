"use client";

import ImageWithFallback from "@/app/_components/ImageWithFallback";
import { CartContext } from "@/app/contexts/CartContext";
import { session } from "@/app/helpers/SessionHelper";
import { isUserAuth } from "@/app/helpers/helper";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import RestaurantContactCard from "@/app/_components/RestaurantContactCard";

const FoodDetails = () => {
  const { id } = useParams();
  const router = useRouter();
  const { setCart } = useContext(CartContext);
  const [food, setFood] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const loadFoodDetails = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await fetch(`/api/v1/customer/food/${encodeURIComponent(id)}`);
        const result = await response.json();
        if (!response.ok || !result.success || !result.data?.food || !result.data?.restaurant) {
          throw new Error(result.message || "Unable to load food details.");
        }
        setFood(result.data.food);
        setRestaurant(result.data.restaurant);
      } catch (error) {
        console.error("Food details loading failed:", error);
        setLoadError("Unable to load this food item. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) loadFoodDetails();
  }, [id]);

  const addFoodToCart = () => {
    if (!food || !restaurant) return;

    const existingCart = session("cart") || [];
    const itemIndex = existingCart.findIndex((item) => item._id === food._id);
    const updatedCart = [...existingCart];
    if (itemIndex >= 0) {
      updatedCart[itemIndex] = {
        ...updatedCart[itemIndex],
        quantity: Math.min(99, Number(updatedCart[itemIndex].quantity) + quantity),
      };
    } else {
      updatedCart.push({
        ...food,
        restaurant_id: String(restaurant._id),
        restaurant_name: restaurant.name || "Restaurant",
        quantity,
      });
    }

    session("cart", updatedCart);
    setCart(updatedCart);
    toast.success("Item added to cart.");
  };

  const orderNow = () => {
    addFoodToCart();
    if (!isUserAuth()) {
      session("redirect_url", "/place_order");
      router.push("/user");
      return;
    }
    router.push("/place_order");
  };

  const updateQuantity = (change) => {
    setQuantity((current) => Math.min(99, Math.max(1, current + change)));
  };

  if (isLoading) {
    return <main className="food-detail-state" role="status">Loading food details…</main>;
  }

  if (loadError || !food || !restaurant) {
    return (
      <main className="food-detail-state food-detail-error" role="alert">
        <p>{loadError || "This food item could not be found."}</p>
        <Link href="/">Back to restaurants</Link>
      </main>
    );
  }

  return (
    <main className="food-detail-page">
      <Link href={`/explore/${restaurant._id}`} className="food-detail-back">
        <span aria-hidden="true">←</span> Back to {restaurant.name}
      </Link>
      <section className="food-detail-card">
        <div className="food-detail-image-wrap">
          <ImageWithFallback src={food.image} alt={food.name} />
          <span className="food-detail-image-tag">Made fresh for you</span>
        </div>
        <div className="food-detail-copy">
          <p className="food-detail-eyebrow">A local favorite</p>
          <h1>{food.name}</h1>
          <p className="food-detail-price">Tk {Number(food.price).toFixed(2)}</p>
          {food.description ? (
            <div className="food-detail-description rich-text-output" dangerouslySetInnerHTML={{ __html: food.description }} />
          ) : (
            <p className="food-detail-description">
              Freshly prepared with care. Add this delicious choice to your order.
            </p>
          )}
          <div className="food-detail-order-row">
            <div className="food-detail-quantity" aria-label="Choose quantity">
              <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => updateQuantity(-1)}>−</button>
              <output aria-live="polite">{quantity}</output>
              <button type="button" aria-label="Increase quantity" disabled={quantity >= 99} onClick={() => updateQuantity(1)}>+</button>
            </div>
            <strong className="food-detail-subtotal">Tk {(Number(food.price) * quantity).toFixed(2)}</strong>
          </div>
          <div className="food-detail-actions">
            <button type="button" className="food-detail-add" onClick={addFoodToCart}>
              <span aria-hidden="true">＋</span> Add to Cart
            </button>
            <button type="button" className="food-detail-order" onClick={orderNow}>
              Order Now <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>

      <RestaurantContactCard restaurant={restaurant} />
    </main>
  );
};

export default FoodDetails;
