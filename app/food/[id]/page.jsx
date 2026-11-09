"use client";

import ImageWithFallback from "@/app/_components/ImageWithFallback";
import { CartContext } from "@/app/contexts/CartContext";
import { session } from "@/app/helpers/SessionHelper";
import { isUserAuth } from "@/app/helpers/helper";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

const DetailIcon = ({ type }) => {
  const paths = {
    location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    phone: <path d="M7 3h3l2 5-2 1.5a15 15 0 0 0 4.5 4.5L16 12l5 2v3c0 1.1-.9 2-2 2C10 19 5 14 4 5c0-1.1.9-2 2-2Z" />,
    email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    restaurant: <><path d="M4 21h16M6 21V8h12v13M4 8h16l-2-5H6L4 8Z" /><path d="M9 12h2m2 0h2m-6 4h2m2 0h2" /></>,
  };

  return (
    <span className="food-detail-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {paths[type]}
      </svg>
    </span>
  );
};

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
          <p className="food-detail-description">
            {food.description || "Freshly prepared with care. Add this delicious choice to your order."}
          </p>
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

      <section className="food-detail-restaurant" aria-labelledby="food-restaurant-heading">
        <div className="food-detail-restaurant-heading">
          <DetailIcon type="restaurant" />
          <div>
            <p className="food-detail-eyebrow">Prepared by</p>
            <h2 id="food-restaurant-heading">{restaurant.name}</h2>
          </div>
        </div>
        <div className="food-detail-restaurant-grid">
          <div className="food-detail-contact">
            <DetailIcon type="location" />
            <div><strong>Address</strong><span>{restaurant.address || "Address not available"}</span></div>
          </div>
          <div className="food-detail-contact">
            <DetailIcon type="location" />
            <div><strong>City</strong><span>{restaurant.city || "City not available"}</span></div>
          </div>
          <div className="food-detail-contact">
            <DetailIcon type="phone" />
            <div><strong>Call us</strong><span>{restaurant.phone || "Phone not available"}</span></div>
          </div>
          <div className="food-detail-contact">
            <DetailIcon type="email" />
            <div><strong>Email</strong><span>{restaurant.email || "Email not available"}</span></div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default FoodDetails;
