"use client";
import { dateFormat, user_auth } from "@/app/helpers/helper";
import withUserAuth from "@/app/hoc/withUserAuth";
import Link from "next/link";
import {useState, useEffect } from "react"

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const getOrderList = async () => {
    const user = await user_auth();
    let res = await fetch(`/api/v1/order?type=user&id=${user._id}`)
        res = await res.json();

    if (res.success) {
      setOrders(res.data);

    }

  }
  useEffect(() => {
    getOrderList();
  }, []);
  return (
    <div align="center">
        <title>Restaurant Dashboard</title>
        <div>
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
              orders?.map((order) => (
                <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600" key={order?._id}>
                  <td className="px-6 py-4">
                    { order?.date && dateFormat(order.date) }
                  </td>
                  <td className="px-6 py-4">
                    {order?.invoice_no}
                  </td>
                  <td className="px-6 py-4">
                    {order?.restaurant[0]?.name} <br/>
                    {order?.restaurant[0]?.phone} <br/>
                    {order?.restaurant[0]?.address}
                  </td>
                  <td className="px-6 py-4">
                    {order?.delivery[0]?.name} <br/>
                    {order?.delivery[0]?.phone} <br/>
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
                    <span style={{color: order?.status[0]?.color}}>
                      {order?.status[0]?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="bg-black-500 p-2 text-white">Print</button>
                  </td>
                </tr>
              )
              )
            }
          </tbody>
        </table>
      </div>
    </div>
    </div>
  )
}

export default withUserAuth(Dashboard)