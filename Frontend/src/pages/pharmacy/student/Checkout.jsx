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
import { useEffect } from 'react';
import { cn } from '../../../lib/utils';
import { apiFetch } from '../../../lib/api';
import { clearCart, getCartItems, saveCartItems } from '../../../lib/pharmacyCart';

const Checkout = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('campus');
  const [address, setAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [addressTouched, setAddressTouched] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [approvedPrescriptions, setApprovedPrescriptions] = useState([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState('');
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);

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

  const [cartItems, setCartItems] = useState(() => {
    return getCartItems();
  });

  const backendPaymentMethod = useMemo(() => {
    if (paymentMethod === 'campus') return 'Campus Card';
    if (paymentMethod === 'card') return 'Credit Card';
    return 'Cash on Delivery';
  }, [paymentMethod]);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 2.5;
  const total = subtotal + deliveryFee;
  const hasPrescriptionItems = useMemo(() => cartItems.some((item) => item.requiresPrescription), [cartItems]);
  const isAddressValid = address.trim().length >= 8;

  useEffect(() => {
    let active = true;

    const loadApprovedPrescriptions = async () => {
      if (!hasPrescriptionItems) {
        setApprovedPrescriptions([]);
        setSelectedPrescriptionId('');
        return;
      }

      setPrescriptionLoading(true);
      try {
        const data = await apiFetch('/prescriptions?status=Approved&limit=100');
        if (!active) return;
        const nextPrescriptions = Array.isArray(data?.prescriptions) ? data.prescriptions : [];
        setApprovedPrescriptions(nextPrescriptions);
        setSelectedPrescriptionId((current) => current || nextPrescriptions[0]?._id || '');
      } catch (err) {
        if (!active) return;
        setApprovedPrescriptions([]);
        setSelectedPrescriptionId('');
        setError(err.message || 'Failed to load approved prescriptions');
      } finally {
        if (active) setPrescriptionLoading(false);
      }
    };

    loadApprovedPrescriptions();
    return () => {
      active = false;
    };
  }, [hasPrescriptionItems]);

  const updateQuantity = (id, delta) => {
    setCartItems((prev) => {
      const next = prev.map((item) =>
        item.id === id || item._id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      );
      saveCartItems(next);
      return next;
    });
  };

  const removeItem = (id) => {
    setCartItems((prev) => {
      const next = prev.filter((item) => item.id !== id && item._id !== id);
      saveCartItems(next);
      return next;
    });
  };

  const handlePlaceOrder = async () => {
    setAddressTouched(true);
    if (!isAddressValid) {
      setError('Please enter a delivery address before placing the order.');
      return;
    }

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
          address: address.trim(),
          specialInstructions: specialInstructions.trim() || undefined,
          paymentMethod: backendPaymentMethod,
          prescriptionId: hasPrescriptionItems ? selectedPrescriptionId : undefined
        })
      });
      clearCart();
      setCartItems([]);
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
      <div className="pharmacy-shell flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-3xl p-10 text-center shadow-xl shadow-slate-200/50"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-accent-primary" />
          </div>
          <h2 className="text-3xl font-bold text-primary-text mb-4">Order Placed!</h2>
          <p className="text-secondary-text mb-2">Order ID: #{placedOrderId || 'N/A'}</p>
          <p className="text-secondary-text mb-8 leading-relaxed">
            Your order has been received and is being processed. You can track its status in real-time.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => navigate(`/student/pharmacy/order/${placedOrderId}`)}
              className="w-full py-4 bg-accent-primary text-white rounded-xl font-bold hover:bg-[#105f72] transition-all shadow-lg shadow-cyan-100"
            >
              Track Order
            </button>
            <button
              onClick={() => navigate('/student/pharmacy')}
              className="w-full py-4 bg-[#e6f0f4] text-secondary-text rounded-xl font-bold hover:bg-slate-200 transition-all"
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
      <div className="pharmacy-shell flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-[#e6f0f4] rounded-full flex items-center justify-center mb-6">
          <ShoppingCart className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-primary-text mb-2">Your cart is empty</h2>
        <p className="text-secondary-text mb-8">Add some medicines or health products to get started.</p>
        <button
          onClick={() => navigate('/student/pharmacy/products')}
          className="px-8 py-3 bg-accent-primary text-white rounded-xl font-bold hover:bg-[#105f72] transition-all"
        >
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="pharmacy-shell pt-28 pb-20 px-6">
      <div className="max-w-7xl mx-auto mb-12">
        <h1 className="text-5xl font-bold text-primary-text tracking-tight">Checkout</h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            <section className="pharmacy-panel overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-primary-text">Cart Items ({cartItems.length})</h2>
                <button
                  onClick={() => {
                    clearCart();
                    setCartItems([]);
                  }}
                  className="text-sm font-bold text-rose-500 hover:text-rose-600 transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {cartItems.map((item) => (
                  <div key={item._id || item.id} className="p-6 flex gap-6 group">
                    <div className="w-24 h-24 bg-[#e6f0f4] rounded-2xl overflow-hidden shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h3 className="font-bold text-primary-text text-lg">{item.name}</h3>
                          <p className="text-xs text-secondary-text">{[item.strength, item.manufacturer].filter(Boolean).join(' - ')}</p>
                        </div>
                        <p className="font-bold text-primary-text text-lg">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>

                      {item.requiresPrescription && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2 py-1 rounded w-fit">
                          <AlertCircle className="w-3 h-3" /> Rx Required
                        </div>
                      )}

                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-3 bg-[#eff6f9] p-1 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item._id || item.id, -1)}
                            className="w-8 h-8 flex items-center justify-center bg-white rounded-md text-secondary-text hover:text-accent-primary shadow-sm transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-bold text-primary-text text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item._id || item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center bg-white rounded-md text-secondary-text hover:text-accent-primary shadow-sm transition-colors"
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

            <section className="pharmacy-panel p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-primary-text flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-accent-primary" /> Delivery Address
                </h2>
                <span className="text-xs font-bold uppercase tracking-wider text-secondary-text">
                  Campus delivery
                </span>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-[#eff6f9] rounded-2xl border border-slate-100 flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-secondary-text/80 shadow-sm shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-primary-text">Campus delivery details required</p>
                    <p className="text-sm text-secondary-text">Enter your dorm, room, building, or full campus delivery point.</p>
                    <p className="text-xs text-secondary-text/80 mt-1">Estimated delivery: 30-45 mins after pharmacist review.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="delivery-address" className="text-xs font-bold text-secondary-text uppercase tracking-wider ml-1">
                    Delivery address
                  </label>
                  <textarea
                    id="delivery-address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    onBlur={() => setAddressTouched(true)}
                    placeholder="Example: Dorm A, Room 302, near main entrance"
                    rows={3}
                    className={cn(
                      'w-full resize-none bg-white border rounded-2xl px-4 py-3 outline-none focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/10 transition-all',
                      addressTouched && !isAddressValid ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                    )}
                  />
                  {addressTouched && !isAddressValid && (
                    <p className="text-xs font-medium text-rose-600 ml-1">Please enter a complete delivery address.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="delivery-instructions" className="text-xs font-bold text-secondary-text uppercase tracking-wider ml-1">
                    Delivery instructions optional
                  </label>
                  <input
                    id="delivery-instructions"
                    type="text"
                    value={specialInstructions}
                    onChange={(event) => setSpecialInstructions(event.target.value)}
                    placeholder="Example: Call when arriving"
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/10 transition-all"
                  />
                </div>
              </div>
            </section>

            <section className="pharmacy-panel p-8">
              <h2 className="text-lg font-bold text-primary-text flex items-center gap-2 mb-6">
                <CreditCard className="w-5 h-5 text-accent-primary" /> Payment Method
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
                      'p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3',
                      paymentMethod === method.id
                        ? 'border-accent-primary bg-[#e8f7f5]/50'
                        : 'border-slate-100 bg-white hover:border-emerald-200'
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                      paymentMethod === method.id ? 'bg-accent-primary text-white' : 'bg-[#e6f0f4] text-secondary-text/80'
                    )}>
                      <method.icon className="w-5 h-5" />
                    </div>
                    <span className={cn('font-bold text-sm', paymentMethod === method.id ? 'text-emerald-900' : 'text-secondary-text')}>
                      {method.name}
                    </span>
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {paymentMethod === 'card' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 bg-[#eff6f9] rounded-2xl border border-slate-100 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-secondary-text uppercase tracking-wider ml-1">Card Number</label>
                          <input
                            type="text"
                            value={cardDetails.number}
                            onChange={(e) => setCardDetails({ ...cardDetails, number: formatCardNumber(e.target.value) })}
                            placeholder="0000 0000 0000 0000"
                            maxLength="19"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-accent-primary transition-colors font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-secondary-text uppercase tracking-wider ml-1">Cardholder Name</label>
                          <input
                            type="text"
                            value={cardDetails.name}
                            onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                            placeholder="FULL NAME"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-accent-primary transition-colors"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-secondary-text uppercase tracking-wider ml-1">Expiry Date</label>
                          <input
                            type="text"
                            value={cardDetails.expiry}
                            onChange={(e) => setCardDetails({ ...cardDetails, expiry: formatExpiry(e.target.value) })}
                            placeholder="MM/YY"
                            maxLength="5"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-accent-primary transition-colors"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-secondary-text uppercase tracking-wider ml-1">CVV</label>
                          <input
                            type="password"
                            value={cardDetails.cvv}
                            onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) })}
                            placeholder="000"
                            maxLength="4"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-accent-primary transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>

          <div className="space-y-6">
            <section className="pharmacy-panel p-8 sticky top-28">
              <h2 className="text-xl font-bold text-primary-text mb-6">Order Summary</h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-secondary-text">
                  <span>Subtotal</span>
                  <span className="font-bold text-primary-text">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-secondary-text">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-primary-text">${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-lg font-bold text-primary-text">Total</span>
                  <span className="text-3xl font-bold text-accent-primary">${total.toFixed(2)}</span>
                </div>
              </div>

              {hasPrescriptionItems && (
                <div className="mb-8 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <div className="flex gap-3 mb-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-xs font-bold text-amber-900 leading-tight">
                      Some items in your cart require an approved prescription before you can place the order.
                    </p>
                  </div>
                  {prescriptionLoading ? (
                    <div className="flex items-center justify-center gap-2 rounded-lg bg-white py-3 text-xs font-bold text-amber-700 border border-amber-200">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading approved prescriptions...
                    </div>
                  ) : approvedPrescriptions.length > 0 ? (
                    <select
                      value={selectedPrescriptionId}
                      onChange={(event) => setSelectedPrescriptionId(event.target.value)}
                      className="w-full mb-3 bg-white border border-amber-200 rounded-lg px-3 py-3 text-sm text-primary-text"
                    >
                      {approvedPrescriptions.map((prescription) => (
                        <option key={prescription._id} value={prescription._id}>
                          {`Prescription ${new Date(prescription.createdAt).toLocaleDateString()}${prescription.doctorName ? ` - ${prescription.doctorName}` : ''}`}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  <Link
                    to="/student/pharmacy/upload-prescription"
                    className="w-full py-2 bg-white text-amber-700 rounded-lg text-xs font-bold border border-amber-200 flex items-center justify-center hover:bg-amber-100 transition-colors"
                  >
                    {approvedPrescriptions.length > 0 ? 'Upload Another Prescription' : 'Upload Prescription'}
                  </Link>
                  {!prescriptionLoading && approvedPrescriptions.length === 0 && (
                    <p className="mt-3 text-[11px] text-amber-700">
                      No approved prescriptions are available yet. Upload a prescription and wait for pharmacist approval before checkout.
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing || !isCardValid || !isAddressValid || (hasPrescriptionItems && !selectedPrescriptionId)}
                className={cn(
                  'w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg',
                  isProcessing || !isCardValid || !isAddressValid || (hasPrescriptionItems && !selectedPrescriptionId)
                    ? 'bg-[#e6f0f4] text-secondary-text/80 cursor-not-allowed'
                    : 'bg-accent-primary text-white hover:bg-[#105f72] shadow-cyan-100'
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

              <div className="mt-6 flex items-center justify-center gap-2 text-secondary-text/80 text-xs font-medium">
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
