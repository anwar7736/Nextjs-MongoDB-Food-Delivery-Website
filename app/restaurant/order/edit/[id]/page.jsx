"use client";
import { useForm } from "react-hook-form";
import { useParams, useRouter } from 'next/navigation'
import { toast } from "react-toastify";
import ValidationError from "@/app/_components/ValidationError";
import { restaurant_auth } from "@/app/helpers/helper";
import withAuth from "@/app/hoc/withAuth";
import { useEffect, useState } from "react";
const EditOrder = () => {
    const params = useParams();
    const router = useRouter();
    const id = params.id;
    const [customers, setCustomers] = useState([]);
    const [deliveries, setDeliveries] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [foodItems, setFoodItems] = useState([]);
    const [rows, setRows] = useState([]);
    const [isDisabled, setIsDisabled] = useState(false);
    const [summary, setSummary] = useState({ total: 0, shipping_charge: 50, final_total: 0 });
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        reset,
    } = useForm();

    const submitFormHandler = async (data) => {
        setIsDisabled(true);
        data.total = summary.total;
        data.shipping_charge = summary.shipping_charge;
        data.final_total = summary.final_total;
        data.items = rows.filter(row => row.id !== '' && Number.isInteger(row.quantity) && row.quantity > 0 && row.quantity <= 99 &&
            Number.isFinite(row.price) && row.price >= 0);
        if (data.items.length == 0) {
            setIsDisabled(false);
            toast.error('Please choose atleast one item!');
            return;
        }
        try {
            const response = await fetch(`/api/v1/order/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                toast.error(result.message || "Unable to update this order.");
                return;
            }
            toast.success(result.message);
            router.push('/restaurant/dashboard');
        } catch (error) {
            console.error("Order update failed:", error);
            toast.error("Unable to update this order.");
        } finally {
            setIsDisabled(false);
        }
    }

    const calculateRowTotal = (data, shippingCharge = summary.shipping_charge) => {
        const total = (data ?? rows).reduce((sum, row) => sum + row.quantity * row.price, 0);
        setSummary((prev) => ({ ...prev, total, final_total: total + shippingCharge }));
    }

    const onShippingChargeChange = (shipping_charge) => {
        const charge = Number(shipping_charge);
        setSummary((prev) => ({
            ...prev,
            shipping_charge: charge,
            final_total: prev.total + charge,
        }));
    }

    const addMoreRow = async () => {
        setRows(prevRows => [...prevRows, { id: "", quantity: 1, price: 0 }]);
        calculateRowTotal();
    }

    const removeRow = async (index) => {
        const newData = rows.filter((row, i) => i != index);
        setRows(newData);
        calculateRowTotal(newData);
    }

    const itemChange = async (index, id) => {
        const duplicate = id && rows.some((row, rowIndex) => rowIndex !== index && row.id === id);
        const nextRows = rows.map((row, rowIndex) => rowIndex === index
            ? { ...row, id: "", price: 0 }
            : { ...row });
        if (duplicate) {
            toast.error('Duplicate item not allowed!');
        } else if (id) {
            try {
                const response = await fetch(`/api/v1/restaurant/food/${id}`);
                const result = await response.json();
                if (!response.ok || !result.success) {
                    toast.error(result.message || "Unable to load this food item.");
                    setRows(nextRows);
                    calculateRowTotal(nextRows);
                    return;
                }
                nextRows[index] = { ...nextRows[index], id: result.data._id, price: result.data.price };
            } catch (error) {
                console.error("Food item loading failed:", error);
                toast.error("Unable to load this food item.");
                setRows(nextRows);
                calculateRowTotal(nextRows);
                return;
            }
        }

        setRows(nextRows);
        calculateRowTotal(nextRows);

    }

    const qtyChange = async (index, value) => {
        const nextRows = rows.map((row, rowIndex) => rowIndex === index
            ? { ...row, quantity: Number(value) }
            : row);
        setRows(nextRows);
        calculateRowTotal(nextRows);

    }

    const priceChange = async (index, value) => {
        const nextRows = rows.map((row, rowIndex) => rowIndex === index
            ? { ...row, price: Number(value) }
            : row);
        setRows(nextRows);
        calculateRowTotal(nextRows);

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
        let res = await fetch(`/api/v1/delivery?city=${restaurant.city}`);

        res = await res.json();
        if (res.success) {
            setDeliveries(res.data);
        }
    }

    const getAllOrderStatuses = async () => {
        try {
            const response = await fetch("/api/v1/order/statuses");
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to load order statuses.");
            }
            setStatuses(result.data || []);
        } catch (error) {
            console.error("Order status loading failed:", error);
            toast.error(error.message || "Unable to load order statuses.");
        }
    }

    const getAllFoodItems = async () => {
        const restaurant = await restaurant_auth();
        let res = await fetch(`/api/v1/restaurant/food?restaurant_id=${restaurant._id}`);
        res = await res.json();
        if (res.success) {
            setFoodItems(res.foodItems);
        }
    }

    const getOrderDetails = async () => {
        try {
            const response = await fetch(`/api/v1/order/${id}`);
            const result = await response.json();
            if (!response.ok || !result.success || !result.data?.[0]) {
                toast.error(result.message || "Unable to load this order.");
                return;
            }
            const currentOrder = result.data[0];
            setRows(currentOrder.order_details || []);
            const shippingCharge = Number(currentOrder.shipping_charge) || 0;
            setSummary({
                total: (currentOrder.order_details || []).reduce((total, row) => total + row.quantity * row.price, 0),
                shipping_charge: shippingCharge,
                final_total: Number(currentOrder.final_total) || 0,
            });
            reset({
                user_id: currentOrder.user?._id ? String(currentOrder.user._id) : "",
                delivery_partner_id: currentOrder.delivery?._id ? String(currentOrder.delivery._id) : "",
                status_id: currentOrder.status?._id
                    ? String(currentOrder.status._id)
                    : currentOrder.status_id
                        ? String(currentOrder.status_id)
                        : "",
            });
        } catch (error) {
            console.error("Order loading failed:", error);
            toast.error("Unable to load this order.");
        }
    }

    useEffect(() => {
        if (!id) return;
        getAllCustomers();
        getAllDeliveries();
        getAllOrderStatuses();
        getAllFoodItems();
        getOrderDetails();
    }, [id]);

    return (
        <main className="order-editor">
            <h2 className="font-bold mt-4">Edit Order</h2>
            <div className="w-full">
                <form className="order-editor-card" onSubmit={handleSubmit(submitFormHandler)}>
                    <div className="order-editor-fields">
                        <div className="order-editor-field">
                            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="name">
                                Customer
                            </label>
                            <select className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="user_id" value={watch("user_id") || ""} {...register("user_id", { required: 'This field is required.' })} >
                                <option value="">Select Any Customer</option>
                                {
                                    customers.map(customer => (
                                        <option key={customer._id} value={customer._id}>{customer.name}</option>
                                    ))
                                }
                            </select>
                            {errors.user_id && <ValidationError message={errors.user_id.message} />}
                        </div>
                        <div className="order-editor-field">
                            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="name">
                                Delivery Partner
                            </label>
                            <select className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="delivery_partner_id" value={watch("delivery_partner_id") || ""} {...register("delivery_partner_id")} >
                                <option value="">Assign later (optional)</option>
                                {
                                    deliveries.map(delivery => (
                                        <option key={delivery._id} value={delivery._id}>{delivery.name}</option>
                                    ))
                                }
                            </select>
                            {errors.delivery_partner_id && <ValidationError message={errors.delivery_partner_id.message} />}
                        </div>
                        <div className="order-editor-field">
                            <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="name">
                                Order Status
                            </label>
                            <select className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" id="status_id" value={watch("status_id") || ""} {...register("status_id", { required: 'This field is required.' })} >
                                <option value="">Select Any Status</option>
                                {
                                    statuses.map(status => (
                                        <option key={status._id} value={status._id}>{status.name}</option>
                                    ))
                                }
                            </select>
                            {errors.status_id && <ValidationError message={errors.status_id.message} />}
                        </div>
                    </div>
                    <div className="order-items-scroll">
                        <table className="order-editor-table w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
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
                                        <tr key={`${row.id || "new"}-${index}`}>
                                            <td data-label="Item">
                                                <select name="item_id[]" className="shadow appearance-none border border-green-300 rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" value={row.id} onChange={(e) => itemChange(index, e.target.value)}>
                                                    <option value="">Select Any Item</option>
                                                    {
                                                        foodItems.map((item, i) => (
                                                            <option key={i} value={item._id}>{item.name}</option>
                                                        ))
                                                    }
                                                </select>
                                            </td>
                                            <td data-label="Quantity">
                                                <input type="number" name="quantity[]" min="1" max="99" value={row.quantity}
                                                    onChange={(e) => qtyChange(index, e.target.value)}
                                                    className="onlyNumber shadow appearance-none border border-green-300 rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" />
                                            </td>
                                            <td data-label="Price">
                                                <input type="number" name="price[]" min="0" value={row.price}
                                                    onChange={(e) => priceChange(index, e.target.value)}
                                                    className="onlyNumber shadow appearance-none border border-green-300 rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1" />
                                            </td>
                                            <td data-label="Sub Total">
                                                <input type="number" name="total[]"
                                                    value={row.quantity * row.price} readOnly
                                                    className="onlyNumber shadow appearance-none border border-green-300 rounded py-2 px-3 text-gray-
                                                bg-gray-200 leading-tight focus:outline-none focus:shadow-outline mb-1"/>
                                            </td>
                                            <td data-label="Action">
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
                            <button
                                disabled={isDisabled}
                                className={`bg-green-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded focus:outline-none focus:shadow-outline ${isDisabled ? 'cursor-not-allowed opacity-50' : ''
                                    }`}
                                type="submit">
                                Update Order
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </main>
    )
}

export default withAuth(EditOrder)