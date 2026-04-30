export default function Home() {
  return (
    <section className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-xl shadow-black/20">
      <div className="max-w-3xl space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Welcome to TripMate</p>
        <h1 className="text-4xl font-bold text-white sm:text-5xl">Plan your next escape with confidence.</h1>
        <p className="text-slate-300 leading-8">
          Discover curated itineraries, store travel memories, explore local guides, and use AI-powered planning to make your trips unforgettable.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-slate-950/90 p-6">
          <h2 className="text-lg font-semibold text-white">Explore</h2>
          <p className="mt-2 text-slate-400">Find new destinations, local hotspots, and travel ideas.</p>
        </div>
        <div className="rounded-3xl bg-slate-950/90 p-6">
          <h2 className="text-lg font-semibold text-white">Journal</h2>
          <p className="mt-2 text-slate-400">Record your adventures and revisit your favorite moments.</p>
        </div>
        <div className="rounded-3xl bg-slate-950/90 p-6">
          <h2 className="text-lg font-semibold text-white">AI Plan</h2>
          <p className="mt-2 text-slate-400">Generate tailored travel plans and itinerary suggestions instantly.</p>
        </div>
      </div>
    </section>
  );
}
