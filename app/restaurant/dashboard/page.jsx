"use client";
import AddFood from "@/app/_components/restaurant/food/AddFood";
import FoodList from "@/app/_components/restaurant/food/FoodList";
import OrderList from "@/app/_components/restaurant/OrderList";
import withAuth from "@/app/hoc/withAuth";
import { useState } from "react"

const Dashboard = () => {
  const [status, setStatus] = useState(1);
  return (
    <div align="center">
      <title>Restaurant Dashboard</title>
      <div className="flex justify-center m-3">
        <button onClick={() => setStatus(1)} className="btn bg-green-600 p-2 rounded text-white ">Food List</button>
        &nbsp;
        <button onClick={() => setStatus(2)} className="btn bg-blue-600 p-2 rounded text-white ">Add Food</button>
        &nbsp;
        <button onClick={() => setStatus(3)} className="btn bg-gray-600 p-2 rounded text-white ">Order List</button>
      </div>
      {

        status == 1 ? <FoodList /> : (status == 2 ? <AddFood setStatus={setStatus} /> : <OrderList setStatus={setStatus} />)
      }
    </div>
  )
}

export default withAuth(Dashboard)