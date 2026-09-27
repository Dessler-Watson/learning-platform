'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function pageNumbers(page: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const out: (number | '...')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) out.push('...');
  for (let n = start; n <= end; n++) out.push(n);
  if (end < totalPages - 1) out.push('...');
  out.push(totalPages);
  return out;
}

/**
 * Paginación con la misma idea visual que la de Prácticas Públicas:
 * pills numeradas, Anterior/Siguiente e "Ir a la página".
 */
export function Pagination({
  page,
  totalPages,
  disabled,
  onPage,
}: {
  page: number;
  totalPages: number;
  disabled?: boolean;
  onPage: (page: number) => void;
}) {
  const [goTo, setGoTo] = useState('');

  if (totalPages <= 1) return null;

  const goToPage = () => {
    const n = parseInt(goTo, 10);
    if (Number.isNaN(n)) return;
    setGoTo('');
    onPage(n);
  };

  const pillBase =
    'rounded-full px-3.5 py-2 text-xs font-black transition-all duration-200 disabled:opacity-40';
  const pillIdle = { background: '#f5f0ea', color: '#8A7A6A', border: '2px solid transparent' };
  const pillActive = {
    background: 'rgba(0, 160, 181, 0.15)',
    color: '#00A0B5',
    border: '2px solid #00A0B5',
  };

  return (
    <div className="flex flex-col items-center gap-3 pt-1">
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          disabled={disabled || page <= 1}
          onClick={() => onPage(page - 1)}
          className={`flex items-center gap-1 ${pillBase}`}
          style={pillIdle}
        >
          <ChevronLeft size={14} />
          Anterior
        </button>
        {pageNumbers(page, totalPages).map((n, i) =>
          n === '...' ? (
            <span key={`gap-${i}`} className="px-1 text-xs font-black text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onPage(n)}
              className={pillBase}
              style={n === page ? pillActive : pillIdle}
            >
              {n}
            </button>
          )
        )}
        <button
          type="button"
          disabled={disabled || page >= totalPages}
          onClick={() => onPage(page + 1)}
          className={`flex items-center gap-1 ${pillBase}`}
          style={pillIdle}
        >
          Siguiente
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
        <label htmlFor="panel-go-page">Ir a la pagina</label>
        <input
          id="panel-go-page"
          inputMode="numeric"
          value={goTo}
          onChange={(e) => setGoTo(e.target.value.replace(/[^0-9]/g, ''))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') goToPage();
          }}
          className="w-16 rounded-xl border-2 border-[#F0E6D6] bg-gray-50 px-2 py-1.5 text-center text-xs font-black text-gray-700 outline-none transition-all focus:border-[#00A0B5]"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={goToPage}
          className="rounded-full bg-[#00A0B5] px-3 py-1.5 text-xs font-black text-white disabled:opacity-40"
        >
          Ir
        </button>
        <span className="text-gray-400">
          Pagina {page} de {totalPages}
        </span>
      </div>
    </div>
  );
}
