import { useState } from 'react';

export default function CreateJournal() {
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    date: '',
    description: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Create journal entry', formData);
  };

  return (
    <section className="mx-auto max-w-4xl rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-xl shadow-black/20">
      <h1 className="text-3xl font-bold text-white">Create Journal Entry</h1>
      <p className="mt-2 text-slate-400">Write down the details of your latest trip and save it to your journal.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block text-sm text-slate-300">
            <span className="mb-2 block">Title</span>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Weekend in Lisbon"
              required
            />
          </label>
          <label className="block text-sm text-slate-300">
            <span className="mb-2 block">Destination</span>
            <input
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Lisbon, Portugal"
              required
            />
          </label>
        </div>

        <label className="block text-sm text-slate-300">
          <span className="mb-2 block">Date</span>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
            required
          />
        </label>

        <label className="block text-sm text-slate-300">
          <span className="mb-2 block">Description</span>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            className="w-full rounded-3xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 resize-none"
            placeholder="Share your memories..."
            required
          />
        </label>

        <button
          type="submit"
          className="rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
        >
          Save Entry
        </button>
      </form>
    </section>
  );
}
