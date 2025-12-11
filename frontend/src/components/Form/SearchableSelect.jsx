import React, { useState, useEffect, useRef } from 'react';
import { FiChevronDown, FiSearch } from 'react-icons/fi';
import './SearchableSelect.css';

const SearchableSelect = ({
    options = [],
    value,
    onChange,
    placeholder = "Select...",
    icon: Icon,
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter options based on search
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (option) => {
        onChange(option.value);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className={`searchable-select-container ${isOpen ? 'open' : ''}`} ref={containerRef}>
            <div
                className="searchable-select-input-wrapper"
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                {Icon && <Icon />}
                <input
                    type="text"
                    className="searchable-select-input"
                    value={selectedOption ? selectedOption.label : ''}
                    placeholder={placeholder}
                    readOnly
                    disabled={disabled}
                />
                <FiChevronDown className="chevron-icon" />
            </div>

            {isOpen && !disabled && (
                <div className="searchable-select-dropdown">
                    <div className="searchable-select-search-box">
                        <input
                            type="text"
                            className="searchable-select-search-input"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    </div>
                    {filteredOptions.length > 0 ? (
                        <ul className="searchable-select-options">
                            {filteredOptions.map(option => (
                                <li
                                    key={option.value}
                                    className={`searchable-select-option ${value === option.value ? 'selected' : ''}`}
                                    onClick={() => handleSelect(option)}
                                >
                                    {option.label}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="searchable-select-no-options">
                            No matching options found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
