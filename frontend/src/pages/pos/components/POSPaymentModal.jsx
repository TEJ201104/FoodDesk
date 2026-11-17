import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Layers,
  Smartphone,
  Hash
} from 'lucide-react';
import { formatCurrency } from '../../../utils/currency.js';
import { stallDataService } from '../../../services/stallDataService.js';
import { sound } from '../../../utils/sound.js';

export function POSPaymentModal({
  isOpen,
  onClose,
  order,
  activeStall,
  onPaymentSuccess,
}) {
  if (!isOpen || !order) return null;

  const grandTotal = Number(order.financials?.grandTotal ?? order.totalAmount ?? 0);

  // Payment method: 'cash' | 'upi_gateway' | 'upi_static_qr' | 'split_cash_upi'
  const [activeTab, setActiveTab] = useState('cash');

  // Tender States
  const [cashTendered, setCashTendered] = useState(grandTotal);
  const [utrNumber, setUtrNumber] = useState('');
  const [splitCash, setSplitCash] = useState(Math.round(grandTotal / 2));
  const [splitUtr, setSplitUtr] = useState('');

  // Payment Lifecycle State: 'idle' | 'processing' | 'success' | 'failed'
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [recordedPayment, setRecordedPayment] = useState(null);

  // Sync cashTendered if grandTotal changes
  useEffect(() => {
    setCashTendered(grandTotal);
    setSplitCash(Math.round(grandTotal / 2));
    setStatus('idle');
    setErrorMessage('');
    setRecordedPayment(null);
  }, [order?.id, grandTotal]);

  // Cash change calculation
  const changeToReturn = useMemo(() => {
    return Math.max(0, (Number(cashTendered) || 0) - grandTotal);
  }, [cashTendered, grandTotal]);

  // Split calculations
  const splitUpi = useMemo(() => {
    return Math.max(0, grandTotal - (Number(splitCash) || 0));
  }, [grandTotal, splitCash]);

  // Quick denomination adders for cash
  const handleAddCash = (amount) => {
    setCashTendered((prev) => (Number(prev) || 0) + amount);
  };

  const handleExactCash = () => {
    setCashTendered(grandTotal);
  };

  // Submit payment simulation
  const handleProcessPayment = async (forcedStatus = 'paid') => {
    setStatus('processing');
    setErrorMessage('');

    try {
      // Artificial delay for realistic gateway / scanner handshake simulation
      await new Promise((res) => setTimeout(res, 600));

      let payload = {
        orderId: order.id,
        method: activeTab,
        status: forcedStatus,
      };

      if (forcedStatus === 'failed') {
        payload.failureReason = 'Simulated Customer UPI Payment Failed / Declined';
      } else if (activeTab === 'cash') {
        payload.cashTendered = Number(cashTendered) || grandTotal;
      } else if (activeTab === 'upi_gateway') {
        payload.upiId = activeStall?.paymentSettings?.upiId || 'fastfood@okhdfcbank';
        payload.transactionRef = `UPI-GW-${Date.now().toString().slice(-6)}`;
      } else if (activeTab === 'upi_static_qr') {
        payload.utrNumber = utrNumber;
      } else if (activeTab === 'split_cash_upi') {
        payload.cashAmount = Number(splitCash);
        payload.upiAmount = splitUpi;
        payload.cashTendered = Number(cashTendered) || Number(splitCash);
        payload.utrNumber = splitUtr || '123456789012';
      }

      const payment = await stallDataService.recordPayment(activeStall.id, payload);

      if (forcedStatus === 'failed') {
        setStatus('failed');
        setErrorMessage('Customer payment simulation failed. Order remains unpaid in pending status.');
        sound.playItemAdd();
      } else {
        setStatus('success');
        setRecordedPayment(payment);
        sound.playSuccess();
        if (onPaymentSuccess) {
          onPaymentSuccess(payment, order);
        }
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      setStatus('failed');
      setErrorMessage(err.message || 'Payment simulation failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-navy-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-navy-950 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-white">Collect Payment</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                [DEMO SIMULATION]
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Order <span className="font-mono text-brand-400 font-bold">{order.orderNumber}</span> • Token <span className="font-mono text-white font-bold">#{order.pickupToken}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={status === 'processing'}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Amount Due Banner */}
          <div className="bg-gradient-to-r from-navy-950 to-navy-950/80 border border-brand-500/30 rounded-2xl p-4 flex items-center justify-between shadow-subtle">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Amount Due</span>
              <div className="text-3xl font-black text-white tracking-tight mt-0.5">
                {formatCurrency(grandTotal)}
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-400 block">Stall Payee</span>
              <span className="font-semibold text-brand-400">{activeStall?.name}</span>
            </div>
          </div>

          {/* Error Banner if Failed */}
          {status === 'failed' && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-bold text-rose-200">Payment Simulation Notice</div>
                <div>{errorMessage}</div>
              </div>
            </div>
          )}

          {/* Payment Method Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => { setActiveTab('cash'); setStatus('idle'); }}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                activeTab === 'cash'
                  ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20'
                  : 'bg-navy-950/60 text-slate-300 border-slate-800 hover:bg-navy-950 hover:text-white'
              }`}
            >
              <Banknote className="w-5 h-5" />
              <span>Cash</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('upi_gateway'); setStatus('idle'); }}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                activeTab === 'upi_gateway'
                  ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20'
                  : 'bg-navy-950/60 text-slate-300 border-slate-800 hover:bg-navy-950 hover:text-white'
              }`}
            >
              <QrCode className="w-5 h-5" />
              <span>Dynamic QR</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('upi_static_qr'); setStatus('idle'); }}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                activeTab === 'upi_static_qr'
                  ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20'
                  : 'bg-navy-950/60 text-slate-300 border-slate-800 hover:bg-navy-950 hover:text-white'
              }`}
            >
              <Smartphone className="w-5 h-5" />
              <span>Static QR + UTR</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('split_cash_upi'); setStatus('idle'); }}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                activeTab === 'split_cash_upi'
                  ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20'
                  : 'bg-navy-950/60 text-slate-300 border-slate-800 hover:bg-navy-950 hover:text-white'
              }`}
            >
              <Layers className="w-5 h-5" />
              <span>Split Tender</span>
            </button>
          </div>

          {/* TAB 1: CASH TENDER WORKSTATION */}
          {activeTab === 'cash' && (
            <div className="space-y-4 p-4 bg-navy-950/60 border border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Enter Cash Received from Customer:</span>
                <button
                  type="button"
                  onClick={handleExactCash}
                  className="text-brand-400 font-bold hover:underline"
                >
                  Exact Cash (₹{grandTotal})
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  min={grandTotal}
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-full bg-navy-900 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-xl font-black text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[10, 20, 50, 100, 200, 500].map((add) => (
                  <button
                    key={add}
                    type="button"
                    onClick={() => handleAddCash(add)}
                    className="px-2.5 py-1.5 bg-navy-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-semibold text-slate-200"
                  >
                    +₹{add}
                  </button>
                ))}
              </div>

              {/* Live Change to Return Box */}
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase font-bold text-emerald-400 block tracking-wider">
                    Change to Return
                  </span>
                  <span className="text-xl font-extrabold text-emerald-300">
                    {formatCurrency(changeToReturn)}
                  </span>
                </div>
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          )}

          {/* TAB 2: DYNAMIC UPI QR SIMULATION */}
          {activeTab === 'upi_gateway' && (
            <div className="p-4 bg-navy-950/60 border border-slate-800 rounded-2xl flex flex-col items-center text-center space-y-4">
              <div className="text-xs text-slate-400">
                Customer scans the dynamic QR code on their UPI App (GPay / PhonePe / Paytm):
              </div>

              {/* Mock Dynamic QR Graphic */}
              <div className="w-44 h-44 bg-white p-3 rounded-2xl shadow-xl flex flex-col items-center justify-center relative">
                <div className="w-full h-full border-2 border-dashed border-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-900">
                  <QrCode className="w-20 h-20 text-slate-900" />
                  <div className="text-[11px] font-mono font-bold mt-1 text-brand-600">
                    {formatCurrency(grandTotal)}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">
                    {activeStall?.paymentSettings?.upiId || 'fastfood@okhdfcbank'}
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-400">
                Awaiting simulated customer transaction approval...
              </div>

              {/* Simulation triggers */}
              <div className="flex flex-col sm:flex-row gap-2.5 w-full pt-1">
                <button
                  type="button"
                  onClick={() => handleProcessPayment('paid')}
                  disabled={status === 'processing'}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simulate Payment Success</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleProcessPayment('failed')}
                  disabled={status === 'processing'}
                  className="py-2.5 px-3 bg-navy-900 hover:bg-rose-950 text-rose-400 border border-rose-500/30 font-semibold text-xs rounded-xl transition-all"
                >
                  Simulate Failure
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: STATIC UPI QR + 12-DIGIT UTR AUDIT */}
          {activeTab === 'upi_static_qr' && (
            <div className="space-y-4 p-4 bg-navy-950/60 border border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Stall Static UPI ID:</span>
                <span className="font-mono text-brand-400 font-bold">
                  {activeStall?.paymentSettings?.upiId || 'fastfood@okhdfcbank'}
                </span>
              </div>

              <div className="text-xs text-slate-300">
                Customer scanned counter static sticker. Verify the customer's payment screenshot and enter the 12-digit Bank Reference (UTR) number:
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  12-Digit Bank UTR / Transaction ID
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="e.g. 123456789012"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-navy-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Enter all 12 numeric digits</span>
                  <span className="font-mono">{utrNumber.length} / 12 digits</span>
                </div>
              </div>

              {/* Demo 1-Click UTR helper */}
              <button
                type="button"
                onClick={() => setUtrNumber('908123456789')}
                className="text-[11px] text-brand-400 hover:underline font-semibold block"
              >
                Insert Demo 12-Digit UTR (908123456789)
              </button>
            </div>
          )}

          {/* TAB 4: SPLIT TENDER (CASH + UPI) */}
          {activeTab === 'split_cash_upi' && (
            <div className="space-y-4 p-4 bg-navy-950/60 border border-slate-800 rounded-2xl">
              <div className="text-xs text-slate-400">
                Split the grand total between cash and UPI payment methods:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                    Cash Portion (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={grandTotal}
                    value={splitCash}
                    onChange={(e) => {
                      const val = Math.min(grandTotal, Math.max(0, Number(e.target.value) || 0));
                      setSplitCash(val);
                    }}
                    className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-base font-bold text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                    UPI Portion (₹)
                  </label>
                  <input
                    type="number"
                    disabled
                    value={splitUpi}
                    className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-base font-bold text-brand-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  UPI UTR / Reference (for UPI portion)
                </label>
                <input
                  type="text"
                  maxLength={12}
                  placeholder="12-digit UTR for UPI portion"
                  value={splitUtr}
                  onChange={(e) => setSplitUtr(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setSplitUtr('556677889900')}
                className="text-[11px] text-brand-400 hover:underline font-semibold block"
              >
                Insert Demo Split UTR (556677889900)
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-navy-950 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={status === 'processing'}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel / Later
          </button>

          {activeTab !== 'upi_gateway' && (
            <button
              type="button"
              onClick={() => handleProcessPayment('paid')}
              disabled={
                status === 'processing' ||
                (activeTab === 'cash' && Number(cashTendered) < grandTotal) ||
                (activeTab === 'upi_static_qr' && utrNumber.length !== 12)
              }
              className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center gap-2"
            >
              {status === 'processing' ? (
                <span>Recording Payment...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    Confirm {activeTab === 'cash' ? 'Cash Collected' : 'Payment'}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

