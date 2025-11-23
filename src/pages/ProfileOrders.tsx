import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext"
import { OrderInterface, OrderItemInterface } from "../utils/Interfaces";
import { getOrders } from "../utils/OrderDB";
import { submitCustomerFeedback } from "../utils/FeedbackDB";
import { Package, Clock, CheckCircle, XCircle, Truck, ArrowLeft, Star, MessageSquare, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ProfileOrdersPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderInterface[]>([]);
  const [loading, setLoading] = useState(true);

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OrderItemInterface | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    if (user) {
      setLoading(true);
      getOrders(user)
        .then(items => { setOrders(items); setLoading(false); })
        .catch(() => { setLoading(false); });
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const openFeedbackModal = (item: OrderItemInterface) => {
    setSelectedItem(item);
    setRating(0);
    setReviewText("");
    setIsFeedbackOpen(true);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedItem || rating === 0) return alert("Please provide a rating.");

    setSubmitting(true);
    const { error } = await submitCustomerFeedback(selectedItem.order_item_id, rating, reviewText);

    setSubmitting(false);
    if (error) {
      alert("Failed to submit feedback.");
    } else {
      setIsFeedbackOpen(false);
      loadData();
    }
  };

  const handleItemClick = (productId: string, listingId: string) => {
    if (productId && listingId) {
      navigate(`/product/${productId}?listingId=${listingId}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered': return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700"><CheckCircle size={14} /> Delivered</span>;
      case 'delivering': return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700"><Truck size={14} /> On the way</span>;
      case 'cancelled': return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700"><XCircle size={14} /> Cancelled</span>;
      default: return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700"><Clock size={14} /> Pending</span>;
    }
  };

  const formatOrderDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      <button
        onClick={() => navigate('/profile')}
        className="flex items-center gap-2 text-slate-500 hover:text-green-600 font-bold transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Back to Profile
      </button>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Order History</h1>
        <p className="text-slate-500">Track your past purchases.</p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-green-400 font-medium animate-pulse">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 rounded-[2rem] text-center border border-green-100 shadow-sm">
          <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="text-green-500" size={24} />
          </div>
          <p className="text-slate-500 text-lg">You haven't ordered anything yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.order_id} className="bg-white rounded-[2rem] shadow-sm border border-green-100 p-6 hover:shadow-md transition-all">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Order #{order.order_id}</h3>
                  <p className="text-xs text-slate-400 font-medium">Ordered on: {formatOrderDate(order.ordered_at)}</p>
                </div>
                <div className="mt-2 sm:mt-0">
                  {getStatusBadge(order.order_items[0]?.order_status || 'pending')}
                </div>
              </div>

              <ul className="space-y-3">
                {order.order_items.map((item) => {
                  const isDelivered = item.order_status === 'completed';
                  const hasFeedback = item.rating && item.rating > 0;
                  const productId = item.listing?.productInfo?.product_id;
                  const listingId = item.listing?.product_listings_id;

                  return (
                    <li
                      key={item.order_item_id}
                      className="flex flex-col sm:flex-row justify-between sm:items-center text-sm gap-3 p-2 -m-2 rounded-xl transition-colors group cursor-pointer hover:bg-green-50"
                      onClick={() => {
                        if (productId && listingId) {
                          handleItemClick(productId, listingId);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-bold text-xs">{item.quantity}x</div>
                        <div>
                          <p className="font-medium text-slate-700 group-hover:text-green-600 transition-colors">{item.name}</p>
                          <p className="font-bold text-slate-900">₹{item.price}</p>
                        </div>
                      </div>

                      {isDelivered ? (
                        hasFeedback ? (
                          <div className="flex items-center gap-1 text-yellow-500 bg-yellow-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-yellow-100">
                            <Star size={12} fill="currentColor" />
                            <span>{item.rating} Stars</span>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openFeedbackModal(item);
                            }}
                            className="flex items-center gap-2 text-green-500 hover:bg-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-green-100"
                          >
                            <MessageSquare size={14} />
                            Give Feedback
                          </button>
                        )
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {isFeedbackOpen && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-6 relative">
            <button
              onClick={() => setIsFeedbackOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star size={32} fill="currentColor" className="opacity-20" />
                <Star size={32} className="absolute" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Rate this Item</h2>
              <p className="text-slate-500 text-sm mt-1">{selectedItem.name}</p>
            </div>

            <div className="space-y-6">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      size={36}
                      className={star <= rating ? "text-yellow-400" : "text-slate-200"}
                      fill={star <= rating ? "currentColor" : "none"}
                    />
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Write a review (optional)</label>
                <textarea
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm"
                  rows={3}
                  placeholder="What did you like or dislike?"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                />
              </div>

              <button
                onClick={handleSubmitFeedback}
                disabled={rating === 0 || submitting}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfileOrdersPage;