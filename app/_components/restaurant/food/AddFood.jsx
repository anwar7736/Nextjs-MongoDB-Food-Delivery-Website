import { useForm } from "react-hook-form";
import { useRouter } from 'next/navigation'
import toast from 'cogo-toast-react-17-fix';
import ValidationError from "../../ValidationError";
import { restaurant_auth } from "@/app/helpers/helper";
const AddFood = (props) => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const submitFormHandler = async (data) => {
    const restaurant = await restaurant_auth();
    data.restaurant_id = restaurant._id;
    console.log(data);
    
    let res = await fetch("/api/v1/restaurant/food", {
        method: "POST",
        body: JSON.stringify(data)
    });

    res = await res.json(); 
    if(res.success)
    {
        props.setStatus(1);
        toast.success(res.message);
    }
    else{
        toast.error(res.message);
        console.log(res);
    }
  }

  return (
    <div align="center">
      <h2 className="font-bold">Add New Food Item</h2>
      <div className="w-full max-w-xs">
        <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={ handleSubmit(submitFormHandler)}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="name">
              Name
            </label>
            <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="name" type="text" placeholder="Name" {...register("name", { required: 'This field is required.', minLength: {
              value: 3,
              message: "This should be atleast 3 characters."
            } })} />
            {errors.name && <ValidationError message={errors.name.message}/>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="price">
              Price
            </label>
            <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="price" type="number" placeholder="Price" {...register("price", { required: 'This field is required.'})} />
            {errors.price && <ValidationError message={errors.price.message} /> }
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="image">
              Image Link
            </label>
            <textarea name="image" id="image" className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" type="text" placeholder="Image Link" {...register("image", { required: 'This field is required.'})}></textarea>
            {errors.image && <ValidationError message={errors.image.message} />}
          </div>
          <div className="flex items-center justify-between">
            <button className="bg-purple-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddFood