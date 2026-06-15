import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import {
  BillingTemplateModel,
  PrinterConfigModel,
  PrinterConnectionType,
  RestaurantSettingsModel,
} from '../../types/foundation'

const defaultRestaurantSettings: RestaurantSettingsModel = {
  restaurantName: 'The Obsidian Bistro',
  logoUrl: '',
  address: '123 Midnight Avenue, New Delhi, India',
  contactNumber: '+91 98765 43210',
  gstNumber: '27AABCDE1234F1Z5',
}

const defaultPrinters: PrinterConfigModel[] = [
  {
    printerName: 'KDS Counter Printer',
    connectionType: 'USB',
    isDefault: true,
    status: 'Ready',
    lastTestedAt: '2 minutes ago',
  },
  {
    printerName: 'Kitchen Bluetooth Printer',
    connectionType: 'Bluetooth',
    isDefault: false,
    status: 'Offline',
    lastTestedAt: '12 minutes ago',
  },
  {
    printerName: 'Network Receipt Printer',
    connectionType: 'Network',
    isDefault: false,
    status: 'Ready',
    lastTestedAt: '5 minutes ago',
  },
]

const connectionTypes: PrinterConnectionType[] = ['USB', 'Bluetooth', 'Network']

const RestaurantConfig: React.FC = () => {
  const { user } = useAuth()
  const [settings, setSettings] = useState<RestaurantSettingsModel>(defaultRestaurantSettings)
  const [printers, setPrinters] = useState<PrinterConfigModel[]>(defaultPrinters)
  const [selectedPrinter, setSelectedPrinter] = useState<string>(defaultPrinters[0].printerName)
  const [saveMessage, setSaveMessage] = useState<string>('')
  const [testPrintMessage, setTestPrintMessage] = useState<string>('')

  const activePrinter = useMemo(
    () => printers.find((printer) => printer.printerName === selectedPrinter) || printers[0],
    [printers, selectedPrinter]
  )

  const handleSave = () => {
    setSaveMessage('Restaurant settings saved successfully.')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const handleTestPrint = () => {
    setTestPrintMessage(`Test print queued for ${activePrinter.printerName}.`)
    setTimeout(() => setTestPrintMessage(''), 3000)
  }

  const updatePrinter = (printerName: string, changes: Partial<PrinterConfigModel>) => {
    setPrinters((prev) =>
      prev.map((printer) =>
        printer.printerName === printerName ? { ...printer, ...changes } : printer
      )
    )
  }

  const chooseDefaultPrinter = (printerName: string) => {
    setPrinters((prev) => prev.map((printer) => ({
      ...printer,
      isDefault: printer.printerName === printerName,
    })))
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Restaurant Settings</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Brand & Billing Foundation</h1>
            <p className="mt-2 max-w-2xl text-slate-400">Manage restaurant identity, tax information, and printer readiness in a single control panel.</p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center justify-center rounded-3xl bg-emerald-500/10 px-6 py-3 text-sm font-semibold text-emerald-100 ring-1 ring-emerald-400/20 transition hover:bg-emerald-500/20"
          >
            Save Settings
          </button>
        </div>

        {saveMessage && (
          <div className="mt-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-200">
            {saveMessage}
          </div>
        )}

        <div className="mt-10 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
            <div className="grid gap-5">
              <div>
                <label className="text-sm font-semibold text-slate-300">Restaurant Name</label>
                <input
                  value={settings.restaurantName}
                  onChange={(e) => setSettings({ ...settings, restaurantName: e.target.value })}
                  className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-300">Logo Upload</label>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="url"
                    placeholder="Logo URL"
                    value={settings.logoUrl}
                    onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                    className="min-w-0 flex-1 rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, logoUrl: settings.logoUrl })}
                    className="rounded-3xl bg-cyan-500/15 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25"
                  >
                    Upload
                  </button>
                </div>
                {settings.logoUrl && (
                  <div className="mt-4 flex items-center gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <img src={settings.logoUrl} alt="Restaurant Logo" className="h-16 w-16 rounded-2xl object-cover" />
                    <div>
                      <p className="text-sm text-slate-300">Logo preview</p>
                      <p className="text-white truncate max-w-xs">{settings.logoUrl}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-300">Address</label>
                <textarea
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  rows={3}
                  className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-300">Contact Number</label>
                  <input
                    value={settings.contactNumber}
                    onChange={(e) => setSettings({ ...settings, contactNumber: e.target.value })}
                    className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-300">GST Number</label>
                  <input
                    value={settings.gstNumber}
                    onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value })}
                    className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-[#0c101c]/80 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-amber-300/70">Printer Management</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Connected devices</h2>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200 ring-1 ring-emerald-400/20">
                Hardware mock mode
              </span>
            </div>

            <div className="mt-8 space-y-4">
              <div className="grid gap-4">
                <label className="text-sm font-semibold text-slate-300">Printer Name</label>
                <input
                  value={activePrinter.printerName}
                  onChange={(e) => updatePrinter(activePrinter.printerName, { printerName: e.target.value })}
                  className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-300">Connection Type</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {connectionTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updatePrinter(activePrinter.printerName, { connectionType: type })}
                      className={`rounded-3xl px-4 py-3 text-sm font-semibold transition ${
                        activePrinter.connectionType === type
                          ? 'bg-cyan-500/15 text-cyan-100 ring-1 ring-cyan-400/20'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-400">Default Printer</p>
                      <p className="mt-2 text-lg font-semibold text-white">{activePrinter.printerName}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => chooseDefaultPrinter(activePrinter.printerName)}
                      className="rounded-3xl bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/25"
                    >
                      Set as Default
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Printer Status</p>
                      <p className="mt-2 text-lg font-semibold text-white">{activePrinter.status}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-950/70 px-4 py-2 text-sm text-slate-300">
                      Last test: {activePrinter.lastTestedAt}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleTestPrint}
                  className="rounded-3xl bg-amber-500/15 px-5 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/25"
                >
                  Test Print
                </button>
                {testPrintMessage && (
                  <p className="text-sm text-emerald-300">{testPrintMessage}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-emerald-500/5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-amber-300/70">Printer Roster</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Available devices</h2>
          </div>
          <p className="text-sm text-slate-400">Select a printer and adjust its workflow state.</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {printers.map((printer) => (
            <div key={printer.printerName} className="rounded-3xl border border-white/10 bg-[#0c101c]/80 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-400">Connection</p>
                  <p className="mt-2 text-xl font-semibold text-white">{printer.printerName}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  printer.status === 'Ready' ? 'bg-emerald-500/10 text-emerald-200' : 'bg-amber-500/10 text-amber-200'
                }`}>
                  {printer.status}
                </span>
              </div>
              <div className="mt-5 space-y-3 text-sm text-slate-400">
                <p>Type: {printer.connectionType}</p>
                <p>Default: {printer.isDefault ? 'Yes' : 'No'}</p>
                <p>Last test: {printer.lastTestedAt}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default RestaurantConfig
