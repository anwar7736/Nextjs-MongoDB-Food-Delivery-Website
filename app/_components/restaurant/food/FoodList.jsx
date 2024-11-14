import { restaurant_auth } from "@/app/helpers/helper";
import Link from "next/link";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
const FoodList = () => {
  const [foodItem, setFoodItem] = useState([]);
  const getFoodList = async () => {
      const restaurant = await restaurant_auth();
      let res = await fetch(`/api/v1/restaurant/food?restaurant_id=${restaurant._id}`)
          res = await res.json();
      if(res.success)
      {
        setFoodItem(res.data);
        
      }
    
  }

  const deleteItem = async (_id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    }).then(async (result) => {
      if (result.isConfirmed) 
      {
        let res = await fetch(`/api/v1/restaurant/food/${_id}`, {
          method: "DELETE"
        })
        res = await res.json();
        if(res.success)
        {
            getFoodList();
            Swal.fire({
              title: "Deleted!",
              text: res.message,
              icon: "success"
            });
        }

      }
    });
  }

  useEffect(() => {
    getFoodList();
  }, []);
  
  return (
    <div>
      <h4>List of All Food Item</h4>
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">
                Image
              </th>
              <th scope="col" className="px-6 py-3">
                Name
              </th>
              <th scope="col" className="px-6 py-3">
                Price
              </th>
              <th scope="col" className="px-6 py-3">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {
              foodItem.map( (item) => (
                <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600" key={item._id}> 
                <td scope="row" className="flex items-center px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                  <img className="w-10 h-10 rounded-full" src={item.image} alt="Jese image" />
                </td>
                <td className="px-6 py-4">
                    {item.name}
                </td>
                <td className="px-6 py-4">
                  ${item.price}
                </td>
                <td className="px-6 py-4">
                  <Link href={`/restaurant/edit_food/${item._id}`} className="bg-green-500 p-2 text-white">Edit</Link>
                  &nbsp;
                  <button onClick={() => deleteItem(item._id)} className="bg-red-500 p-2 text-white">Delete</button>
                </td>
              </tr>
              )  
            )
            }
          </tbody>
        </table>
      </div>

    </div>
  )
}

export default FoodList