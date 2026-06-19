import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { OutputFormat } from '@video-converter/shared/types/video.js';

type DropdownProps = {
    options: OutputFormat[];
    value: OutputFormat;
    onChange: (value: OutputFormat) => void;
}

export const Dropdown = ({ options, value, onChange }: DropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative min-w-[120px]" ref={dropdownRef}>
            <div
                className={`flex items-center justify-between border ${isOpen ? 'border-primary' : 'border-border'} hover:border-primary rounded-lg p-3 bg-transparent text-gray-200 outline-none transition-colors cursor-pointer w-full select-none`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="mr-3">{value}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-full border border-border bg-bg-main rounded-lg shadow-xl z-50 overflow-hidden">
                    {options.map((option, index) => (
                        <div
                            key={index}
                            className={`p-3 cursor-pointer hover:bg-gray-800 transition-colors ${value === option ? 'text-primary font-medium' : 'text-gray-200'}`}
                            onClick={() => {
                                onChange(option);
                                setIsOpen(false);
                            }}
                        >
                            {option}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
