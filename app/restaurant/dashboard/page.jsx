"use client";
import AddFood from "@/app/_components/restaurant/food/AddFood";
import FoodList from "@/app/_components/restaurant/food/FoodList";
import OrderList from "@/app/_components/restaurant/OrderList";
import withAuth from "@/app/hoc/withAuth";
import {useState } from "react"

const Dashboard = () => {
  const [status, setStatus] = useState(1);
  return (
    <div align="center">
        <title>Restaurant Dashboard</title>
        <button onClick={()=> setStatus(1)} className="btn bg-green-500 p-1 m-1">Food List</button>
        <button onClick={()=> setStatus(2)} className="btn bg-blue-500 p-1 m-1">Add Food</button>
        <button onClick={()=> setStatus(3)} className="btn bg-gray-500 p-1 m-1">Order List</button>
        {

          status == 1 ? <FoodList /> : (status == 2 ? <AddFood setStatus={setStatus} /> : <OrderList setStatus={setStatus} />)
        }
    </div>
  )
}

export default withAuth(Dashboard)