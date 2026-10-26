import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  align = 'left'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const defaultButtonClass =
    'w-full p-2.5 theme-card rounded-xl text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-blue-500/50 flex items-center justify-between text-xs font-medium transition-all focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm text-left';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={buttonClassName || defaultButtonClass}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 ml-2 shrink-0 text-[var(--text-secondary)] transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-500' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className={`absolute z-50 ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-1.5 p-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] backdrop-blur-md shadow-2xl space-y-0.5 animate-fadeIn max-h-64 overflow-y-auto ${menuClassName}`}
          style={{ minWidth: '100%' }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors text-left cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/15 text-blue-500 font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
                }`}
                role="option"
                aria-selected={isSelected}
              >
                <div className="flex flex-col pr-2">
                  <span>{option.label}</span>
                  {option.description && (
                    <span className="text-[10px] text-[var(--text-muted)] font-normal mt-0.5">
                      {option.description}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 shrink-0 text-blue-500 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
