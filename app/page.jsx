"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const [locations, setLocations] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showLocation, setShowLocation] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadLocations();
    loadRestaurants()
  }, [])

  const loadLocations = async () => {
    // let response = await fetch('http://localhost:3000/api/customer/locations');
    // response = await response.json()
    // if (response.success) {
    //   setLocations(response.result)
    // }

    setLocations(["Dhaka", "Khulna", "Jessore", "Rangpur"]);
  }

  const loadRestaurants = async (params) => {
    // let url="http://localhost:3000/api/customer";
    // if(params?.location){
    //   url=url+"?location="+params.location
    // }else if(params?.restaurant){
    //   url=url+"?restaurant="+params.restaurant
    // }
    // let response = await fetch(url);
    // response = await response.json()
    // if (response.success) {
    //   setRestaurants(response.result)
    // }

    setRestaurants([
      {_id:1,name:"Test", email:'test@gmail.com', contact:'011232', address: 'test address', city: 'Dhaka'},
      {_id:2,name:"Test", email:'test@gmail.com', contact:'011232', address: 'test address', city: 'Dhaka'},
      {_id:3,name:"Test", email:'test@gmail.com', contact:'011232', address: 'test address', city: 'Dhaka'},
      {_id:4,name:"Test", email:'test@gmail.com', contact:'011232', address: 'test address', city: 'Dhaka'},
      {_id:5,name:"Test", email:'test@gmail.com', contact:'011232', address: 'test address', city: 'Dhaka'},
      {_id:6,name:"Test", email:'test@gmail.com', contact:'011232', address: 'test address', city: 'Dhaka'},
      {_id:7,name:"Test", email:'test@gmail.com', contact:'011232', address: 'test address', city: 'Dhaka'},
      {_id:8,name:"Test", email:'test@gmail.com', contact:'011232', address: 'test address', city: 'Dhaka'},
      {_id:9,name:"Test", email:'test@gmail.com', contact:'011232', address: 'test address', city: 'Dhaka'},
      {_id:10,name:"Test", email:'test@gmail.com', contact:'011232', address: 'test address', city: 'Dhaka'},
    ])
  }


  const handleListItem = (item) => {
    setSelectedLocation(item)
    setShowLocation(false)
    loadRestaurants({ location: item })
  }
  return (
    <main className="">
      <div className="main-page-banner">
        <h1 className="app-header-title">Food Delivery App</h1>
        <div className="input-wrapper">
          <input type="text" value={selectedLocation}
            onClick={() => setShowLocation(true)}
            className="select-input" placeholder="Select Place" />
          <ul className="location-list">
            {
              showLocation && locations.map((item) => (
                <li onClick={() => handleListItem(item)}>{item}</li>
              ))
            }
          </ul>

          <input type="text" className="search-input"
            onChange={(event) => loadRestaurants({ restaurant: event.target.value })}
            placeholder="Enter food or restaurant name" />
        </div>
      </div>
      <div className="restaurant-list-container">
        {
          restaurants.map((item) => (
            <div onClick={() => router.push('explore/' + item.name + '?id=' + item._id)} className="restaurant-wrapper">
              <div className="heading-wrapper">
                <h3>{item.name}</h3>
                <h5>Contact:{item.contact}</h5>
              </div>
              <div className="address-wrapper">
                <div>{item.city},</div>
                <div className="address"> {item.address}, Email: {item.email}</div>

              </div>
            </div>
          ))
        }
      </div>
    </main>
  );
}
