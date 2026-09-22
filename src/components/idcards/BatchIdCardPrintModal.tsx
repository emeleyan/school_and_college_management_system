import React, { useState } from 'react';
import { CardData, SingleIdCardView, IdCardCustomConfig } from './SingleIdCardView';
import { Institute, IdCardOrientation, IdCardTheme } from '../../types';
import { X, Printer, Layers, Sliders, Check } from 'lucide-react';

interface BatchIdCardPrintModalProps {
  cards: CardData[];
  institute?: Institute | null;
  defaultOrientation?: IdCardOrientation;
  defaultTheme?: IdCardTheme;
  config?: IdCardCustomConfig;
  onClose: () => void;
}

export const BatchIdCardPrintModal: React.FC<BatchIdCardPrintModalProps> = ({
  cards,
  institute,
  defaultOrientation = 'portrait',
  defaultTheme = 'classic_blue',
  config,
  onClose,
}) => {
  const [printSide, setPrintSide] = useState<'front' | 'back' | 'both'>('front');
  const [orientation, setOrientation] = useState<IdCardOrientation>(defaultOrientation);
  const [theme, setTheme] = useState<IdCardTheme>(defaultTheme);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      {/* Top Floating Control Bar (Hidden on Print) */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-60 bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-slate-700 flex flex-wrap items-center gap-4 print:hidden">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-400" />
          <span className="font-bold text-xs">
            Batch Print Sheet ({cards.length} Cards Selected)
          </span>
        </div>

        {/* Side Selector */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setPrintSide('front')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
              printSide === 'front' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Front Only
          </button>
          <button
            type="button"
            onClick={() => setPrintSide('back')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
              printSide === 'back' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Back Only
          </button>
          <button
            type="button"
            onClick={() => setPrintSide('both')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
              printSide === 'both' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Both (Front & Back)
          </button>
        </div>

        {/* Orientation Toggle */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setOrientation('portrait')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
              orientation === 'portrait' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Portrait (লম্বালম্বি)
          </button>
          <button
            type="button"
            onClick={() => setOrientation('landscape')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
              orientation === 'landscape' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Landscape (আড়াআড়ি)
          </button>
        </div>

        {/* Print Action */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print A4 Sheet</span>
        </button>

        <button
          onClick={onClose}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
          title="Close Sheet"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* A4 PRINTABLE CANVAS SHEET */}
      <div className="mt-20 my-auto bg-white p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full print:m-0 print:p-0 print:border-none print:shadow-none print:max-w-none">
        <div className="mb-4 text-center border-b border-slate-200 pb-2 print:hidden">
          <h3 className="text-sm font-bold text-slate-800">
            A4 Pre-Cut Printing Layout (Standard CR80 Size with Cutting Crop Marks)
          </h3>
          <p className="text-xs text-slate-500">
            Printer settings tip: Set Paper Size to A4, Margins to 'None' or 'Minimum', and enable Background Graphics.
          </p>
        </div>

        {/* ID CARDS GRID (A4 Optimized) */}
        <div
          className={`grid gap-4 justify-items-center ${
            orientation === 'portrait'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-2 print:gap-3'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 print:grid-cols-2 print:gap-4'
          }`}
        >
          {cards.map((card, index) => (
            <React.Fragment key={card.id}>
              {/* FRONT SIDE */}
              {(printSide === 'front' || printSide === 'both') && (
                <div className="p-1 border border-dashed border-slate-400 rounded-2xl relative group print:border-dashed print:border-slate-300">
                  <div className="absolute -top-2 left-2 px-1 bg-white text-[8px] font-mono text-slate-400 print:hidden">
                    Cut #{index + 1} Front
                  </div>
                  <SingleIdCardView
                    card={card}
                    institute={institute}
                    orientation={orientation}
                    theme={theme}
                    showBack={false}
                    config={config}
                  />
                </div>
              )}

              {/* BACK SIDE */}
              {(printSide === 'back' || printSide === 'both') && (
                <div className="p-1 border border-dashed border-slate-400 rounded-2xl relative group print:border-dashed print:border-slate-300">
                  <div className="absolute -top-2 left-2 px-1 bg-white text-[8px] font-mono text-slate-400 print:hidden">
                    Cut #{index + 1} Back
                  </div>
                  <SingleIdCardView
                    card={card}
                    institute={institute}
                    orientation={orientation}
                    theme={theme}
                    showBack={true}
                    config={config}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {cards.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            No cards selected for batch printing.
          </div>
        )}
      </div>
    </div>
  );
};
