import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100 sm:px-6">
          <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-800 bg-slate-900/95 p-10 shadow-2xl shadow-black/30">
            <div className="flex flex-col items-center justify-center gap-6 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-teal-500 text-5xl text-white shadow-lg shadow-teal-500/20">
                ⚠️
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Oops! Terjadi kesalahan</h1>
                <p className="mt-4 text-base text-slate-300">Halaman mengalami masalah. Coba refresh.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center justify-center rounded-3xl bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => (window.location.href = '/home')}
                  className="inline-flex items-center justify-center rounded-3xl border border-slate-700 bg-slate-950 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-teal-400 hover:text-white"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
