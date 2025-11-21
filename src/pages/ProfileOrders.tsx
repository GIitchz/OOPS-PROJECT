import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext"
import { OrderInterface } from "../utils/Interfaces";
import { getOrders } from "../utils/OrderDB";

export const ProfileOrdersPage = () => {
    const { user } = useAuth();
    const [ orders, setOrders ] = useState<OrderInterface[]>([]);

    const [ loading, setLoading ] = useState(true);
    
    useEffect( () => {
        setLoading(true);
        if(user) {
            getOrders(user!)
            .then(items => 
            {
                setOrders(items);
                setLoading(false);
            })
            .catch(()=> {
                setLoading(false);
            });
        }
    }, [user]);

    return (
    <div className="min-h-screen bg-rose-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl shadow-rose-100 overflow-hidden mb-6">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-4">My Orders</h1>

            {/* Orders List */}
            {loading ? (
                <p className="text-slate-500">Loading your orders.</p>
            ):
            (orders.length === 0 ? (
              <p className="text-slate-500">You have no orders yet.</p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.order_id} className="p-6 bg-slate-100 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 transition-all">
                    <h3 className="font-bold text-slate-800 mb-2">Order #{order.order_id}</h3>
                    <ul className="space-y-2">
                      {order.order_items.map((item) => (
                        <li key={item.listing_id} className="flex justify-between">
                          <span className="text-slate-700">{item.name} - {item.quantity} x ${item.price}</span>
                          <span className={`font-semibold ${item.order_status === 'delivering' ? 'text-green-600' : item.order_status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>
                            {item.order_status.charAt(0).toUpperCase()+item.order_status.slice(1)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileOrdersPage;