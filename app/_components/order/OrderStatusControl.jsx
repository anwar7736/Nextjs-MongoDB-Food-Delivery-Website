"use client";

import { useEffect, useState } from "react";
import { ORDER_STATUS_TRANSITIONS } from "@/app/lib/orderStatus";
import ValidationError from "../ValidationError";

let orderStatusesRequest;

function getOrderStatuses() {
  if (!orderStatusesRequest) {
    orderStatusesRequest = fetch("/api/v1/order/statuses")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Unable to load statuses.");
        return result.data || [];
      })
      .catch((error) => {
        orderStatusesRequest = null;
        throw error;
      });
  }
  return orderStatusesRequest;
}

export default function OrderStatusControl({ orderId, accountType, currentStatus, onUpdated }) {
  const [statuses, setStatuses] = useState([]);
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getOrderStatuses()
      .then((data) => {
        if (active) setStatuses(data);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Unable to load statuses.");
      });
    return () => { active = false; };
  }, []);

  const nextStatusNames = ORDER_STATUS_TRANSITIONS[accountType]?.[currentStatus?.name] || [];
  const availableStatuses = statuses.filter((status) => nextStatusNames.includes(status.name));
  if (availableStatuses.length === 0 && !error) return null;

  const updateStatus = async (statusId) => {
    if (!statusId) return;
    setError("");
    setIsBusy(true);
    try {
      const response = await fetch(`/api/v1/order/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status_id: statusId }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.message || "Unable to update order status.");
        return;
      }
      onUpdated(orderId, result.data);
    } catch {
      setError("Unable to reach the order service.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="mt-2 text-left">
      {availableStatuses.length > 0 && (
        <select
          className="border rounded px-2 py-1 text-sm"
          aria-label="Change order status"
          defaultValue=""
          disabled={isBusy}
          onChange={(event) => updateStatus(event.target.value)}
        >
          <option value="">Update status</option>
          {availableStatuses.map((status) => (
            <option key={status._id} value={status._id}>{status.name}</option>
          ))}
        </select>
      )}
      {error && <ValidationError message={error} />}
    </div>
  );
}
