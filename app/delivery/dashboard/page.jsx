"use client";
import { dateFormat, delivery_auth } from "@/app/helpers/helper";
import withDeliveryAuth from "@/app/hoc/withDeliveryAuth";
import { useState, useEffect } from "react"
import InvoiceModal from "@/app/_components/order/InvoiceModal";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [order, setOrder] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const getOrderList = async () => {
    const user = await delivery_auth();
    let res = await fetch(`/api/v1/order?type=delivery&id=${user._id}`)
    res = await res.json();

    if (res.success) {
      setOrders(res.data);

    }

  }
  const showInvoice = async (id) => {
    setIsDisabled(true);
    let res = await fetch(`/api/v1/order/${id}`)
    res = await res.json();

    if (res.success) {
      setOrder(res.data[0]);
      setModalOpen(true);
      setIsDisabled(false);
    }
    else {
      setIsDisabled(false);
      console.log(res);
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
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
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
                      {order?.restaurant[0]?.name} <br />
                      {order?.restaurant[0]?.phone} <br />
                      {order?.restaurant[0]?.address}
                    </td>
                    <td className="px-6 py-4">
                      {order?.user[0]?.name} <br />
                      {order?.user[0]?.phone} <br />
                      {order?.user[0]?.address} <br />
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