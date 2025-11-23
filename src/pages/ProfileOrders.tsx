import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext"
import { OrderInterface, OrderItemInterface } from "../utils/Interfaces";
import { getOrders } from "../utils/OrderDB";
import { submitCustomerFeedback } from "../utils/FeedbackDB";
import { Package, Clock, CheckCircle, XCircle, Truck, ArrowLeft, Star, MessageSquare, X, DollarSign } from "lucide-react";
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
      // Fetch orders and sort by date descending
      getOrders(user)
        .then(items => { 
            const sortedOrders = items.sort((a, b) => new Date(b.ordered_at).getTime() - new Date(a.ordered_at).getTime());
            setOrders(sortedOrders); 
            setLoading(false); 
        })
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
      alert("Failed to submit feedback. Please try again.");
    } else {
      setIsFeedbackOpen(false);
      // Optimistically update the single item's feedback status
      setOrders(prevOrders => prevOrders.map(order => ({
        ...order,
        order_items: order.order_items.map(item => 
            item.order_item_id === selectedItem.order_item_id ? { ...item, rating, review: reviewText } : item
        )
      })));
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
      case 'delivered': return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200"><CheckCircle size={14} /> Delivered</span>;
      case 'delivering': return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200"><Truck size={14} /> On the way</span>;
      case 'cancelled': return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200"><XCircle size={14} /> Cancelled</span>;
      default: return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200"><Clock size={14} /> Processing</span>;
    }
  };

  const formatOrderDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: 'numeric'
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  return (
    <div className="space-y-8 animate-fade-in relative">
      <button
        onClick={() => navigate('/profile')}
        // ✨ Stronger hover state for back button
        className="flex items-center gap-2 text-slate-600 hover:text-emerald-700 font-semibold transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Back to Profile
      </button>

      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Order History</h1>
        <p className="text-slate-600">Track your past purchases and leave feedback.</p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-emerald-500 font-medium animate-pulse bg-white rounded-3xl shadow-lg border border-slate-100">
            <Package size={32} className="mx-auto mb-3" />
            Loading orders...
        </div>
      ) : orders.length === 0 ? (
        // ✨ Enhanced Empty State
        <div className="bg-white p-12 rounded-[2rem] text-center border border-emerald-100 shadow-xl shadow-emerald-50/50">
          <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <Package className="text-emerald-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">No Orders Found</h2>
          <p className="text-slate-600 text-md mt-2">Looks like you haven't placed an order yet. Start shopping!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.order_id} className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-6 transition-all hover:shadow-2xl">

              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-3">
                    <Package size={24} className="text-emerald-600 flex-shrink-0" />
                    <div>
                        <h3 className="text-xl font-extrabold text-slate-900">Order #{order.order_id}</h3>
                        <p className="text-sm text-slate-500 font-medium mt-1">
                            {order.order_items.length} {order.order_items.length > 1 ? 'Items' : 'Item'} | {formatCurrency(order.payment?.amount || 0)}
                        </p>
                    </div>
                </div>
                <div className="mt-4 sm:mt-0 flex flex-col items-end">
                  {getStatusBadge(order.order_items[0]?.order_status || 'pending')}
                  <p className="text-xs text-slate-500 font-medium mt-1">Placed: {formatOrderDate(order.ordered_at)}</p>
                </div>
              </div>

              {/* Order Items */}
              <ul className="space-y-4 pt-2">
                {order.order_items.map((item) => {
                  const isDelivered = item.order_status === 'completed';
                  const hasFeedback = item.rating && item.rating > 0;
                  const productId = item.listing?.productInfo?.product_id;
                  const listingId = item.listing?.product_listings_id;

                  return (
                    <li
                      key={item.order_item_id}
                      className="flex flex-col sm:flex-row justify-between sm:items-center text-sm gap-3 p-3 -m-3 rounded-xl transition-colors group cursor-pointer hover:bg-emerald-50 border border-transparent hover:border-emerald-200"
                      onClick={() => {
                        if (productId && listingId) {
                          handleItemClick(productId, listingId);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* ✨ Item Quantity & Name */}
                        <div className="h-12 w-12 bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-700 font-extrabold text-sm border border-slate-200 flex-shrink-0">
                            <span>{item.quantity}</span>
                            <span className="text-xs font-semibold">x</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors truncate">{item.name}</p>
                          <p className="text-xs text-slate-500">Item ID: {item.order_item_id}...</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                          {/* ✨ Item Price */}
                          <div className="font-extrabold text-lg text-slate-900 flex items-center gap-1">
                              <DollarSign size={16} className="text-emerald-600" />
                              {formatCurrency(item.price)}
                          </div>

                          {/* Feedback Button/Badge */}
                          {isDelivered && (
                            hasFeedback ? (
                              <div className="flex items-center gap-1 text-yellow-600 bg-yellow-100 px-3 py-1.5 rounded-xl text-xs font-bold border border-yellow-300 shadow-sm">
                                <Star size={14} fill="currentColor" />
                                <span>{item.rating} Star Rating</span>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent item click navigation
                                  openFeedbackModal(item);
                                }}
                                className="flex items-center gap-2 text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg"
                              >
                                <MessageSquare size={14} />
                                Review
                              </button>
                            )
                          )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Feedback Modal */}
      {isFeedbackOpen && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-8 relative transform scale-100 transition-transform duration-300 border border-slate-100">
            <button
              onClick={() => setIsFeedbackOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-8">
              {/* ✨ Animated Star Icon */}
              <div className="w-16 h-16 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-yellow-300">
                <Star size={36} fill="currentColor" className="animate-pulse" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">Rate Your Purchase</h2>
              <p className="text-slate-600 text-md mt-1 font-semibold">{selectedItem.name}</p>
            </div>

            <div className="space-y-6">
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      size={40}
                      className={star <= rating ? "text-yellow-400 transition-colors" : "text-slate-300 transition-colors"}
                      fill={star <= rating ? "currentColor" : "none"}
                      strokeWidth={star <= rating ? 0 : 2}
                    />
                  </button>
                ))}
              </div>
              <p className="text-center text-sm font-semibold text-slate-600">
                  {rating === 0 ? "Select a star rating" : `You rated this item: ${rating} Star${rating > 1 ? 's' : ''}`}
              </p>

              <div>
                <label htmlFor="review" className="block text-sm font-bold text-slate-700 mb-2">Write a Review (Optional)</label>
                <textarea
                  id="review"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-200 outline-none text-base transition-shadow placeholder:text-slate-400"
                  rows={4}
                  placeholder="Tell us about your experience with this product. (e.g., quality, value, delivery)"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                />
              </div>

              <button
                onClick={handleSubmitFeedback}
                disabled={rating === 0 || submitting}
                className="w-full items-center justify-center gap-2 bg-emerald-600 border border-transparent rounded-2xl py-4 px-8 text-xl font-extrabold text-white hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-200 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-700 ease-out transform hover:scale-[1.01]"
              >
                {submitting ? "Submitting Review..." : "Submit Feedback"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfileOrdersPage;