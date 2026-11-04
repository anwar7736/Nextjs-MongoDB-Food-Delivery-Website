import { restaurant_auth } from "@/app/helpers/helper";
import Link from "next/link";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
const FoodList = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [isDisabled, setIsDisabled] = useState(false);
  const getFoodList = async () => {
    try {
      const restaurant = await restaurant_auth();
      const response = await fetch(`/api/v1/restaurant/food?restaurant_id=${restaurant._id}`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load food items.");
      }
      setFoodItems(result.foodItems || []);
    } catch (error) {
      console.error("Food list loading failed:", error);
      toast.error("Unable to load food items.");
    }
  }

  const deleteItem = async (_id) => {
    const confirmation = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    });
    if (!confirmation.isConfirmed) return;

    setIsDisabled(true);
    try {
      const response = await fetch(`/api/v1/restaurant/food/${_id}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        toast.error(result.message || "Unable to delete this food item.");
        return;
      }
      setFoodItems((items) => items.filter((item) => item._id !== _id));
      Swal.fire({
        title: "Deleted!",
        text: result.message,
        icon: "success"
      });
    } catch (error) {
      console.error("Food item deletion failed:", error);
      toast.error("Unable to delete this food item.");
    } finally {
      setIsDisabled(false);
    }
  }

  useEffect(() => {
    getFoodList();
  }, []);

  return (
    <div>
      <h4>List of All Food Item</h4>
      <div className="relative hidden overflow-x-auto shadow-md sm:block sm:rounded-lg">
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
              foodItems.map((item) => (
                <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600" key={item?._id}>
                  <td scope="row" className="flex items-center px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    <img className="w-10 h-10 rounded-full" src={item?.image} alt={item?.name} />
                  </td>
                  <td className="px-6 py-4">
                    {item?.name}
                  </td>
                  <td className="px-6 py-4">
                    Tk {item?.price}
                  </td>
                  <td className="px-6 py-4 flex" >
                    <Link href={`/restaurant/edit_food/${item?._id}`} className="bg-green-600 p-2 text-white rounded">Edit</Link>
                    &nbsp;
                    <button 
                      disabled={isDisabled}
                      className={`bg-red-600 p-2 text-white rounded ${isDisabled ? 'cursor-not-allowed opacity-50' : ''
                        }`}
                    onClick={() => deleteItem(item?._id)}>Delete</button>
                  </td>
                </tr>
              )
              )
            }
          </tbody>
        </table>
      </div>
      <div className="food-dashboard-cards sm:hidden">
        {foodItems.length === 0 ? (
          <p className="dashboard-empty-card">No food items yet. Add your first menu item.</p>
        ) : foodItems.map((item) => (
          <article className="food-dashboard-card" key={item._id}>
            <img src={item.image} alt={item.name} />
            <div className="food-dashboard-card-details">
              <h5>{item.name}</h5>
              <p>Tk {Number(item.price).toFixed(2)}</p>
              <div className="food-dashboard-card-actions">
                <Link href={`/restaurant/edit_food/${item._id}`} className="bg-green-600 p-2 text-white rounded">Edit</Link>
                <button
                  disabled={isDisabled}
                  className={`bg-red-600 p-2 text-white rounded ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
                  onClick={() => deleteItem(item._id)}
                >Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default FoodList