// src/components/SafeInput.jsx
import { useState, useCallback } from 'react';

export default function SafeInput({ 
  maxLength = 1000, 
  onValidSubmit, 
  placeholder,
  type = 'textarea'
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleChange = useCallback((e) => {
    const input = e.target.value;
    
    if (input.length > maxLength) {
      setError(`Maximum ${maxLength} characters allowed`);
      return;
    }
    
    // Block obvious injection attempts client-side
    const injectionPatterns = /ignore\s+(all\s+)?previous|system\s*:|\[INST\]/i;
    if (injectionPatterns.test(input)) {
      setError('Invalid input detected');
      return;
    }
    
    setError('');
    setValue(input);
  }, [maxLength]);

  const handleSubmit = () => {
    if (!value.trim()) {
      setError('Input cannot be empty');
      return;
    }
    if (!error) {
      onValidSubmit(value.trim());
      setValue('');
    }
  };

  return (
    <div className="safe-input-wrapper">
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`w-full p-3 border rounded-xl bg-[#FFFFFF] dark:bg-[#2A2647] text-[#2D2A4A] dark:text-[#F1EFFF] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] transition-all ${
            error ? 'border-[#F25F5C]' : 'border-[#E3DFF5] dark:border-[#3D3861]'
          }`}
          rows={4}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`w-full p-3 border rounded-xl bg-[#FFFFFF] dark:bg-[#2A2647] text-[#2D2A4A] dark:text-[#F1EFFF] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] transition-all ${
            error ? 'border-[#F25F5C]' : 'border-[#E3DFF5] dark:border-[#3D3861]'
          }`}
        />
      )}
      <div className="flex justify-between items-center mt-2">
        <span className={`text-xs font-semibold ${error ? 'text-[#F25F5C]' : 'text-[#6B6890] dark:text-[#B4B0D5]'}`}>
          {error || `${value.length}/${maxLength}`}
        </span>
        <button 
          onClick={handleSubmit}
          disabled={!!error || !value.trim()}
          className="px-5 py-2.5 min-h-[44px] bg-[#6C5CE7] text-white font-bold text-sm rounded-xl hover:bg-[#5B4BC4] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_6px_rgba(108,92,231,0.25)] cursor-pointer"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
