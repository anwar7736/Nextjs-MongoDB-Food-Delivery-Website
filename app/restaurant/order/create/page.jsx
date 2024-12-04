"use client";
import { useForm } from "react-hook-form";
import { useRouter } from 'next/navigation'
import toast from 'cogo-toast-react-17-fix';
import ValidationError from "@/app/_components/ValidationError";
import { restaurant_auth } from "@/app/helpers/helper";
import withAuth from "@/app/hoc/withAuth";
import { useEffect, useState } from "react";
const PlaceOrder = () => {
    const router = useRouter();
    const [customers, setCustomers] = useState([]);
    const [deliveries, setDeliveries] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [foodItems, setFoodItems] = useState([]);
    const [rows, setRows] = useState([{ id: "", quantity: 0, price: 0 }]);
    const [summary, setSummary] = useState({ total: 0, shipping_charge: 50, final_total: 0 });
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm();

    const submitFormHandler = async (data) => {
        const restaurant = await restaurant_auth();
        data.restaurant_id = restaurant._id;
        data.total = summary.total;
        data.shipping_charge = summary.shipping_charge;
        data.final_total = summary.final_total;
        data.items = rows.filter(row => row.id != '' && row.quantity > 0 && row.price > 0);
        if(data.items.length == 0)
            {
                toast.error('Please choose atleast one item!');
                return;
            }
        let res = await fetch("/api/v1/order", {
            method: "POST",
            body: JSON.stringify(data)
        });

        res = await res.json();
        if (res.success) {
            toast.success(res.message);
            router.push('/restaurant/dashboard');
        }
        else {
            toast.error(res.message);
            console.log(res);
        }
    }

    const calculateRowTotal = async () => {
        let total = 0;
        let shipping_charge = summary.shipping_charge;
        rows.map(row => {
            total += row.quantity * row.price;
        });
        let final_total = total + shipping_charge;
        setSummary((prev) => ({ ...prev, total, shipping_charge, final_total }));
    }

    const onShippingChargeChange = (shipping_charge) => {
        shipping_charge = Number(shipping_charge);
        setSummary((prev) => ({ ...prev, shipping_charge }));
        let final_total = (Number(summary.total) + shipping_charge);
        setSummary((prev) => ({ ...prev, final_total }));
    }

    const addMoreRow = async () => {
        setRows(prevRows => [...prevRows, { id: "", quantity: 1, price: 0 }]);
        calculateRowTotal();
    }

    const removeRow = async (index) => {
        setRows(rows.filter((row, i) => i != index));
        calculateRowTotal();
    }

    const itemChange = async (index, id) => {
        const oldData = rows;
        const duplicateRows = rows.filter(row => id && row.id == id)
        const count = duplicateRows.length;
        if (count > 0 || !id) {
            oldData[index].id = "";
            oldData[index].price = 0;
            if(count > 0){
                toast.error('Duplicate item not allowed!');
            }
        }

        else {
            let res = await fetch(`/api/v1/restaurant/food/${id}`);
            res = await res.json();
            oldData[index].id = res.data._id;
            oldData[index].price = res.data.price;
        }

        setRows(oldData);
        calculateRowTotal();

    }

    const qtyChange = async (index, value) => {
        const oldData = rows;
        oldData[index].quantity = Number(value);
        setRows(oldData);
        calculateRowTotal();

    }

    const priceChange = async (index, value) => {
        const oldData = rows;
        oldData[index].price = Number(value);
        setRows(oldData);
        calculateRowTotal();

    }

    const getAllCustomers = async () => {
        let res = await fetch("/api/v1/user", {
            method: "GET",
        });

        res = await res.json();
        if (res.success) {
            setCustomers(res.data);
        }
    }

    const getAllDeliveries = async () => {
        const restaurant = await restaurant_auth();
        let res = await fetch(`/api/v1/delivery?city=${restaurant.city}`, {
            method: "GET",
        });

        res = await res.json();
        if (res.success) {
            setDeliveries(res.data);
        }
    }

    const getAllOrderStatuses = async () => {
        let res = await fetch("/api/v1/order/statuses", {
            method: "GET",
        });
        res = await res.json();
        if (res.success) {
            setStatuses(res.data);
        }
    }

    const getAllFoodItems = async () => {
        const restaurant = await restaurant_auth();
        let res = await fetch(`/api/v1/restaurant/food?restaurant_id=${restaurant._id}`, {
            method: "GET",
        });
        res = await res.json();
        if (res.success) {
            setFoodItems(res.foodItems);
        }
    }

    useEffect(() => {
        getAllCustomers();
        getAllDeliveries();
        getAllOrderStatuses();
        getAllFoodItems();
    }, []);

    return (
        <div align="center">
            <h2 className="font-bold mt-4">Place New Order</h2>
            <div className="w-full">
                <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={handleSubmit(submitFormHandler)}>
                    <div className="mb-4 flex justify-space-between">
                        <div className="ml-3">
                            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="name">
                                Customer
                            </label>
                            <select className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="user_id" {...register("user_id", { required: 'This field is required.' })} >
                                <option disabled selected value="">Select Any Customer</option>
                                {
                                    customers.map(customer => (
                                        <option value={customer._id}>{customer.name}</option>
                                    ))
                                }
                            </select>
                            {errors.user_id && <ValidationError message={errors.user_id.message} />}
                        </div>
                        <div className="ml-3">
                            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="name">
                                Delivery Partner
                            </label>
                            <select className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="delivery_partner_id" {...register("delivery_partner_id", { required: 'This field is required.' })} >
                                <option disabled selected value="">Select Any Delivery Partner</option>
                                {
                                    deliveries.map(delivery => (
                                        <option value={delivery._id}>{delivery.name}</option>
                                    ))
                                }
                            </select>
                            {errors.delivery_partner_id && <ValidationError message={errors.delivery_partner_id.message} />}
                        </div>
                        <div className="ml-3">
                            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="name">
                                Order Status
                            </label>
                            <select className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="status_id" {...register("status_id", { required: 'This field is required.' })} >
                                <option disabled selected value="">Select Any Status</option>
                                {
                                    statuses.map(status => (
                                        <option value={status._id}>{status.name}</option>
                                    ))
                                }
                            </select>
                            {errors.status_id && <ValidationError message={errors.status_id.message} />}
                        </div>
                    </div>
                    <div>
                        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Item</th>
                                    <th scope="col" className="px-6 py-3">Quantity</th>
                                    <th scope="col" className="px-6 py-3">Price</th>
                                    <th scope="col" className="px-6 py-3">Sub Total</th>
                                    <th scope="col" className="px-6 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    rows.map((row, index) => (
                                        <tr>
                                            <td>
                                                <select name="item_id[0]" className="shadow appearance-none border border-green-300 rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" value={row.id} onChange={(e) => itemChange(index, e.target.value)}>
                                                    <option value="" selected>Select Any Item</option>
                                                    {
                                                        foodItems.map((item, i) => (
                                                            <option key={i} value={item._id} selected={item.id == row.id} >{item.name}</option>
                                                        ))
                                                    }
                                                </select>
                                            </td>
                                            <td>
                                                <input type="number" name="quantity[]" value={row.quantity}
                                                    onChange={(e) => qtyChange(index, e.target.value)}
                                                    className="onlyNumber shadow appearance-none border border-green-300 rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" />
                                            </td>
                                            <td>
                                                <input type="number" name="price[]" value={row.price}
                                                    onChange={(e) => priceChange(index, e.target.value)}
                                                    className="onlyNumber shadow appearance-none border border-green-300 rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" />
                                            </td>
                                            <td>
                                                <input type="number" name="total[]"
                                                    value={row.quantity * row.price} readOnly
                                                    className="onlyNumber shadow appearance-none border border-green-300 rounded py-2 px-3 text-gray-
                                                bg-gray-200 leading-tight focus:outline-none focus:shadow-outline mb-1"/>
                                            </td>
                                            <td>
                                                {
                                                    index != 0 && (<button type="button" className="bg-red-600 px-3 text-white rounded" onClick={() => removeRow(index)}>-</button>)
                                                }
                                                &nbsp;
                                                <button type="button" className="bg-green-600 px-3 text-white rounded" onClick={() => addMoreRow()}>+</button>
                                            </td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                            <br />
                            <tfoot className="mt-5 mb-5">
                                <tr>
                                    <th>
                                        Sub Total:
                                    </th>
                                    <td>
                                        <input type="number" id="total" name="total" value={summary.total} readOnly className="onlyNumber shadow appearance-none border border-green-300 rounded py-2 px-3 text-gray-
                                            bg-gray-200 leading-tight focus:outline-none focus:shadow-outline mb-1"/>
                                    </td>
                                </tr>
                                <tr>
                                    <th>
                                        Shipping Charge:
                                    </th>
                                    <td>
                                        <input type="number" id="shipping_charge"
                                            value={summary.shipping_charge}
                                            onChange={(e) => onShippingChargeChange(e.target.value)}
                                            name="shipping_charge" className="onlyNumber shadow appearance-none border border-green-300 rounded py-2 px-3 text-gray-
                                                 leading-tight focus:outline-none focus:shadow-outline mb-1"/>
                                    </td>
                                </tr>
                                <tr>
                                    <th>
                                        Total Payable:
                                    </th>
                                    <td>
                                        <input type="number" id="final_total" name="final_total" value={summary.final_total} readOnly className="onlyNumber shadow appearance-none border border-green-300 rounded py-2 px-3 text-gray-
                                                bg-gray-200 leading-tight focus:outline-none focus:shadow-outline mb-1"/>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                        <div align="center" className="mt-5">
                            <button className="bg-black hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
                                Submit Order
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default withAuth(PlaceOrder)