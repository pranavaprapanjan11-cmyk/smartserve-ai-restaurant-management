import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import {
  BillingTemplateModel,
  DiscountSettingsModel,
  OrderItemModel,
  PaymentMethodType,
  TaxSettingsModel,
} from '../../types/foundation'

const defaultBillingTemplate: BillingTemplateModel = {
  restaurantName: 'The Obsidian Bistro',
  headerTemplate: 'THE OBsidian BISTRO\n13 Midnight Street\nNew Delhi',
  footerTemplate: 'Thank you for serving with SmartServe AI.\nVisit again!',
}

const defaultTaxSettings: TaxSettingsModel = {
  taxPercent: 18,
}

const defaultDiscountSettings: DiscountSettingsModel = {
  discountPercent: 5,
  discountAmount: 0,
}

const defaultOrderItems: OrderItemModel[] = [
  { id: '1', name: 'Mango Curry', quantity: 2, price: 320 },
  { id: '2', name: 'Saffron Rice', quantity: 1, price: 180 },
  { id: '3', name: 'Chocolate Lava Cake', quantity: 1, price: 140 },
]

const paymentMethods: PaymentMethodType[] = ['Cash', 'UPI', 'Card']

const BillingEditor: React.FC = () => {
  const { user } = useAuth()
  const [template, setTemplate] = useState<BillingTemplateModel>(defaultBillingTemplate)
  const [taxSettings, setTaxSettings] = useState<TaxSettingsModel>(defaultTaxSettings)
  const [discountSettings, setDiscountSettings] = useState<DiscountSettingsModel>(defaultDiscountSettings)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('Cash')
  const [billMessage, setBillMessage] = useState<string>('')

  const subtotal = useMemo(
    () => defaultOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    []
  )

  const taxAmount = useMemo(() => (subtotal * taxSettings.taxPercent) / 100, [subtotal, taxSettings.taxPercent])
  const discountAmount = useMemo(
    () => Math.min(discountSettings.discountAmount, subtotal + taxAmount) || (subtotal + taxAmount) * (discountSettings.discountPercent / 100),
    [discountSettings, subtotal, taxAmount]
  )
  const total = useMemo(() => subtotal + taxAmount - discountAmount, [subtotal, taxAmount, discountAmount])

  const handleGenerateBill = () => {
    setBillMessage(`Bill generated for ${paymentMethod}. Total ₹${total.toFixed(2)}.`)
    setTimeout(() => setBillMessage(''), 5000)
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-amber-500/5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-amber-300/70">Billing Editor</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Invoice & Checkout Studio</h1>
            <p className="mt-2 max-w-2xl text-slate-400">Build invoice headers, tax rules, and payment flows for the restaurant checkout experience.</p>
          </div>
          <span className="rounded-full bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100 ring-1 ring-cyan-400/20">
            Preview mode
          </span>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
            <div className="grid gap-6">
              <div>
                <label className="text-sm font-semibold text-slate-300">Restaurant Name Preview</label>
                <input
                  value={template.restaurantName}
                  onChange={(e) => setTemplate({ ...template, restaurantName: e.target.value })}
                  className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-300">Header Template</label>
                  <textarea
                    value={template.headerTemplate}
                    onChange={(e) => setTemplate({ ...template, headerTemplate: e.target.value })}
                    rows={5}
                    className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-300">Footer Template</label>
                  <textarea
                    value={template.footerTemplate}
                    onChange={(e) => setTemplate({ ...template, footerTemplate: e.target.value })}
                    rows={5}
                    className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-[#0b111f]/80 p-5">
                  <p className="text-sm font-semibold text-slate-400">Tax Settings</p>
                  <div className="mt-4 flex items-center gap-3">
                    <input
                      type="number"
                      value={taxSettings.taxPercent}
                      onChange={(e) => setTaxSettings({ taxPercent: Number(e.target.value) })}
                      min={0}
                      className="w-28 rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                    />
                    <span className="text-sm text-slate-400">% tax applied to invoice subtotal</span>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-[#0b111f]/80 p-5">
                  <p className="text-sm font-semibold text-slate-400">Discount Settings</p>
                  <div className="mt-4 grid gap-3">
                    <input
                      type="number"
                      value={discountSettings.discountPercent}
                      onChange={(e) => setDiscountSettings({ ...discountSettings, discountPercent: Number(e.target.value) })}
                      min={0}
                      max={100}
                      className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      placeholder="Discount %"
                    />
                    <input
                      type="number"
                      value={discountSettings.discountAmount}
                      onChange={(e) => setDiscountSettings({ ...discountSettings, discountAmount: Number(e.target.value) })}
                      min={0}
                      className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      placeholder="Flat discount amount"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Invoice Preview</p>
            <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/80 p-6">
              <div className="space-y-4">
                <div className="rounded-3xl bg-slate-900/90 p-4">
                  <p className="text-sm text-cyan-200">{template.restaurantName}</p>
                  <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{template.headerTemplate}</pre>
                </div>
                <div className="space-y-3">
                  {defaultOrderItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-300">{item.quantity} × {item.name}</p>
                      <p className="text-sm font-semibold text-white">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-3xl bg-slate-900/90 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-slate-400">
                    <span>Tax ({taxSettings.taxPercent}%)</span>
                    <span>₹{taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-slate-400">
                    <span>Discount</span>
                    <span>₹{discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-base font-semibold text-white">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap rounded-3xl bg-slate-900/90 p-4 text-sm text-slate-300">{template.footerTemplate}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Checkout Page</p>
            <h2 className="mt-4 text-3xl font-semibold text-white">Order Summary & Payment</h2>
            <p className="mt-2 text-slate-400">Review order totals and choose the payment method for final bill generation.</p>
          </div>
          <button
            type="button"
            onClick={handleGenerateBill}
            className="inline-flex items-center justify-center rounded-3xl bg-cyan-500/15 px-6 py-3 text-sm font-semibold text-cyan-100 ring-1 ring-cyan-400/20 transition hover:bg-cyan-500/25"
          >
            Generate Bill
          </button>
        </div>

        {billMessage && (
          <div className="mt-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-200">
            {billMessage}
          </div>
        )}

        <div className="mt-10 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
            <div className="space-y-5">
              <div className="rounded-3xl bg-slate-900/90 p-5">
                <h3 className="text-lg font-semibold text-white">Order Summary</h3>
                <div className="mt-4 space-y-3">
                  {defaultOrderItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm text-slate-300">
                      <span>{item.quantity} × {item.name}</span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-slate-900/90 p-5">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Tax</span>
                    <span>₹{taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Discount</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-4 text-lg font-semibold text-white flex items-center justify-between">
                    <span>Final Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-emerald-300/70">Payment Method</p>
                <div className="mt-4 grid gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`w-full rounded-3xl px-4 py-4 text-left text-sm font-semibold transition ${
                        paymentMethod === method
                          ? 'bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-400/20'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-5">
                <p className="text-sm text-slate-400">Payment details</p>
                <p className="mt-3 text-lg font-semibold text-white">{paymentMethod}</p>
                <p className="mt-2 text-sm text-slate-300">This is a mock payment selection UI for future gateway integration.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default BillingEditor
