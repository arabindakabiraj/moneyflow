/**
 * ErrorBoundary.jsx — Catches runtime errors per-tab and shows a friendly fallback UI
 */
import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4 px-6 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 dark:bg-rose-500/10 flex items-center justify-center">
            <AlertTriangle size={28} className="text-rose-500" />
          </div>
          <div>
            <h2 className="font-black text-gray-900 dark:text-white text-lg mb-1">
              Something went wrong
            </h2>
            <p className="text-gray-400 dark:text-gray-500 text-sm max-w-[260px] mx-auto">
              This section ran into an error. Your data is safe — try reloading it.
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-500/30 active:scale-95 transition-all"
          >
            <RefreshCw size={16} /> Try Again
          </button>
          {import.meta.env.DEV && this.state.error && (
            <details className="w-full max-w-sm text-left mt-2">
              <summary className="text-xs text-gray-400 cursor-pointer">Dev: error details</summary>
              <pre className="mt-2 text-[10px] text-rose-400 bg-gray-900 rounded-xl p-3 overflow-auto max-h-32">
                {this.state.error?.toString()}
              </pre>
            </details>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
