import { Search } from "lucide-react";
import styles from "./search-input.module.css";

export type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
};

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  id,
}: SearchInputProps) {
  return (
    <div className={`${styles.wrap}${className ? ` ${className}` : ""}`}>
      <Search size={14} className={styles.icon} />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.input}
      />
    </div>
  );
}