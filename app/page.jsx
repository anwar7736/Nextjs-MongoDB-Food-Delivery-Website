"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export default function Home() {
  const [locations, setLocations] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [showLocations, setShowLocations] = useState(false);
  const [restaurantInput, setRestaurantInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchError, setSearchError] = useState("");
  const [searchAttempt, setSearchAttempt] = useState(0);
  const locationRef = useRef(null);

  const filteredLocations = useMemo(() => {
    const query = locationQuery.trim().toLowerCase();
    return query
      ? locations.filter((location) => location.toLowerCase().includes(query))
      : locations;
  }, [locationQuery, locations]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/v1/customer/locations", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load locations.");
        return response.json();
      })
      .then((result) => {
        if (result.success) setLocations(result.data);
      })
      .catch((error) => {
        if (error.name !== "AbortError") console.error("Location lookup failed:", error);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setSearchError("");
      try {
        const query = new URLSearchParams({
          location: selectedLocation,
          restaurant: restaurantInput.trim(),
        });
        const response = await fetch(`/api/v1/customer?${query}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Restaurant search is temporarily unavailable.");
        const result = await response.json();
        if (!result.success) throw new Error(result.message || "Restaurant search is temporarily unavailable.");
        setRestaurants(result.data);
      } catch (error) {
        if (error.name !== "AbortError") {
          setRestaurants([]);
          setSearchError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [selectedLocation, restaurantInput, searchAttempt]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setShowLocations(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  const chooseLocation = (location) => {
    setSelectedLocation(location);
    setLocationQuery("");
    setShowLocations(false);
  };

  return (
    <main>
      <section className="main-page-banner">
        <p className="hero-eyebrow">Your AI-powered food assistant</p>
        <h1 className="app-header-title">FoodFlow AI</h1>
        <p className="hero-description">
          Chat for restaurant and food recommendations, then place your order right in the conversation.
        </p>

        <div className="input-wrapper home-search">
          <div className="search-location" ref={locationRef}>
            <label className="sr-only" htmlFor="location-search">Choose a city</label>
            <input
              id="location-search"
              type="text"
              value={showLocations ? locationQuery : selectedLocation || "All locations"}
              onFocus={() => {
                setLocationQuery(selectedLocation);
                setShowLocations(true);
              }}
              onChange={(event) => {
                setLocationQuery(event.target.value);
                setShowLocations(true);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") setShowLocations(false);
              }}
              placeholder="Choose a city"
              autoComplete="off"
              role="combobox"
              aria-expanded={showLocations}
              aria-controls="location-options"
              aria-autocomplete="list"
            />
            <span className="location-chevron" aria-hidden="true">⌄</span>
            {showLocations && (
              <ul className="location-list" id="location-options" role="listbox">
                <li role="option" aria-selected={!selectedLocation}>
                  <button type="button" onClick={() => chooseLocation("")}>All locations</button>
                </li>
                {filteredLocations.map((location) => (
                  <li key={location} role="option" aria-selected={selectedLocation === location}>
                    <button type="button" onClick={() => chooseLocation(location)}>{location}</button>
                  </li>
                ))}
                {filteredLocations.length === 0 && locationQuery && (
                  <li className="location-no-results">No cities match “{locationQuery}”.</li>
                )}
              </ul>
            )}
          </div>

          <div className="search-query">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.8" />
              <path d="m16 16 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <label className="sr-only" htmlFor="restaurant-search">Search restaurants</label>
            <input
              id="restaurant-search"
              type="search"
              value={restaurantInput}
              onChange={(event) => setRestaurantInput(event.target.value)}
              placeholder="Restaurant or cuisine"
              autoComplete="off"
            />
            {restaurantInput && (
              <button
                className="search-clear"
                type="button"
                onClick={() => setRestaurantInput("")}
                aria-label="Clear restaurant search"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <p className="search-hint">Search by restaurant name and filter by city</p>
      </section>

      <section className="search-results" aria-live="polite">
        <div className="results-heading">
          <div>
            <p className="eyebrow">Explore local favorites</p>
            <h2>{selectedLocation ? `Restaurants in ${selectedLocation}` : "Restaurants near you"}</h2>
          </div>
          {!isLoading && !searchError && (
            <span className="results-count">
              {restaurants.length} {restaurants.length === 1 ? "restaurant" : "restaurants"}
            </span>
          )}
        </div>

        {isLoading && (
          <div className="search-state" role="status">
            <span className="search-spinner" aria-hidden="true" />
            <span>Finding delicious options…</span>
          </div>
        )}
        {!isLoading && searchError && (
          <div className="search-state search-error" role="status">
            <p>{searchError} Check your connection and try again.</p>
            <button type="button" onClick={() => {
              setSearchError("");
              setSearchAttempt((attempt) => attempt + 1);
            }}>
              Try again
            </button>
          </div>
        )}
        {!isLoading && !searchError && restaurants.length === 0 && (
          <div className="search-state">
            <span className="empty-search-icon" aria-hidden="true">⌕</span>
            <p>No restaurants found. Try another name or city.</p>
          </div>
        )}
        {!isLoading && !searchError && restaurants.length > 0 && (
          <div className="restaurant-list-container">
            {restaurants.map((restaurant) => (
              <Link
                key={restaurant._id}
                href={`/explore/${restaurant._id}`}
                className="restaurant-wrapper"
              >
                <div className="restaurant-card-icon" aria-hidden="true">✦</div>
                <div className="heading-wrapper">
                  <h3>{restaurant.name}</h3>
                  <span className="restaurant-city">{restaurant.city}</span>
                  <p>{restaurant.address}</p>
                  <span className="restaurant-contact">{restaurant.phone}</span>
                </div>
                <span className="restaurant-card-arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
