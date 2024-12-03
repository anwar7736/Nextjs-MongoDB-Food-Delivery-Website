import { dateFormat } from "@/app/helpers/helper";
import React from "react";

const InvoiceModal = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  return (
    <div className="print-container fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-lg w-[600px] max-h-[100vh] p-6 overflow-y-auto">
        {/* Close Button: Top-Right */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 no-print"
          onClick={onClose}
          title="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="text-center border-b pb-3">
          <h1 className="text-2xl font-bold text-gray-800">{data?.restaurant?.name}</h1>
          <span className="text-xs">{data?.restaurant?.phone}</span><br />
          <span className="text-xs">{data?.restaurant?.address}</span>
        </div>

        {/* Modal Title */}
        <h2 className="mt-3 text-center text-lg font-bold">ORDER INVOICE</h2>

        {/* Modal Content */}
        <div className="mt-4 flex justify-between space-x-6 text-xs">
          {/* Left: Invoice Info */}
          <div className="w-1/2" align="left">
            <h3 className="text-sm font-medium text-gray-500">Invoice Info</h3>
            <ul className="mt-2 space-y-2">
              <li className="text-gray-700">
                <span className="font-semibold text-xs">Invoice No.: </span> 
                <span className="text-xs">#{data?.invoice_no}</span>
              </li>
              <li className="text-gray-700">
                <span className="font-semibold">Order Date:</span> {data?.date ? dateFormat(data.date) : ''}
              </li>
              <li className="text-gray-700">
                <span className="font-semibold">Total:</span> {data?.total}
              </li>
              <li className="text-gray-700">
                <span className="font-semibold">Shipping Cost:</span> {data?.shipping_charge}
              </li>
              <li className="text-gray-700">
                <span className="font-semibold">Total Payable:</span> {data?.final_total}
              </li>
              <li className="text-gray-700">
                <span className="font-semibold">Status:</span> <span style={{color:data?.status?.color}}>{data?.status?.name}</span>
              </li>
            </ul>
          </div>

          {/* Right: Customer & Delivery Partner Info */}
          <div className="w-1/2" align="right">
            <h3 className="text-sm font-medium text-gray-500">Customer Info</h3>
            <ul className="mt-2 space-y-2">
              <li className="text-gray-700">
                <span className="font-semibold">Name: </span> {data?.user?.name}
              </li>
              <li className="text-gray-700">
                <span className="font-semibold">Phone: </span> {data?.user?.phone}
              </li>
              <li className="text-gray-700">
                <span className="font-semibold">Address: </span> {data?.user?.address}
              </li>
            </ul>

            <h3 className="text-sm font-medium text-gray-500 mt-4">
              Delivery Partner Info
            </h3>
            <ul className="mt-2 space-y-2">
              <li className="text-gray-700">
                <span className="font-semibold">Name: </span> {data?.delivery?.name}
              </li>
              <li className="text-gray-700">
                <span className="font-semibold">Phone: </span> {data?.delivery?.phone}
              </li>
            </ul>
          </div>
        </div>

        {/* Order Items Table */}
        <div className="mt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 border-collapse">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2 text-center">Quantity</th>
                  <th className="px-4 py-2 text-right">Price</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {
                    data.order_details.map((item, index) => (
                        <tr className="border-b" key={index}>
                            <td className="px-4 py-2 text-gray-700">{item?.name}</td>
                            <td className="px-4 py-2 text-center text-gray-700">{item?.quantity}</td>
                            <td className="px-4 py-2 text-right text-gray-700">{item?.price}</td>
                            <td className="px-4 py-2 text-right text-gray-700">{item?.total}</td>
                        </tr>
                    ))
                }
              </tbody>
              <tfoot>
                <tr className="font-semibold text-gray-800">
                  <td colSpan="3" className="px-4 py-2 text-right">
                    Total:
                  </td>
                  <td className="px-4 py-2 text-right">{data?.total}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end mt-6 space-x-3 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-300"
            title="Close"
          >
            Close
          </button>
          <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-300" title="Print" onClick={() => window.print()}>
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
