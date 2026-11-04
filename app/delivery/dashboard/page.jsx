"use client";
import { dateFormat, delivery_auth } from "@/app/helpers/helper";
import withDeliveryAuth from "@/app/hoc/withDeliveryAuth";
import { useState, useEffect } from "react";
import InvoiceModal from "@/app/_components/order/InvoiceModal";
import { toast } from "react-toastify";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [order, setOrder] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const getOrderList = async () => {
    try {
      const deliveryPartner = await delivery_auth();
      const response = await fetch(`/api/v1/order?type=delivery&id=${deliveryPartner._id}`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load orders.");
      }
      setOrders(result.data || []);
    } catch (error) {
      console.error("Delivery order list loading failed:", error);
      toast.error("Unable to load orders.");
    } finally {
      setIsLoading(false);
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
      console.error("Delivery order detail loading failed:", error);
      toast.error("Unable to load this order.");
    } finally {
      setIsDisabled(false);
    }
  }
  useEffect(() => {
    getOrderList();
  }, []);
  return (
    <div align="center">
      <title>Delivery Partner Dashboard</title>
      <div className="no-print">
        <h4 className="m-3">All Order List</h4>
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
                  Restaurant Details
                </th>
                <th scope="col" className="px-6 py-3">
                  Customer Details
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
                <th scope="col" className="px-6 py-3">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="px-6 py-4 text-center" colSpan={9}>Loading orders…</td></tr>
              ) : orders.length === 0 ? (
                <tr><td className="px-6 py-4 text-center" colSpan={9}>No orders yet.</td></tr>
              ) : orders.map((order) => (
                  <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600" key={order?._id}>
                    <td className="px-6 py-4">
                      {order?.date && dateFormat(order.date)}
                    </td>
                    <td className="px-6 py-4">
                      {order?.invoice_no}
                    </td>
                    <td className="px-6 py-4">
                      {order?.restaurant?.[0]?.name || "—"} <br />
                      {order?.restaurant?.[0]?.phone || "—"} <br />
                      {order?.restaurant?.[0]?.address || "—"}
                    </td>
                    <td className="px-6 py-4">
                      {order?.user?.[0]?.name || "—"} <br />
                      {order?.user?.[0]?.phone || "—"} <br />
                      {order?.user?.[0]?.address || "—"} <br />
                    </td>
                    <td className="px-6 py-4">
                      Tk {Number(order?.total || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      Tk {Number(order?.shipping_charge || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      Tk {Number(order?.final_total || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span style={{ color: order?.status?.[0]?.color }}>
                        {order?.status?.[0]?.name || "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        disabled={isDisabled}
                        className={`bg-black p-2 text-white rounded ${isDisabled ? 'cursor-not-allowed opacity-50' : ''
                          }`}
                        onClick={() => showInvoice(order?._id)}>View</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="order-dashboard-cards sm:hidden">
          {isLoading ? (
            <p className="dashboard-empty-card" role="status">Loading orders…</p>
          ) : orders.length === 0 ? (
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
                <p><strong>Restaurant</strong>{order.restaurant?.[0]?.name || "—"} · {order.restaurant?.[0]?.phone || "—"}</p>
                <p><strong>Customer</strong>{order.user?.[0]?.name || "—"} · {order.user?.[0]?.phone || "—"}</p>
                <p><strong>Total</strong>Tk {Number(order.final_total ?? order.total ?? 0).toFixed(2)}</p>
              </div>
              <div className="order-dashboard-card-actions">
                <button disabled={isDisabled} onClick={() => showInvoice(order._id)}>View order</button>
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

export default withDeliveryAuth(Dashboard)