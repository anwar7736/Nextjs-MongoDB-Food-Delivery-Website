"use client";
import { dateFormat, restaurant_auth } from "@/app/helpers/helper";
import { useState, useEffect } from "react"
import InvoiceModal from "@/app/_components/order/InvoiceModal";
import Swal from "sweetalert2";
import Link from "next/link";
import { toast } from "react-toastify";
import OrderStatusControl from "@/app/_components/order/OrderStatusControl";

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [order, setOrder] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  const updateOrderStatus = (id, status) => {
    setOrders((items) => items.map((item) =>
      item._id === id ? { ...item, status: [status] } : item
    ));
  }
  
  const getOrderList = async () => {
    try {
      const user = await restaurant_auth();
      const response = await fetch(`/api/v1/order?type=restaurant&id=${user._id}`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load orders.");
      }
      setOrders(result.data || []);
    } catch (error) {
      console.error("Order list loading failed:", error);
      toast.error("Unable to load orders.");
    }
  }
  const showInvoice = async (id) => {
    setIsDisabled(true);
    try {
      const response = await fetch(`/api/v1/order/${id}`);
      const result = await response.json();
      if (!response.ok || !result.success || !result.data?.[0]) {
        toast.error(result.message || "Unable to load this order.");
        return;
      }
      setOrder(result.data[0]);
      setModalOpen(true);
    } catch (error) {
      console.error("Order detail loading failed:", error);
      toast.error("Unable to load this order.");
    } finally {
      setIsDisabled(false);
    }
  }

  const deleteItem = async (id) => {
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
      const response = await fetch(`/api/v1/order/${id}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        toast.error(result.message || "Unable to delete this order.");
        return;
      }
      setOrders((items) => items.filter((item) => item._id !== id));
      Swal.fire({
        title: "Deleted!",
        text: result.message,
        icon: "success"
      });
    } catch (error) {
      console.error("Order deletion failed:", error);
      toast.error("Unable to delete this order.");
    } finally {
      setIsDisabled(false);
    }
  }

  useEffect(() => {
    getOrderList();
  }, []);
  return (
    <div align="center">
      <div className="no-print">
        <h4 className="m-3">All Order List</h4>
        <div align="right" className="m-4">
          <Link href="/restaurant/order/create" className="bg-purple-600 p-2 text-white rounded">Place Order</Link>
        </div>
        <div className="relative hidden overflow-x-auto shadow-md sm:block sm:rounded-lg">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Date
                </th>
                <th scope="col" className="px-6 py-3">
                  Invoice No
                </th>
                <th scope="col" className="px-6 py-3">
                  Customer Details
                </th>
                <th scope="col" className="px-6 py-3">
                  Delivery Partner Details
                </th>
                <th scope="col" className="px-6 py-3">
                  Total
                </th>
                <th scope="col" className="px-6 py-3">
                  Delivery Charge
                </th>
                <th scope="col" className="px-6 py-3">
                  Final Total
                </th>
                <th scope="col" className="px-6 py-3">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-center">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {
                orders?.map((order) => (
                  <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600" key={order?._id}>
                    <td className="px-6 py-4">
                      {order?.date && dateFormat(order.date)}
                    </td>
                    <td className="px-6 py-4">
                      {order?.invoice_no}
                    </td>
                    <td className="px-6 py-4">
                      {order?.user[0]?.name} <br />
                      {order?.user[0]?.phone} <br />
                      {order?.user[0]?.address}
                    </td>
                    <td className="px-6 py-4">
                      {order?.delivery[0]?.name} <br />
                      {order?.delivery[0]?.phone} <br />
                      {order?.delivery[0]?.address} <br />
                    </td>
                    <td>
                      {order?.total}
                    </td>
                    <td>
                      {order?.shipping_charge}
                    </td>
                    <td>
                      {order?.final_total}
                    </td>
                    <td>
                      <span style={{ color: order?.status[0]?.color }}>
                        {order?.status[0]?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex justify-between" >
                      <button
                        disabled={isDisabled}
                        className={`bg-black p-2 text-white rounded ${isDisabled ? 'cursor-not-allowed opacity-50' : ''
                          }`}
                         onClick={() => showInvoice(order?._id)}>View</button>
                      <OrderStatusControl
                        orderId={order._id}
                        accountType="restaurant"
                        currentStatus={order.status?.[0]}
                        onUpdated={updateOrderStatus}
                      />
                      &nbsp;
                      <Link href={`/restaurant/order/edit/${order?._id}`} className="bg-green-600 p-2 text-white rounded">Edit</Link>
                      &nbsp;
                      <button
                        disabled={isDisabled}
                        className={`bg-red-600 p-2 text-white rounded ${isDisabled ? 'cursor-not-allowed opacity-50' : ''
                          }`}
                         onClick={() => deleteItem(order?._id)}>Delete</button>
                    </td>
                  </tr>
                )
                )
              }
            </tbody>
          </table>
        </div>
        <div className="order-dashboard-cards sm:hidden">
          {orders.length === 0 ? (
            <p className="dashboard-empty-card">No orders yet.</p>
          ) : orders.map((order) => (
            <article className="order-dashboard-card" key={order._id}>
              <div className="order-dashboard-card-heading">
                <div>
                  <p>{order.date && dateFormat(order.date)}</p>
                  <h5>{order.invoice_no}</h5>
                </div>
                <span style={{ color: order.status?.[0]?.color }}>{order.status?.[0]?.name || "Pending"}</span>
              </div>
              <div className="order-dashboard-card-details">
                <p><strong>Customer</strong>{order.user?.[0]?.name || "—"} · {order.user?.[0]?.phone || "—"}</p>
                <p><strong>Delivery</strong>{order.delivery?.[0]?.name || "Unassigned"} · {order.delivery?.[0]?.phone || "—"}</p>
                <p><strong>Total</strong>Tk {Number(order.final_total ?? order.total ?? 0).toFixed(2)}</p>
              </div>
              <div className="order-dashboard-card-actions">
                <button disabled={isDisabled} onClick={() => showInvoice(order._id)}>View</button>
                <OrderStatusControl
                  orderId={order._id}
                  accountType="restaurant"
                  currentStatus={order.status?.[0]}
                  onUpdated={updateOrderStatus}
                />
                <Link href={`/restaurant/order/edit/${order._id}`}>Edit</Link>
                <button disabled={isDisabled} onClick={() => deleteItem(order._id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </div>
      <InvoiceModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        data={order}
      />
    </div>
  )
}

export default OrderList