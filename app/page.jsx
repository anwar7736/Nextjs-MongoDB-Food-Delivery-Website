"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const [locations, setLocations] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showLocation, setShowLocation] = useState(false);
  const [restaurantInput, setRestaurantInput] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadLocations();
    loadRestaurants({location: '', restaurant: ''});
  }, [])

  const loadLocations = async () => {
    let response = await fetch('/api/v1/customer/locations');
    response = await response.json()
    if (response.success) 
    {
      setLocations(response.data);
    }
  }

  const loadRestaurants = async ({location = selectedLocation, restaurant = restaurantInput}) => {
    let url=`/api/v1/customer?location=${location}&restaurant=${restaurant}`;
    let response = await fetch(url);
    response = await response.json()
    if (response.success) 
    {
      setRestaurants(response.data);
    }
  }


  const handleListItem = (item) => 
  {
    setSelectedLocation(item);
    setShowLocation(false);
    loadRestaurants({location:item});
  }

  const handleRestaurantInput = (value) =>
  {
    setRestaurantInput(value);
    loadRestaurants( {restaurant:value});
  }

  return (
    <main className="">
      <title>Home</title>
      <div className="main-page-banner">
        <h1 className="app-header-title">Food Delivery App</h1>
        <div className="input-wrapper">
          <input type="text" value={selectedLocation}
            onChange={() => setShowLocation(true)}
            onClick={() => setShowLocation(true)}
            className="select-input" placeholder="Select Place" />
          <ul className="location-list">
            {
              showLocation && <li key={0} onClick={() => handleListItem('')}>All Locations</li>
            }
            {
              showLocation && locations.map((item, key) => (
                <li key={key+1} onClick={() => handleListItem(item)}>{item}</li>
              ))
            }
          </ul>

          <input type="text" className="search-input"
            value={restaurantInput}
            onChange={(e) => handleRestaurantInput(e.target.value)}
            placeholder="Enter food or restaurant name" />
        </div>
      </div>
      <div className="restaurant-list-container">
  {
    restaurants.map((item) => (
      <Link
        key={item._id}
        href={`explore/${item._id}`}
        className="restaurant-wrapper bg-green-200 my-2 p-4 border rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
      > 
        <div className="heading-wrapper text-left mb-2">
          <h3 className="text-lg md:text-xl font-semibold">{item.name}</h3>
          <h6 className="text-sm md:text-base text-gray-600">Phone: {item.phone}</h6>
          <h6 className="text-sm md:text-base text-gray-600">Email: {item.email}</h6>
          <h6 className="text-sm md:text-base text-gray-600">City: {item.city}</h6>
          <h6 className="text-sm md:text-base text-gray-600">Address: {item.address}</h6>
        </div>
      </Link>
    ))
  }
</div>

    </main>
  );
}
