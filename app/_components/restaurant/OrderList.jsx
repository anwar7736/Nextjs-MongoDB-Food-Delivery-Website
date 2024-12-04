"use client";
import { dateFormat, restaurant_auth } from "@/app/helpers/helper";
import { useState, useEffect } from "react"
import InvoiceModal from "@/app/_components/order/InvoiceModal";
import Swal from "sweetalert2";
import Link from "next/link";

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [order, setOrder] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);

  const getOrderList = async () => {
    const user = await restaurant_auth();
    let res = await fetch(`/api/v1/order?type=restaurant&id=${user._id}`)
    res = await res.json();

    if (res.success) {
      setOrders(res.data);

    }

  }
  const showInvoice = async (id) => {
    let res = await fetch(`/api/v1/order/${id}`)
    res = await res.json();

    if (res.success) {
      setOrder(res.data[0]);
      setModalOpen(true);
    }
  }

  const deleteItem = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        let res = await fetch(`/api/v1/order/${id}`, {
          method: "DELETE"
        })
        res = await res.json();
        if (res.success) {
          getOrderList();
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
    getOrderList();
  }, []);
  return (
    <div align="center">
      <div className="no-print">
        <h4 className="m-3">All Order List</h4>
        <div align="right" className="m-4">
          <Link href="/restaurant/order/create" className="bg-purple-600 p-2 text-white rounded">Place Order</Link>
        </div>
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
                    <button className="bg-black p-2 text-white rounded" onClick={() => showInvoice(order?._id)}>View</button>
                    &nbsp;
                    <button className="bg-green-600 p-2 text-white rounded">Edit</button>
                    &nbsp;
                    <button className="bg-red-600 p-2 text-white rounded" onClick={() => deleteItem(order?._id)}>Delete</button>
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

export default OrderList