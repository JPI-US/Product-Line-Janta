import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { searchAddressSuggestions, type GeocodeHit } from "../lib/geocode";

type AddressAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Street & city, state, or ZIP",
}: AddressAutocompleteProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GeocodeHit[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(() => {
      void searchAddressSuggestions(q, 6).then((hits) => {
        if (cancelled) return;
        setSuggestions(hits);
        setOpen(hits.length > 0);
        setActiveIndex(-1);
        setLoading(false);
      });
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const selectSuggestion = useCallback(
    (hit: GeocodeHit) => {
      onChange(hit.label);
      setOpen(false);
      setSuggestions([]);
      setActiveIndex(-1);
    },
    [onChange],
  );

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || !suggestions.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
      return;
    }
    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]!);
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="savings-address">
      <input
        className="savings-input"
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
        }
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />
      {loading ? (
        <p className="savings-address__status" aria-live="polite">
          Searching…
        </p>
      ) : null}
      {open && suggestions.length > 0 ? (
        <ul id={listId} className="savings-address__list" role="listbox">
          {suggestions.map((hit, index) => (
            <li key={hit.label} role="presentation">
              <button
                id={`${listId}-option-${index}`}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={`savings-address__option${
                  index === activeIndex ? " savings-address__option--active" : ""
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(hit)}
              >
                {hit.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
