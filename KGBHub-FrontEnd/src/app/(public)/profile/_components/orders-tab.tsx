"use client";
import { Order } from "@/models/order";
import { cn } from "@/lib/utils";
import React, { useEffect, useMemo, useState } from "react";
import Empty from "@/components/common/empty";
import { userApiRequest } from "@/services/user.service";
import { X } from "lucide-react";
import Link from "next/link";
import { ProductType } from "@/constants";
import { Pagination } from "@nextui-org/react";

const OrderDetailPopup = ({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) => {
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setIsLoading(true);
        const res = await userApiRequest.getOrderDetail({ id: order.id });
        if (res.status === 200) {
          setOrderDetails(res.payload);
        } else {
          setError("Failed to fetch order details");
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        setError("An error occurred while fetching order details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [order.id]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-card/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray p-6 rounded-lg">
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-card/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray p-6 rounded-lg">
          <p className="text-red-500">{error}</p>
          <button
            onClick={onClose}
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const savings = {
    amount:
      orderDetails.originalAmount - orderDetails.amount < 0
        ? 0
        : orderDetails.originalAmount - orderDetails.amount,
    fee:
      orderDetails.originalFee - orderDetails.platformFee < 0
        ? 0
        : orderDetails.originalFee - orderDetails.platformFee,
  };

  return (
    <div className="fixed inset-0 bg-card/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card text-card-foreground p-6 rounded-lg w-[700px] max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Order Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between">
            <span>Order ID:</span>
            <span className="font-semibold">{orderDetails.id}</span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span
              className={`
                  px-2 py-1 rounded-full text-xs
                  ${
                    orderDetails.status === "SUCCESS"
                      ? "bg-green-100 text-green-800"
                      : orderDetails.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }
                `}
            >
              {orderDetails.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{new Date(orderDetails.createdAt).toLocaleString()}</span>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Products</h3>
            {orderDetails.productOrders.map((productOrder: any) => (
              <div
                key={productOrder.id}
                className="flex justify-between border-b py-2 last:border-b-0 items-start"
              >
                <span className="flex-grow pr-4 break-words">
                  {productOrder.product.courseId ? (
                    <>
                      <Link
                        target="_blank"
                        href={`/course/${productOrder.product.courseId}`}
                      >
                        {productOrder.product.name}
                      </Link>
                    </>
                  ) : (
                    productOrder.product.name
                  )}
                </span>
                <div className="text-right flex flex-col whitespace-nowrap">
                  {productOrder.product.type !==
                    ProductType.KGBHUB_SERVICE_TIP &&
                    (productOrder.product.courseId ? (
                      <span className="line-through text-gray-500">
                        {productOrder.product.price.toLocaleString()}{" "}
                        {orderDetails.currency}
                      </span>
                    ) : (order as any).originalFee > order.platformFee ? (
                      <span className="line-through text-gray-500">
                        {(order as any).originalFee.toLocaleString()}{" "}
                        {orderDetails.currency}
                      </span>
                    ) : (
                      <></>
                    ))}
                  <span className="font-semibold">
                    {productOrder.price.toLocaleString()}{" "}
                    {orderDetails.currency}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t space-y-2">
            <div className="flex justify-between">
              <span>Original Amount:</span>
              <div className="text-right">
                <span className="line-through text-gray-500">
                  {(
                    orderDetails.amount +
                    orderDetails.platformFee +
                    savings.fee +
                    savings.amount
                  ).toLocaleString()}{" "}
                  {orderDetails.currency}
                </span>
              </div>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Total Savings:</span>
              <span>
                {(savings.amount + savings.fee).toLocaleString()}{" "}
                {orderDetails.currency}
              </span>
            </div>
            <div className="flex justify-between font-bold pt-2">
              <span>Final Amount:</span>
              <span>
                {(
                  orderDetails.amount + orderDetails.platformFee
                ).toLocaleString()}{" "}
                {orderDetails.currency}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderCard = ({ order }: { order: Order }) => {
  return (
    <div className="grid grid-cols-6 gap-4 border rounded-lg p-4 shadow-sm w-full">
      <div className="col-span-3">
        <p
          className="font-semibold truncate whitespace-nowrap overflow-hidden text-ellipsis"
          title={`Order #${order.id}`}
        >
          #{order.id}
        </p>
      </div>
      <div className="col-span-1">
        <p className="text-sm text-gray-500">
          {new Date(order.updatedAt).toLocaleDateString()}
        </p>
      </div>
      <div className="col-span-1">
        <span
          className={`
              px-2 py-1 rounded-full text-xs 
              ${
                order.status === "SUCCESS"
                  ? "bg-green-100 text-green-800"
                  : order.status === "PENDING"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
              }
            `}
        >
          {order.status}
        </span>
      </div>
      <div className="col-span-1">
        <p className="text-lg font-bold">
          {order.amount.toLocaleString()} {order.currency}
        </p>
      </div>
    </div>
  );
};

const LIMIT = 6;

const OrderTab = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await userApiRequest.getOrders({
          limit: LIMIT,
          offset: LIMIT * (Number(currentPage || 1) - 1),
        });

        if (res.status === 200) {
          setOrders(res.payload);
          setTotalPage(res.pagination.totalPages)
        }
      } catch (error) {
        console.error("Failed to fetch orders", error);
      }
    };

    fetchOrders();
  }, [currentPage]);

  return (
    <>
      <div className="relative">
        <div className="sticky top-0 bg-white z-10 border-b">
          <div className="bg-card grid grid-cols-6 gap-4 font-semibold text-gray-700 pb-2 pr-4">
            <div className="bg-card col-span-3">Order ID</div>
            <div className="bg-card col-span-1">Updated At</div>
            <div className="bg-card col-span-1">Status</div>
            <div className="bg-card col-span-1">Amount</div>
          </div>
        </div>
        <div className="h-[500px] overflow-y-auto space-y-4 pr-4 pt-2">
          {orders && orders.length > 0 ? (
            orders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="cursor-pointer transition"
              >
                <OrderCard order={order} />
              </div>
            ))
          ) : (
            <Empty />
          )}
        </div>
      </div>
      {selectedOrder && (
        <OrderDetailPopup
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
      <Pagination
        initialPage={1}
        className="mx-auto w-fit mt-2"
        page={Number(currentPage || 1)}
        total={totalPage ?? 1}
        onChange={(e) => {
          setCurrentPage(e);
        }}
      />
    </>
  );
};

export default OrderTab;
