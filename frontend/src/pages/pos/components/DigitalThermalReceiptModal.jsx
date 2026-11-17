import React, { useRef, useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  Receipt,
  Store,
  Clock,
  Phone,
  MapPin,
  Sparkles,
  ShoppingBag,
  QrCode,
  Copy,
  ExternalLink
} from 'lucide-react';
import { formatCurrency } from '../../../utils/currency.js';

export function DigitalThermalReceiptModal({
  isOpen,
  onClose,
  receiptData,
  onStartNextOrder,
}) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  if (!isOpen || !receiptData) return null;

  const { stall, order, payment } = receiptData;
  const grandTotal = Number(order.financials?.grandTotal ?? 0);
  const subtotal = Number(order.financials?.subtotal ?? grandTotal);
  const discountAmount = Number(order.financials?.discountAmount ?? 0);

  const stallSlug = stall?.slug || 'fast-food-stall';
  const trackingPath = `/track/${stallSlug}/${order.orderNumber}`;
  const currentOrigin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : '';
  const fullTrackingUrl = currentOrigin ? `${currentOrigin}${trackingPath}` : trackingPath;

  // Generate genuine scannable QR code
  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(fullTrackingUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 140,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate tracking QR code', err);
      });

    return () => {
      isMounted = false;
    };
  }, [fullTrackingUrl]);

  const handleCopyTrackingLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullTrackingUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = fullTrackingUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy tracking link', err);
    }
  };

  const formatDateTime = (isoString) => {
    try {
      const d = new Date(isoString || Date.now());
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(d);
    } catch (e) {
      return String(isoString);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    const lines = [
      '========================================',
      `       ${stall?.name?.toUpperCase() || 'FOODDESK STALL'}`,
      '         Manage Smart. Serve Fast.',
      '========================================',
      `Address: ${stall?.address?.street || ''}, ${stall?.address?.city || ''}`,
      `Contact: ${stall?.contactNumber || ''}`,
      '----------------------------------------',
      `ORDER NO:  ${order.orderNumber}`,
      `TOKEN NO:  #${order.pickupToken}`,
      `DATE/TIME: ${formatDateTime(order.createdAt)}`,
      order.customerMobile ? `MOBILE:    ${order.customerMobile}` : '',
      '----------------------------------------',
      'ITEM                     QTY   PRICE   TOTAL',
      '----------------------------------------',
      ...order.items.map((it) => {
        const name = (it.name || it.menuItemId || '').padEnd(23).slice(0, 23);
        const qty = String(it.quantity).padStart(3);
        const price = String(it.sellingPrice).padStart(7);
        const tot = String(it.itemTotal).padStart(7);
        return `${name} ${qty} ${price} ${tot}`;
      }),
      '----------------------------------------',
      `SUBTOTAL:                         ₹${subtotal}`,
      discountAmount > 0 ? `DISCOUNT:                        -₹${discountAmount}` : '',
      `GRAND TOTAL:                      ₹${grandTotal}`,
      '----------------------------------------',
      `PAYMENT METHOD: ${payment?.method?.toUpperCase() || 'CASH'}`,
      `PAYMENT STATUS: ${payment?.status?.toUpperCase() || 'PAID'} (SIMULATED)`,
      payment?.details?.transactionRef ? `REF / UTR:      ${payment.details.transactionRef}` : '',
      payment?.details?.cashTendered ? `CASH TENDERED:  ₹${payment.details.cashTendered}` : '',
      payment?.details?.changeReturned ? `CHANGE RETURN:  ₹${payment.details.changeReturned}` : '',
      '----------------------------------------',
      'LIVE ORDER TRACKING URL:',
      fullTrackingUrl,
      '========================================',
      '         THANK YOU! VISIT AGAIN         ',
      '   [FoodDesk POS — Simulated Receipt]   ',
      '========================================',
    ].filter(Boolean).join('\n');

    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt-${order.orderNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-navy-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar (Screen Only) */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-navy-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-bold text-white">Digital Thermal Receipt</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Preview */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-900/40">
          {/* Thermal Receipt Paper Card (Printable Section) */}
          <div
            id="printable-receipt"
            className="w-full bg-white text-slate-900 rounded-xl p-5 shadow-elevated font-mono text-xs border border-slate-200 select-text leading-tight mx-auto max-w-[340px]"
          >
            {/* Header / Brand */}
            <div className="text-center pb-3 border-b-2 border-dashed border-slate-300">
              <h2 className="text-base font-black tracking-tight uppercase text-slate-950">
                {stall?.name || 'FoodDesk Stall'}
              </h2>
              <div className="text-[10px] text-slate-600 mt-0.5">
                {stall?.category}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {stall?.address?.street}, {stall?.address?.city} - {stall?.address?.pincode}
              </div>
              <div className="text-[10px] text-slate-500">
                Tel: {stall?.contactNumber}
              </div>
            </div>

            {/* Order Meta & Large Token */}
            <div className="py-2.5 border-b-2 border-dashed border-slate-300 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600">ORDER:</span>
                <span className="font-extrabold text-slate-950">{order.orderNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600">TOKEN:</span>
                <span className="text-base font-black px-2 py-0.5 bg-slate-900 text-white rounded">
                  #{order.pickupToken}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>DATE/TIME:</span>
                <span>{formatDateTime(order.createdAt)}</span>
              </div>
              {order.customerMobile && (
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>CUSTOMER:</span>
                  <span>{order.customerMobile}</span>
                </div>
              )}
            </div>

            {/* Itemized Lines */}
            <div className="py-2.5 border-b-2 border-dashed border-slate-300 space-y-1.5">
              <div className="flex items-center justify-between font-bold text-[10px] text-slate-500 uppercase pb-1">
                <span className="w-1/2">Item</span>
                <span className="text-center w-12">Qty</span>
                <span className="text-right w-16">Amount</span>
              </div>
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-baseline justify-between text-[11px]">
                  <span className="w-1/2 font-semibold truncate text-slate-900">
                    {item.name || item.menuItemId}
                  </span>
                  <span className="text-center w-12 text-slate-600">
                    {item.quantity} × {formatCurrency(item.sellingPrice)}
                  </span>
                  <span className="text-right w-16 font-bold text-slate-950">
                    {formatCurrency(item.itemTotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="py-2.5 border-b-2 border-dashed border-slate-300 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-[11px] text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-semibold">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm font-black pt-1 border-t border-slate-200">
                <span>TOTAL PAID:</span>
                <span className="text-base font-extrabold text-slate-950">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            {/* Payment & Audit Details */}
            <div className="py-2.5 border-b-2 border-dashed border-slate-300 space-y-1 text-[10px] text-slate-600">
              <div className="flex items-center justify-between">
                <span>Payment Mode:</span>
                <span className="font-bold text-slate-900 uppercase">
                  {payment?.details?.tenderType || payment?.method || 'Cash'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Payment Status:</span>
                <span className="font-bold text-emerald-700 uppercase">
                  {payment?.status === 'paid' ? 'PAID / VERIFIED' : payment?.status?.toUpperCase()}
                </span>
              </div>
              {payment?.details?.transactionRef && (
                <div className="flex items-center justify-between">
                  <span>Txn Ref / UTR:</span>
                  <span className="font-mono text-slate-900">{payment.details.transactionRef}</span>
                </div>
              )}
              {payment?.details?.cashTendered !== undefined && (
                <div className="flex items-center justify-between">
                  <span>Cash Received:</span>
                  <span>{formatCurrency(payment.details.cashTendered)}</span>
                </div>
              )}
              {payment?.details?.changeReturned !== undefined && (
                <div className="flex items-center justify-between">
                  <span>Change Returned:</span>
                  <span>{formatCurrency(payment.details.changeReturned)}</span>
                </div>
              )}
            </div>

            {/* Live Customer Order Tracking Genuine Scannable QR & Link */}
            <div className="py-2.5 border-b-2 border-dashed border-slate-300 text-center space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                Scan to Track Live Order Status
              </div>
              <div className="flex justify-center my-1.5">
                <div className="p-1.5 border border-slate-300 rounded-lg bg-white inline-flex flex-col items-center shadow-xs">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Order Tracking QR Code"
                      className="w-24 h-24 object-contain"
                    />
                  ) : (
                    <div className="w-24 h-24 flex items-center justify-center text-slate-400 font-mono text-[9px]">
                      Generating QR...
                    </div>
                  )}
                  <span className="text-[9px] font-mono font-bold text-slate-700 mt-0.5">#{order.pickupToken}</span>
                </div>
              </div>
              <div className="text-[8px] font-mono text-slate-500 break-all px-2 leading-tight">
                {fullTrackingUrl}
              </div>
            </div>

            {/* Footer Taglines */}
            <div className="text-center pt-3 space-y-0.5">
              <div className="font-extrabold text-[11px] uppercase tracking-wider text-slate-800">
                Thank You! Visit Again
              </div>
              <div className="text-[9px] text-slate-500">
                FoodDesk — Manage Smart. Serve Fast.
              </div>
              <div className="text-[8px] text-slate-400 mt-1 uppercase">
                [Simulated Digital Thermal Receipt]
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions (Screen Only) */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-navy-950 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 bg-navy-800 hover:bg-slate-800 border border-slate-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadText}
              className="px-2.5 py-2 bg-navy-900 hover:bg-navy-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              type="button"
              onClick={handleCopyTrackingLink}
              className="px-3 py-2 bg-navy-800 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              title="Copy customer tracking link"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Tracking Link</span>
                </>
              )}
            </button>
            <a
              href={trackingPath}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-2 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              title="Open customer live tracking page"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Tracker</span>
            </a>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onStartNextOrder) onStartNextOrder();
            }}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 ml-auto"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Next Order</span>
          </button>
        </div>
      </div>
    </div>
  );
}

