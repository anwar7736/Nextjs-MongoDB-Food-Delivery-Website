"use client";
import { dateFormat, user_auth } from "@/app/helpers/helper";
import withUserAuth from "@/app/hoc/withUserAuth";
import { useState, useEffect } from "react"
import InvoiceModal from "@/app/_components/order/InvoiceModal";
import { toast } from "react-toastify";
import SearchInput from "@/app/_components/SearchInput";
import { matchesOrderSearch } from "@/app/helpers/listSearch";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [order, setOrder] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const visibleOrders = orders.filter((item) => matchesOrderSearch(item, searchTerm));

  const getOrderList = async () => {
    try {
      const user = await user_auth();
      const response = await fetch(`/api/v1/order?type=user&id=${user._id}`);
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
  useEffect(() => {
    getOrderList();
  }, []);
  const checkoutSummaries = Object.values(visibleOrders.reduce((groups, currentOrder) => {
    const key = currentOrder.checkout_id || currentOrder._id;
    if (!groups[key]) {
      groups[key] = {
        id: key,
        total: Number(currentOrder.checkout_total ?? currentOrder.final_total ?? 0),
        orderCount: Number(currentOrder.checkout_order_count ?? 1),
        restaurants: [],
      };
    }
    const restaurantName = currentOrder.restaurant?.[0]?.name;
    if (restaurantName && !groups[key].restaurants.includes(restaurantName)) {
      groups[key].restaurants.push(restaurantName);
    }
    return groups;
  }, {}));
  return (
    <div align="center">
      <title>Restaurant Dashboard</title>
      <div className="no-print">
        <h4 className="m-3">All Order List</h4>
        <SearchInput
          label="Search orders"
          placeholder="Search by invoice, restaurant, delivery, or status..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
        {checkoutSummaries.length > 0 && (
          <section className="mx-3 mb-4 rounded-lg bg-green-50 p-4 text-left" aria-label="Checkout summaries">
            <h5 className="font-bold">Checkout summaries</h5>
            {checkoutSummaries.map((summary) => (
              <p key={summary.id}>
                {summary.orderCount} restaurant order(s) · {summary.restaurants.join(", ") || "Restaurant"} ·
                &nbsp;Total Tk {summary.total.toFixed(2)}
              </p>
            ))}
          </section>
        )}

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
                <th scope="col" className="px-6 py-3">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {
                visibleOrders.length === 0 ? (
                  <tr>
                    <td className="px-6 py-4 text-center" colSpan={9}>
                      {orders.length === 0 ? "No orders yet." : "No orders match your search."}
                    </td>
                  </tr>
                ) : visibleOrders.map((order) => (
                  <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600" key={order?._id}>
                    <td className="px-6 py-4">
                      {order?.date && dateFormat(order.date)}
                    </td>
                    <td className="px-6 py-4">
                      {order?.invoice_no}
                    </td>
                    <td className="px-6 py-4">
                      {order?.restaurant[0]?.name} <br />
                      {order?.restaurant[0]?.phone} <br />
                      {order?.restaurant[0]?.address}
                    </td>
                    <td className="px-6 py-4">
                      {order?.delivery[0]?.name} <br />
                      {order?.delivery[0]?.phone} <br />
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
                    <td className="px-6 py-4">
                      <button
                        disabled={isDisabled}
                        className={`bg-black p-2 text-white rounded ${isDisabled ? 'cursor-not-allowed opacity-50' : ''
                          }`}
                         onClick={() => showInvoice(order?._id)}>View</button>
                    </td>
                  </tr>
                )
                )
              }
            </tbody>
          </table>
        </div>
        <div className="order-dashboard-cards sm:hidden">
          {visibleOrders.length === 0 ? (
            <p className="dashboard-empty-card">
              {orders.length === 0 ? "No orders yet." : "No orders match your search."}
            </p>
          ) : visibleOrders.map((order) => (
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
                <p><strong>Delivery</strong>{order.delivery?.[0]?.name || "Unassigned"} · {order.delivery?.[0]?.phone || "—"}</p>
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

export default withUserAuth(Dashboard)