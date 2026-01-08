import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import axios from '../../../utils/axios';
import { FiX, FiPrinter, FiSave, FiTrash2, FiSettings, FiLayout, FiMaximize, FiType, FiBox } from 'react-icons/fi';
import './AssetModal.css';

const PRESETS_KEY = 'asset_app_qr_presets_v5';
const MM_TO_INCH = 0.0393701;
const INCH_TO_MM = 25.4;

// Default Presets
const DEFAULT_PRESETS = [
    {
        id: 'a4',
        name: 'A4 (210x297mm)',
        width: 210,
        height: 297,
        columns: 4,
        gapX: 5,
        gapY: 5,
        marginTop: 10,
        marginBottom: 10,
        marginLeft: 10,
        marginRight: 10,
        shape: 'square',
        textSize: 8,
        qrSize: 80,
        showName: true,
        showTag: true,
        unit: 'mm',
        labelWidth: null, // New: null = auto/fill
        labelHeight: null, // null means square/auto-width based
        showBorder: true
    },
    {
        id: 'f4',
        name: 'F4 (215x330mm)',
        width: 215,
        height: 330,
        columns: 4,
        gapX: 5,
        gapY: 5,
        marginTop: 10,
        marginBottom: 10,
        marginLeft: 10,
        marginRight: 10,
        shape: 'square',
        textSize: 8,
        qrSize: 80,
        showName: true,
        showTag: true,
        unit: 'mm',
        labelWidth: null,
        labelHeight: null,
        showBorder: true
    }
];

