"use client";
import { useForm } from "react-hook-form";
import { useRouter } from 'next/navigation'
import { toast } from "react-toastify";
import ValidationError from "@/app/_components/ValidationError";
import { useEffect, useState } from "react";
import withAuth from "@/app/hoc/withAuth";
const EditFood = ({ params }) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm();
  const router = useRouter();
  const [isDisabled, setIsDisabled] = useState(false);
  const _id = params.id;
  const getFoodItem = async () => {
    let res = await fetch(`/api/v1/restaurant/food/${_id}`);
    res = await res.json();
    if (res.success) {
      setValue("name", res.data.name);
      setValue("price", res.data.price);
      setValue("image", res.data.image);
    }
  }
  useEffect(() => {
    getFoodItem();
  }, []);

  const submitFormHandler = async (data) => {
    setIsDisabled(true);
    let res = await fetch(`/api/v1/restaurant/food/${_id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });

    res = await res.json();
    if (res.success) {
      toast.success(res.message);
      router.push('/restaurant/dashboard');
    }
    else {
      setIsDisabled(false);
      toast.error(res.message);
      console.log(res);
    }
  }

  return (
    <div align="center">
      <h2 className="font-bold">Edit Food Item</h2>
      <div className="w-full max-w-xs">
        <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={handleSubmit(submitFormHandler)}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="name">
              Name
            </label>
            <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="name" type="text" placeholder="Name" {...register("name", {
              required: 'This field is required.', minLength: {
                value: 3,
                message: "This should be atleast 3 characters."
              }
            })} />
            {errors.name && <ValidationError message={errors.name.message} />}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="price">
              Price
            </label>
            <input className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="price" type="number" placeholder="Price" {...register("price", { required: 'This field is required.' })} />
            {errors.price && <ValidationError message={errors.price.message} />}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="image">
              Image Link
            </label>
            <textarea name="image" id="image" className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" type="text" placeholder="Image Link" {...register("image", { required: 'This field is required.' })}>

            </textarea>
            {errors.image && <ValidationError message={errors.image.message} />}
          </div>
          <div className="flex items-center justify-between">
            <button
              disabled={isDisabled}
              className={`bg-green-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isDisabled ? 'cursor-not-allowed opacity-50' : ''
                }`}
              type="submit">
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default withAuth(EditFood)