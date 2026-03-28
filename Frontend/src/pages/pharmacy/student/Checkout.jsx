import React, { useMemo, useState } from 'react';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  MapPin, 
  CreditCard, 
  Truck, 
  ShieldCheck, 
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { MOCK_MEDICINES } from '../../../constants/mockPharmacyData';
import { cn } from '../../../lib/utils';
import { apiFetch } from '../../../lib/api';

const Checkout = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('campus');
  const [address] = useState('Dorm A, Room 302');
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });

  const formatCardNumber = (val) => {
    const v = val.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.slice(i, i + 4));
    }
    if (parts.length > 0) return parts.join(' ');
    else return v;
  };

  const formatExpiry = (val) => {
    const v = val.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) return v.slice(0, 2) + '/' + v.slice(2, 4);
    return v;
  };

  const isCardValid = useMemo(() => {
    if (paymentMethod !== 'card') return true;
    return (
      cardDetails.number.replace(/\s/g, '').length === 16 &&
      cardDetails.expiry.length === 5 &&
      cardDetails.cvv.length >= 3 &&
      cardDetails.name.trim().length > 2
    );
  }, [paymentMethod, cardDetails]);

  // Mock cart items
  const [cartItems, setCartItems] = useState(() => {
    try {
      const raw = localStorage.getItem('pharmacy_cart');
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // fall through to defaults
    }
    return [{ ...MOCK_MEDICINES[0], quantity: 2 }, { ...MOCK_MEDICINES[1], quantity: 1 }];
  });

  const backendPaymentMethod = useMemo(() => {
    if (paymentMethod === 'campus') return 'Campus Card';
    if (paymentMethod === 'card') return 'Credit Card';
    return 'Cash on Delivery';
  }, [paymentMethod]);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 2.50;
  const total = subtotal + deliveryFee;

  const updateQuantity = (id, delta) => {
    setCartItems((prev) => {
      const next = prev.map((item) =>
        item.id === id || item._id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      );
      localStorage.setItem('pharmacy_cart', JSON.stringify(next));
      return next;
    });
  };

  const removeItem = (id) => {
    setCartItems((prev) => {
      const next = prev.filter((item) => item.id !== id && item._id !== id);
      localStorage.setItem('pharmacy_cart', JSON.stringify(next));
      return next;
    });
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    setError('');
    try {
      const items = cartItems.map((item) => ({
        medicineId: item._id || item.id,
        quantity: Number(item.quantity) || 1
      }));
      const order = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items,
          address,
          paymentMethod: backendPaymentMethod
        })
      });
      localStorage.removeItem('pharmacy_cart');
      setPlacedOrderId(order._id || order.orderId);
      setIsSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to place order');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-3xl p-10 text-center shadow-xl shadow-slate-200/50"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Order Placed!</h2>
          <p className="text-slate-500 mb-2">Order ID: #{placedOrderId || 'N/A'}</p>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Your order has been received and is being processed. You can track its status in real-time.
          </p>
          <div className="space-y-4">
            <button 
              onClick={() => navigate(`/student/pharmacy/order/${placedOrderId}`)}
              className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
            >
              Track Order
            </button>
            <button 
              onClick={() => navigate('/student/pharmacy')}
              className="w-full py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              Back to Store
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingCart className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
        <p className="text-slate-500 mb-8">Add some medicines or health products to get started.</p>
        <button 
          onClick={() => navigate('/student/pharmacy/search')}
          className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all"
        >
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20 px-6">
      <div className="max-w-7xl mx-auto mb-12">
        <h1 className="text-5xl font-bold text-slate-900 tracking-tight">Checkout</h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Cart Items ({cartItems.length})</h2>
                <button 
                  onClick={() => setCartItems([])}
                  className="text-sm font-bold text-rose-500 hover:text-rose-600 transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {cartItems.map((item) => (
                  <div key={item._id || item.id} className="p-6 flex gap-6 group">
                    <div className="w-24 h-24 bg-slate-100 rounded-2xl overflow-hidden shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">{item.name}</h3>
                          <p className="text-xs text-slate-500">{item.strength} • {item.manufacturer}</p>
                        </div>
                        <p className="font-bold text-slate-900 text-lg">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      
                      {item.requiresPrescription && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2 py-1 rounded w-fit">
                          <AlertCircle className="w-3 h-3" /> Rx Required
                        </div>
                      )}

                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-lg">
                          <button 
                            onClick={() => updateQuantity(item._id || item.id, -1)}
                            className="w-8 h-8 flex items-center justify-center bg-white rounded-md text-slate-600 hover:text-emerald-600 shadow-sm transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-bold text-slate-900 text-sm">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item._id || item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center bg-white rounded-md text-slate-600 hover:text-emerald-600 shadow-sm transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeItem(item._id || item.id)}
                          className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Delivery Address */}
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" /> Delivery Address
                </h2>
                <button className="text-sm font-bold text-emerald-600 hover:underline">Change</button>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Campus Dormitory</p>
                  <p className="text-sm text-slate-500">{address}</p>
                  <p className="text-xs text-slate-400 mt-1">Estimated delivery: 30-45 mins</p>
                </div>
              </div>
            </section>

            {/* Payment Method */}
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                <CreditCard className="w-5 h-5 text-emerald-600" /> Payment Method
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'campus', name: 'Campus Card', icon: ShieldCheck },
                  { id: 'card', name: 'Credit Card', icon: CreditCard },
                  { id: 'cash', name: 'Cash on Delivery', icon: Truck }
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                      paymentMethod === method.id 
                        ? "border-emerald-500 bg-emerald-50/50" 
                        : "border-slate-100 bg-white hover:border-emerald-200"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                      paymentMethod === method.id ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
                    )}>
                      <method.icon className="w-5 h-5" />
                    </div>
                    <span className={cn("font-bold text-sm", paymentMethod === method.id ? "text-emerald-900" : "text-slate-600")}>
                      {method.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Card Details Form */}
              <AnimatePresence>
                {paymentMethod === 'card' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Card Number</label>
                          <input 
                            type="text"
                            value={cardDetails.number}
                            onChange={(e) => setCardDetails({ ...cardDetails, number: formatCardNumber(e.target.value) })}
                            placeholder="0000 0000 0000 0000"
                            maxLength="19"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Cardholder Name</label>
                          <input 
                            type="text"
                            value={cardDetails.name}
                            onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                            placeholder="FULL NAME"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Expiry Date</label>
                          <input 
                            type="text"
                            value={cardDetails.expiry}
                            onChange={(e) => setCardDetails({ ...cardDetails, expiry: formatExpiry(e.target.value) })}
                            placeholder="MM/YY"
                            maxLength="5"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">CVV</label>
                          <input 
                            type="password"
                            value={cardDetails.cvv}
                            onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) })}
                            placeholder="000"
                            maxLength="4"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>

          {/* Right Column: Order Summary */}
          <div className="space-y-6">
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sticky top-28">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-slate-900">${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-900">Total</span>
                  <span className="text-3xl font-bold text-emerald-600">${total.toFixed(2)}</span>
                </div>
              </div>

              {cartItems.some(i => i.requiresPrescription) && (
                <div className="mb-8 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <div className="flex gap-3 mb-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-xs font-bold text-amber-900 leading-tight">
                      Some items in your cart require a prescription.
                    </p>
                  </div>
                  <Link 
                    to="/student/pharmacy/upload-prescription"
                    className="w-full py-2 bg-white text-amber-700 rounded-lg text-xs font-bold border border-amber-200 flex items-center justify-center hover:bg-amber-100 transition-colors"
                  >
                    Upload Now
                  </Link>
                </div>
              )}

              <button 
                onClick={handlePlaceOrder}
                disabled={isProcessing || !isCardValid}
                className={cn(
                  "w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg",
                  isProcessing || !isCardValid
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                    : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100"
                )}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    Place Order <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

              <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
                <ShieldCheck className="w-4 h-4" /> Secure Checkout Guaranteed
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;