const BulkQRModal = ({ isOpen, onClose, assets = [], onSuccess }) => {
    const [presets, setPresets] = useState(DEFAULT_PRESETS);
    const [selectedPresetId, setSelectedPresetId] = useState('a4');
    const [startOffset, setStartOffset] = useState(0); // New State

    // Current Settings
    const [settings, setSettings] = useState(DEFAULT_PRESETS[0]);
    const [presetName, setPresetName] = useState('');

    const getSerialDisplay = (asset) => {
        const sn = asset.serial_number;
        if (!sn) return '-';
        if (sn.length > 7) return '...' + sn.slice(-7);
        return sn;
    };

    useEffect(() => {
        const saved = localStorage.getItem(PRESETS_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const patched = parsed.map(p => ({
                    gapX: p.gap || 5,
                    gapY: p.gap || 5,
                    marginTop: p.pageMargin || 10,
                    marginBottom: p.pageMargin || 10,
                    marginLeft: p.pageMargin || 10,
                    marginRight: p.pageMargin || 10,
                    unit: p.unit || 'mm',
                    textSize: p.textSize || 8,
                    labelWidth: p.labelWidth || null, // Patch new field
                    labelHeight: p.labelHeight || null, // default to null
                    showBorder: p.showBorder !== undefined ? p.showBorder : true,
                    ...p
                }));
                setPresets([...DEFAULT_PRESETS, ...patched]);
            } catch (e) {
                console.error("Failed to load presets", e);
            }
        }
    }, []);

    const convertValue = (val, toUnit) => {
        if (val === null || val === undefined) return null;
        if (toUnit === 'in') return Number((val * MM_TO_INCH).toFixed(2));
        return Number((val * INCH_TO_MM).toFixed(1));
    };

    const handleUnitChange = (newUnit) => {
        if (newUnit === settings.unit) return;

        const convert = (v) => convertValue(v, newUnit);

        setSettings(prev => ({
            ...prev,
            unit: newUnit,
            width: convert(prev.width),
            height: convert(prev.height),
            gapX: convert(prev.gapX),
            gapY: convert(prev.gapY),
            marginTop: convert(prev.marginTop),
            marginBottom: convert(prev.marginBottom),
            marginLeft: convert(prev.marginLeft),
            marginRight: convert(prev.marginRight),
            labelWidth: convert(prev.labelWidth),
            labelHeight: convert(prev.labelHeight),
        }));
    };

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        if (selectedPresetId !== 'custom') {
            setSelectedPresetId('custom');
        }
    };

    // Special handler for Columns slider: Reset manual width to allow filling
    const handleColumnsChange = (val) => {
        setSettings(prev => ({ ...prev, columns: val, labelWidth: null }));
        if (selectedPresetId !== 'custom') setSelectedPresetId('custom');
    };

    const handlePresetChange = (e) => {
        const id = e.target.value;
        setSelectedPresetId(id);
        if (id === 'custom') return;

        const preset = presets.find(p => p.id === id);
        if (preset) {
            setSettings({ ...preset });
        }
    };

    const savePreset = () => {
        if (!presetName.trim()) {
            alert("Please enter a preset name");
            return;
        }
        const newPreset = { ...settings, id: Date.now().toString(), name: presetName };
        const savedCustoms = presets.filter(p => !['a4', 'f4'].includes(p.id));
        const newCustoms = [...savedCustoms, newPreset];

        setPresets([...DEFAULT_PRESETS, ...newCustoms]);
        localStorage.setItem(PRESETS_KEY, JSON.stringify(newCustoms));
        setSelectedPresetId(newPreset.id);
        setPresetName('');
        alert("Preset saved!");
    };

    const deletePreset = () => {
        if (['a4', 'f4'].includes(selectedPresetId)) {
            alert("Cannot delete default presets");
            return;
        }
        if (!confirm("Are you sure you want to delete this preset?")) return;

        const savedCustoms = presets.filter(p => !['a4', 'f4'].includes(p.id) && p.id !== selectedPresetId);
        setPresets([...DEFAULT_PRESETS, ...savedCustoms]);
        localStorage.setItem(PRESETS_KEY, JSON.stringify(savedCustoms));
        setSelectedPresetId('a4');
        setSettings(DEFAULT_PRESETS[0]);
    };

    // Helper calculate current approximated label width (for display/auto)
    const getCalculatedLabelWidth = () => {
        const availWidth = settings.width - settings.marginLeft - settings.marginRight;
        const totalGap = (settings.columns - 1) * settings.gapX;
        const w = (availWidth - totalGap) / settings.columns;
        return Math.max(0, Number(w.toFixed(2)));
    };

    const handleLabelWidthChange = (val) => {
        if (!val || val <= 0) {
            // If cleared, go back to auto-fill mode
            setSettings(prev => ({ ...prev, labelWidth: null }));
            return;
        }

        // Save the exact width the user wants
        // And auto-calculate columns to fit
        const availWidth = settings.width - settings.marginLeft - settings.marginRight;
        const cols = Math.floor((availWidth + settings.gapX) / (val + settings.gapX));
        const safeCols = Math.max(1, Math.min(cols, 20));

        setSettings(prev => ({
            ...prev,
            labelWidth: val,
            columns: safeCols
        }));
        if (selectedPresetId !== 'custom') setSelectedPresetId('custom');
    };

    // Pagination Logic
    const calculateItemsPerPage = () => {
        // Convert everything to mm for calculation
        const u = settings.unit === 'in' ? 25.4 : 1;

        const pageHeight = settings.height * u;
        const marginTop = settings.marginTop * u;
        const marginBottom = settings.marginBottom * u;
        const availHeight = pageHeight - marginTop - marginBottom;

        const pageWidth = settings.width * u;
        const marginLeft = settings.marginLeft * u;
        const marginRight = settings.marginRight * u;
        const availWidth = pageWidth - marginLeft - marginRight;

        const gapX = settings.gapX * u;
        const gapY = settings.gapY * u;

        // Calculate item width/height
        let itemWidth, itemHeight;

        if (settings.labelWidth && settings.labelWidth > 0) {
            itemWidth = settings.labelWidth * u;
        } else {
            // Auto width
            const totalGapX = (settings.columns - 1) * gapX;
            itemWidth = (availWidth - totalGapX) / settings.columns;
        }

        if (settings.labelHeight && settings.labelHeight > 0) {
            itemHeight = settings.labelHeight * u;
        } else {
            // Square aspect ratio
            itemHeight = itemWidth;
        }

        // Calculate rows per page
        // Equation: rows * itemHeight + (rows - 1) * gapY <= availHeight
        // rows * (itemHeight + gapY) - gapY <= availHeight
        // rows * (itemHeight + gapY) <= availHeight + gapY
        const rowHeight = itemHeight + gapY;
        const maxRows = Math.floor((availHeight + gapY) / rowHeight);

        // Ensure at least 1 row
        const safeRows = Math.max(1, maxRows);

        return safeRows * settings.columns;
    };

    const itemsPerPage = calculateItemsPerPage();

    // Prepare processed assets with empty slots for offset
    const processedAssets = [
        ...Array(startOffset).fill(null),
        ...assets
    ];

    const totalPages = Math.ceil(processedAssets.length / itemsPerPage);
    const pages = Array.from({ length: totalPages }, (_, i) => {
        return processedAssets.slice(i * itemsPerPage, (i + 1) * itemsPerPage);
    });

    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=800,width=1000');
        const u = settings.unit === 'in' ? 'in' : 'mm';

        // Check dimensions
        const isCustomHeight = settings.labelHeight !== null && settings.labelHeight > 0;
        const heightStyle = isCustomHeight ? `height: ${settings.labelHeight}${u};` : 'aspect-ratio: 1 / 1;';

        // Check grid width logic
        const isCustomWidth = settings.labelWidth !== null && settings.labelWidth > 0;
        const gridColStyle = isCustomWidth
            ? `repeat(${settings.columns}, ${settings.labelWidth}${u})`
            : `repeat(${settings.columns}, 1fr)`;

        // Calculate absolute font size for print safety
        let finalLabelWidthMm = 0;
        if (isCustomWidth) {
            finalLabelWidthMm = settings.unit === 'in' ? settings.labelWidth * 25.4 : settings.labelWidth;
        } else {
            const pageWMm = settings.unit === 'in' ? settings.width * 25.4 : settings.width;
            const marginLMm = settings.unit === 'in' ? settings.marginLeft * 25.4 : settings.marginLeft;
            const marginRMm = settings.unit === 'in' ? settings.marginRight * 25.4 : settings.marginRight;
            const gapXMm = settings.unit === 'in' ? settings.gapX * 25.4 : settings.gapX;

            const avail = pageWMm - marginLMm - marginRMm;
            const totalGap = (settings.columns - 1) * gapXMm;
            finalLabelWidthMm = (avail - totalGap) / settings.columns;
        }

        const titleSizeMm = finalLabelWidthMm * (settings.textSize / 100);
        const tagSizeMm = finalLabelWidthMm * (Math.max(2, settings.textSize - 2) / 100);

        // Print-specific CSS using absolute units
        const printCss = `
            @page {
                size: ${settings.width}${u} ${settings.height}${u};
                margin: 0;
            }
            body {
                margin: 0;
                font-family: Arial, sans-serif;
                background: white;
                color: black;
            }
            .page-container {
                width: ${settings.width}${u};
                height: ${settings.height}${u};
                box-sizing: border-box;
                padding-top: ${settings.marginTop}${u};
                padding-right: ${settings.marginRight}${u};
                padding-bottom: ${settings.marginBottom}${u};
                padding-left: ${settings.marginLeft}${u};
                page-break-after: always;
                position: relative;
                overflow: hidden;
            }
            .page-container:last-child {
                page-break-after: avoid;
            }
            .qr-grid {
                display: grid;
                grid-template-columns: ${gridColStyle};
                column-gap: ${settings.gapX}${u};
                row-gap: ${settings.gapY}${u};
                align-content: start;
            }
            .qr-item {
                border: ${settings.showBorder ? '1px solid #ccc' : 'none'};
                padding: 1px;
                text-align: center;
                border-radius: ${settings.shape === 'circle' ? '50%' : settings.shape === 'rounded' ? '12px' : '0'};
                ${heightStyle}
                ${isCustomWidth ? `width: ${settings.labelWidth}${u};` : ''} 
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 0;
                overflow: hidden;
                color: black;
                position: relative;
            }
            .qr-item h3 {
                margin: 0;
                font-size: ${titleSizeMm}mm;
                width: 98%;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                display: ${settings.showName ? 'block' : 'none'};
                line-height: 1;
                color: black;
            }
            .qr-item p {
                margin: 0;
                font-size: ${tagSizeMm}mm;
                font-weight: bold;
                width: 98%;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                display: ${settings.showTag ? 'block' : 'none'};
                line-height: 1;
                color: black;
            }
            .qr-wrapper {
                flex: 0 0 auto;
                width: ${settings.qrSize}%;
                aspect-ratio: 1/1;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            svg {
                /* SVG sizing controlled by clone/inject logic time */
                width: ${settings.qrSize}%;
                height: ${settings.qrSize}%;
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
            }
            @media print {
                .qr-item { border: ${settings.showBorder ? '1px solid #000' : 'none'}; }
                body { -webkit-print-color-adjust: exact; }
            }
        `;

        const htmlContent = `
            <html>
                <head>
                    <title>Print QR Codes</title>
                    <style>${printCss}</style>
                </head>
                <body>
                    ${pages.map((pageAssets, i) => `
                        <div class="page-container">
                            <div class="qr-grid">
                                ${pageAssets.map(asset => {
            if (!asset) {
                return `<div class="qr-item" style="border: none"></div>`;
            }
            return `
                                    <div class="qr-item">
                                        <h3>${getSerialDisplay(asset)}</h3>
                                        <div class="qr-wrapper" id="qr-wrapper-${asset.id}-print-${i}">
                                            <!-- SVG -->
                                        </div>
                                        <p>${asset.asset_tag}</p>
                                    </div>
                                `}).join('')}
                            </div>
                        </div>
                    `).join('')}
                </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();

        setTimeout(() => {
            // Need to copy SVGs effectively
            // Since we have pagination now, the IDs need to be matched correctly
            // Best way: re-generate SVGs or copy from source by matching asset IDs logic

            // This loop is a bit tricky with multipage. Let's do it by data matching
            // We can iterate over all assets
            assets.forEach(asset => {
                // Find source
                const sourceContainer = document.getElementById(`qr-code-bulk-${asset.id}`);
                if (!sourceContainer) return;
                const svg = sourceContainer.querySelector('svg');
                if (!svg) return;

                // Find all targets for this asset (technically 1 in print unless we printed same asset multiple times?)
                // Actually the asset list assumes unique assets or at least unique IDs.
                // We construct ID in print loop above: qr-wrapper-${asset.id}-print-${pageIndex}
                // But we don't know easily which page it is on here without recalc.
                // Simpler: use querySelectorAll with partial logical ID

                const targets = printWindow.document.querySelectorAll(`[id^="qr-wrapper-${asset.id}-print-"]`);
                targets.forEach(target => {
                    const clone = svg.cloneNode(true);
                    // Remove inline overrides so CSS class handles sizing
                    clone.style.width = "";
                    clone.style.height = "";
                    target.appendChild(clone);
                });
            });

            printWindow.focus();
            printWindow.print();
            printWindow.close();

            // Increment print count for all assets
            try {
                Promise.all(assets.map(asset => axios.post(`/asset/assets/${asset.id}/qr-print`)))
                    .then(() => {
                        if (onSuccess) onSuccess();
                    })
                    .catch(err => console.error('Error incrementing generic bulk counts', err));
            } catch (error) {
                console.error('Failed to initiate bulk increment', error);
            }
        }, 1000); // 1s wait suitable for large lists
    };

    if (!isOpen) return null;

    const uLabel = settings.unit;
    // PREVIEW: logic for display
    const isCustomWidth = settings.labelWidth !== null && settings.labelWidth > 0;
    const calcWidth = getCalculatedLabelWidth();
    const displayWidth = isCustomWidth ? settings.labelWidth : calcWidth;

    // Calculate text sizes for preview (matching print logic)
    let finalLabelWidthMm = 0;
    if (isCustomWidth) {
        finalLabelWidthMm = settings.unit === 'in' ? settings.labelWidth * 25.4 : settings.labelWidth;
    } else {
        const pageWMm = settings.unit === 'in' ? settings.width * 25.4 : settings.width;
        const marginLMm = settings.unit === 'in' ? settings.marginLeft * 25.4 : settings.marginLeft;
        const marginRMm = settings.unit === 'in' ? settings.marginRight * 25.4 : settings.marginRight;
        const gapXMm = settings.unit === 'in' ? settings.gapX * 25.4 : settings.gapX;

        const avail = pageWMm - marginLMm - marginRMm;
        const totalGap = (settings.columns - 1) * gapXMm;
        finalLabelWidthMm = (avail - totalGap) / settings.columns;
    }

    const previewTitleSizeMm = finalLabelWidthMm * (settings.textSize / 100);
    const previewTagSizeMm = finalLabelWidthMm * (Math.max(2, settings.textSize - 2) / 100);

    // Preview styles
    const pageStyle = {
        width: `${settings.width}${uLabel}`,
        height: `${settings.height}${uLabel}`,
        background: 'white',
        paddingTop: `${settings.marginTop}${uLabel}`,
        paddingRight: `${settings.marginRight}${uLabel}`,
        paddingBottom: `${settings.marginBottom}${uLabel}`,
        paddingLeft: `${settings.marginLeft}${uLabel}`,
        boxShadow: '0 0 20px rgba(0,0,0,0.2)',
        marginBottom: '40px',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0 // Prevent page compression
    };

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: isCustomWidth
            ? `repeat(${settings.columns}, ${settings.labelWidth}${uLabel})`
            : `repeat(${settings.columns}, 1fr)`,
        columnGap: `${settings.gapX}${uLabel}`,
        rowGap: `${settings.gapY}${uLabel}`,
        alignContent: 'start',
        color: 'black',
        height: '100%'
    };

    return (
        <div className="qr-modal-overlay" style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-row overflow-hidden"
                style={{ width: '95%', height: '90vh', background: 'var(--bg-color)', display: 'flex', flexDirection: 'row', borderRadius: '12px', border: '1px solid var(--border-color)' }}>

                {/* Sidebar - Settings */}
                <div className="settings-sidebar custom-scrollbar" style={{ width: '350px', minWidth: '350px', flexShrink: 0, padding: '20px', borderRight: '1px solid var(--border-color)', overflowY: 'auto', background: 'var(--bg-secondary)' }}>
                    <div className="flex justify-between items-center mb-6" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h2 className="text-xl font-bold" style={{ margin: 0 }}>Print Settings</h2>
                        <div style={{ display: 'flex', background: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                            <button
                                onClick={() => handleUnitChange('mm')}
                                style={{ padding: '4px 8px', background: settings.unit === 'mm' ? 'var(--primary-color)' : 'transparent', color: settings.unit === 'mm' ? 'white' : 'var(--text-primary)', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                            >mm</button>
                            <button
                                onClick={() => handleUnitChange('in')}
                                style={{ padding: '4px 8px', background: settings.unit === 'in' ? 'var(--primary-color)' : 'transparent', color: settings.unit === 'in' ? 'white' : 'var(--text-primary)', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                            >inch</button>
                        </div>
                    </div>

                    {/* Preset Selection */}
                    <div className="form-group mb-4" style={{ marginBottom: '16px' }}>
                        <label className="block text-sm font-medium mb-1">Preset</label>
                        <select
                            className="form-select w-full"
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                            value={selectedPresetId}
                            onChange={handlePresetChange}
                        >
                            <option value="custom">Custom Settings</option>
                            <optgroup label="Defaults">
                                {DEFAULT_PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </optgroup>
                            <optgroup label="Saved">
                                {presets.filter(p => !['a4', 'f4'].includes(p.id)).map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

                    {/* Paper Size */}
                    <div className="mb-4" style={{ marginBottom: '16px' }}>
                        <h3 className="font-semibold mb-2 flex items-center gap-2" style={{ fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                            <FiLayout className="mr-2" /> Paper Size ({uLabel})
                        </h3>
                        <div className="grid grid-cols-2 gap-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                                <label className="text-xs">Width</label>
                                <input type="number" step="0.1" className="form-input w-full" value={settings.width} onChange={e => updateSetting('width', Number(e.target.value))} />
                            </div>
                            <div>
                                <label className="text-xs">Height</label>
                                <input type="number" step="0.1" className="form-input w-full" value={settings.height} onChange={e => updateSetting('height', Number(e.target.value))} />
                            </div>
                        </div>

                        <div className="mt-2">
                            <label className="text-xs block mb-1">Margins ({uLabel})</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div>
                                    <span style={{ fontSize: '10px' }}>Top</span>
                                    <input type="number" step="0.1" className="form-input w-full" value={settings.marginTop} onChange={e => updateSetting('marginTop', Number(e.target.value))} />
                                </div>
                                <div>
                                    <span style={{ fontSize: '10px' }}>Right</span>
                                    <input type="number" step="0.1" className="form-input w-full" value={settings.marginRight} onChange={e => updateSetting('marginRight', Number(e.target.value))} />
                                </div>
                                <div>
                                    <span style={{ fontSize: '10px' }}>Bottom</span>
                                    <input type="number" step="0.1" className="form-input w-full" value={settings.marginBottom} onChange={e => updateSetting('marginBottom', Number(e.target.value))} />
                                </div>
                                <div>
                                    <span style={{ fontSize: '10px' }}>Left</span>
                                    <input type="number" step="0.1" className="form-input w-full" value={settings.marginLeft} onChange={e => updateSetting('marginLeft', Number(e.target.value))} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Label Dimensions (New Section) */}
                    <div className="mb-4" style={{ marginBottom: '16px' }}>
                        <h3 className="font-semibold mb-2 flex items-center gap-2" style={{ fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                            <FiBox className="mr-2" /> Label Dimensions ({uLabel})
                        </h3>
                        <div className="mb-2">
                            <div>
                                <label className="text-xs">Label Width {isCustomWidth ? '(Fixed)' : '(Auto)'}</label>
                                <input
                                    type="number" step="0.1" className="form-input w-full"
                                    value={displayWidth}
                                    onChange={e => handleLabelWidthChange(Number(e.target.value))}
                                />
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                            * Set Width to fix size. Use Slider to reset to auto.
                        </div>
                    </div>

                    {/* Grid Layout */}
                    <div className="mb-4" style={{ marginBottom: '16px' }}>
                        <h3 className="font-semibold mb-2" style={{ fontSize: '14px', marginBottom: '8px' }}>Grid Layout</h3>

                        {/* Skip Labels Input */}
                        <div className="mb-2">
                            <label className="text-xs">Skip Initial Labels</label>
                            <input
                                type="number"
                                min="0"
                                max={itemsPerPage - 1}
                                className="form-input w-full"
                                value={startOffset}
                                onChange={e => setStartOffset(Math.max(0, parseInt(e.target.value) || 0))}
                            />
                        </div>

                        <div className="mb-2">
                            <label className="text-xs">Columns</label>
                            <input type="range" min="1" max="10" className="w-full" style={{ width: '100%' }} value={settings.columns} onChange={e => handleColumnsChange(Number(e.target.value))} />
                            <div className="text-right text-xs">{settings.columns} cols</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                                <label className="text-xs">Gap X ({uLabel})</label>
                                <input type="number" step="0.1" className="form-input w-full" value={settings.gapX} onChange={e => updateSetting('gapX', Number(e.target.value))} />
                            </div>
                            <div>
                                <label className="text-xs">Gap Y ({uLabel})</label>
                                <input type="number" step="0.1" className="form-input w-full" value={settings.gapY} onChange={e => updateSetting('gapY', Number(e.target.value))} />
                            </div>
                        </div>
                    </div>

                    {/* Content & Style */}
                    <div className="mb-4" style={{ marginBottom: '16px' }}>
                        <h3 className="font-semibold mb-2 flex items-center gap-2" style={{ fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                            <FiType className="mr-2" /> Content & Style
                        </h3>

                        <div className="mb-2">
                            <label className="text-xs">QR Code Scale (Safe Zone)</label>
                            <input type="range" min="30" max="100" className="w-full" style={{ width: '100%' }} value={settings.qrSize} onChange={e => updateSetting('qrSize', Number(e.target.value))} />
                            <div className="text-right text-xs">{settings.qrSize}%</div>
                        </div>
                        <div className="mb-2">
                            <label className="text-xs block mb-1">Text Scale (Relative)</label>
                            <input type="range" min="2" max="25" step="0.5" className="w-full" style={{ width: '100%' }} value={settings.textSize} onChange={e => updateSetting('textSize', Number(e.target.value))} />
                            <div className="text-right text-xs">{settings.textSize} units</div>
                        </div>
                        <div className="mb-2" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            <label className="flex items-center text-xs" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <input type="checkbox" checked={settings.showName} onChange={e => updateSetting('showName', e.target.checked)} />
                                Show Name
                            </label>
                            <label className="flex items-center text-xs" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <input type="checkbox" checked={settings.showTag} onChange={e => updateSetting('showTag', e.target.checked)} />
                                Show Tag
                            </label>
                            <label className="flex items-center text-xs" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <input type="checkbox" checked={settings.showBorder} onChange={e => updateSetting('showBorder', e.target.checked)} />
                                Show Border
                            </label>
                        </div>
                        <div className="mt-2">
                            <label className="text-xs block mb-1">Shape</label>
                            <div className="flex gap-2" style={{ display: 'flex', gap: '8px' }}>
                                {['square', 'rounded', 'circle'].map(shape => (
                                    <button
                                        key={shape}
                                        onClick={() => updateSetting('shape', shape)}
                                        className={`px-3 py-1 text-xs border rounded`}
                                        style={{
                                            padding: '4px 8px',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '4px',
                                            background: settings.shape === shape ? 'var(--primary-color)' : 'transparent',
                                            color: settings.shape === shape ? 'white' : 'var(--text-primary)',
                                            cursor: 'pointer',
                                            textTransform: 'capitalize'
                                        }}
                                    >
                                        {shape}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Save Preset Action */}
                    <div className="mt-6 pt-4 border-t border-gray-200" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                        <div className="flex gap-2 mb-2" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <input
                                type="text"
                                placeholder="New Preset Name"
                                className="form-input flex-1"
                                value={presetName}
                                onChange={e => setPresetName(e.target.value)}
                            />
                            <button onClick={savePreset} disabled={!presetName} className="btn btn-sm btn-outline" title="Save Preset">
                                <FiSave />
                            </button>
                        </div>
                        {selectedPresetId !== 'a4' && selectedPresetId !== 'f4' && selectedPresetId !== 'custom' && (
                            <button onClick={deletePreset} className="btn btn-sm btn-danger w-full" style={{ width: '100%', justifyContent: 'center' }}>
                                <FiTrash2 /> Delete Current Preset
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Preview Area */}
                <div className="flex-1 flex flex-col" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div className="p-4 border-b flex justify-between items-center" style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
                        <span className="text-sm text-gray-500">
                            Preview: {assets.length} assets | {itemsPerPage} items/page | {totalPages} pages
                        </span>
                        <div className="flex gap-2" style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={onClose} className="btn btn-outline">Cancel</button>
                            <button onClick={handlePrint} className="btn btn-primary"><FiPrinter /> Print</button>
                        </div>
                    </div>

                    <div className="modal-preview-area custom-scrollbar p-8 bg-gray-100 flex-1 overflow-auto flex flex-col items-center"
                        style={{
                            flex: 1,
                            overflow: 'auto',
                            padding: '40px',
                            background: '#525659',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '40px'
                        }}>

                        {/* Render Pages */}
                        {pages.map((pageAssets, index) => (
                            <div key={index} className="page-sheet bg-white shadow-lg transition-all duration-300" style={pageStyle}>
                                <div className="page-label absolute top-0 right-0 bg-gray-200 text-xs px-2" style={{ position: 'absolute', top: 0, right: '-40px', background: '#ccc', color: '#000', padding: '4px 8px', fontWeight: 'bold' }}>
                                    Pg {index + 1}
                                </div>
                                <div style={gridStyle}>
                                    {pageAssets.map((asset, assetIndex) => {
                                        if (!asset) {
                                            return (
                                                <div key={`empty-${index}-${assetIndex}`} className="preview-item" style={{
                                                    border: 'none',
                                                    borderRadius: settings.shape === 'circle' ? '50%' : settings.shape === 'rounded' ? '12px' : '0',
                                                    padding: '1px',
                                                    aspectRatio: (settings.labelHeight && settings.labelHeight > 0) ? 'auto' : '1/1',
                                                    height: (settings.labelHeight && settings.labelHeight > 0) ? `${settings.labelHeight}${uLabel}` : 'auto',
                                                    width: isCustomWidth ? `${settings.labelWidth}${uLabel}` : 'auto',
                                                    textAlign: 'center'
                                                }}></div>
                                            );
                                        }

                                        return (
                                            <div key={asset.id} className="preview-item" style={{
                                                border: settings.showBorder ? '1px solid #ccc' : 'none',
                                                borderRadius: settings.shape === 'circle' ? '50%' : settings.shape === 'rounded' ? '12px' : '0',
                                                padding: '1px',
                                                textAlign: 'center',
                                                aspectRatio: (settings.labelHeight && settings.labelHeight > 0) ? 'auto' : '1/1',
                                                height: (settings.labelHeight && settings.labelHeight > 0) ? `${settings.labelHeight}${uLabel}` : 'auto',
                                                width: isCustomWidth ? `${settings.labelWidth}${uLabel}` : 'auto',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0',
                                                overflow: 'hidden',
                                                color: 'black',
                                                position: 'relative'
                                            }}>
                                                <h3 style={{
                                                    margin: '0',
                                                    fontSize: `${previewTitleSizeMm}mm`,
                                                    width: '98%',
                                                    overflow: 'hidden',
                                                    whiteSpace: 'nowrap',
                                                    textOverflow: 'ellipsis',
                                                    display: settings.showName ? 'block' : 'none',
                                                    lineHeight: '1',
                                                    color: 'black'
                                                }}>
                                                    {getSerialDisplay(asset)}
                                                </h3>

                                                {/* Flexible QR Wrapper 
                                                size controlled by width % and aspect ratio
                                                This ensures the box collapses tightly around the QR
                                            */}
                                                <div id={`qr-code-bulk-${asset.id}`} style={{
                                                    flex: '0 0 auto',
                                                    width: `${settings.qrSize}%`,
                                                    aspectRatio: '1/1',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                }}>
                                                    <QRCode
                                                        size={256}
                                                        style={{
                                                            height: "100%",
                                                            width: "100%",
                                                            maxWidth: '100%',
                                                            maxHeight: '100%'
                                                        }}
                                                        value={`${window.location.origin}/asset/scan/${asset.id}`}
                                                        viewBox={`0 0 256 256`}
                                                    />
                                                </div>

                                                <p style={{
                                                    margin: '0',
                                                    fontSize: `${previewTagSizeMm}mm`,
                                                    fontWeight: 'bold',
                                                    width: '98%',
                                                    overflow: 'hidden',
                                                    whiteSpace: 'nowrap',
                                                    textOverflow: 'ellipsis',
                                                    display: settings.showTag ? 'block' : 'none',
                                                    lineHeight: '1',
                                                    color: 'black'
                                                }}>
                                                    {asset.asset_tag}
                                                </p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkQRModal;
