function FormField({ label, ...inputProps }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>
      <input
        {...inputProps}
        className="w-full border border-ink/15 rounded-lg px-3.5 py-2.5 text-ink placeholder:text-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-indigo focus:border-transparent transition"
      />
    </div>
  );
}

export default FormField;
