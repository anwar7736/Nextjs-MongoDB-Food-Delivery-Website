"use client";
import AddFood from "@/app/_components/restaurant/food/AddFood";
import FoodList from "@/app/_components/restaurant/food/FoodList";
import { useState } from "react"

const Dashboard = () => {
  const [status, setStatus] = useState(1);
  return (
    <div className="container">
        <button onClick={()=> setStatus(1)} className="btn bg-green-500 p-1 m-1">Food List</button>
        <button onClick={()=> setStatus(0)} className="btn bg-blue-500 p-1 m-1">Add Food</button>
        {
          status == 1 ? <FoodList /> : <AddFood setStatus={setStatus} />
        }
    </div>
  )
}

export default Dashboard