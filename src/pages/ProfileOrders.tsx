// pages/ProfileOrders.tsx

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext"
import { OrderInterface } from "../utils/Interfaces";
import { getOrders } from "../utils/OrderDB";
import { Package, Clock, CheckCircle, XCircle, Truck, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ProfileOrdersPage = () => {
  const { user, loading: authLoading } = useAuth(); // Destructure authLoading
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderInterface[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // FIXED: Wait until authentication is done AND user is present before fetching
    if (!authLoading && user) {
      setLoading(true);
      getOrders(user)
        .then(items => { setOrders(items); setLoading(false); })
        .catch(() => { setLoading(false); });
    } else if (!authLoading && !user) {
      // Stop loading if authentication is done but no user is found
      setLoading(false);
    }
  }, [user, authLoading]); // Dependency array now includes authLoading

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered': return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700"><CheckCircle size={14} /> Delivered</span>;
      case 'delivering': return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700"><Truck size={14} /> On the way</span>;
      case 'cancelled': return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700"><XCircle size={14} /> Cancelled</span>;
      default: return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700"><Clock size={14} /> Pending</span>;
    }
  };
  // Function to format the ordered_at date
  const formatOrderDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }).format(date);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* BACK BUTTON */}
      <button
        onClick={() => navigate('/profile')}
        className="flex items-center gap-2 text-slate-500 hover:text-rose-600 font-bold transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Back to Profile
      </button>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Order History</h1>
        <p className="text-slate-500">Track your past purchases.</p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-rose-400 font-medium animate-pulse">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 rounded-[2rem] text-center border border-rose-100 shadow-sm">
          <div className="bg-rose-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="text-rose-500" size={24} />
          </div>
          <p className="text-slate-500 text-lg">You haven't ordered anything yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.order_id} className="bg-white rounded-[2rem] shadow-sm border border-rose-100 p-6 hover:shadow-md transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Order #{order.order_id}</h3>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wide">Items: {order.order_items.length}</p>
                  {/* Displaying the ordered_at date */}
                  <p className="text-xs text-slate-400 font-medium">Ordered on: {formatOrderDate(order.ordered_at)}</p>
                </div>
                <div className="mt-2 sm:mt-0">
                  {getStatusBadge(order.order_items[0]?.order_status || 'pending')}
                </div>
              </div>
              <ul className="space-y-3">
                {order.order_items.map((item) => (
                  <li key={item.listing_id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-bold text-xs">{item.quantity}x</div>
                      <span className="font-medium text-slate-700">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900">₹{item.price}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileOrdersPage;