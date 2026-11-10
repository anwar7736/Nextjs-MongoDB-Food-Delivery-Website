const SearchInput = ({ label, placeholder, value, onChange }) => (
  <div className="mx-auto mb-4 w-[calc(100%-28px)] text-left">
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
      />
    </label>
    {value.trim().length === 1 && (
      <p className="mt-1 text-sm text-gray-500">Enter at least 2 characters to search.</p>
    )}
  </div>
);

export default SearchInput;
