import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { EKIBASTUZ_STREETS } from "@/lib/ekibastuz-streets";
import { MapPin } from "lucide-react";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export function AddressAutocomplete({ value, onChange, placeholder = "Введите адрес", id }: AddressAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    if (v.length >= 1) {
      const matches = EKIBASTUZ_STREETS.filter(s =>
        s.toLowerCase().includes(v.toLowerCase())
      ).slice(0, 8);
      setFiltered(matches);
      setOpen(matches.length > 0);
    } else {
      setFiltered(EKIBASTUZ_STREETS.slice(0, 8));
      setOpen(true);
    }
  };

  const handleFocus = () => {
    const matches = value.length >= 1
      ? EKIBASTUZ_STREETS.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
      : EKIBASTUZ_STREETS.slice(0, 8);
    setFiltered(matches);
    setOpen(matches.length > 0);
  };

  const handleSelect = (street: string) => {
    onChange(street);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-background border border-border rounded-md shadow-lg overflow-hidden">
          <div className="max-h-52 overflow-y-auto">
            {filtered.map((street) => (
              <button
                key={street}
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors"
                onMouseDown={() => handleSelect(street)}
              >
                <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                <span>{street}, Экибастуз</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
