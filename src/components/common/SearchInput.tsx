import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  label
}: SearchInputProps) {
  return (
    <label className="search-input">
      <span className="sr-only">{label}</span>
      <Search size={19} aria-hidden="true" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <X size={18} />
        </button>
      )}
    </label>
  );
}
