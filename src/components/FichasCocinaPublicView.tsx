import React, { useState } from 'react';
import { FileText, Printer, Download, Eye, Calendar, Sparkles, ChevronRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FichasCocinaPublicView: React.FC = () => {
  const [selectedPreview, setSelectedPreview] = useState<'nov28' | 'nov20'>('nov28');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 -ml-1 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Volver al inicio"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>📋 Fichas de Cocina A4</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                11 Días
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Rango del 20 al 30 de Noviembre • Catering Kevin
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/fichas-cocina.pdf"
            download="Fichas_Cocina_20_al_30_Noviembre.pdf"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Descargar</span> PDF
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Hero Card */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-700 rounded-3xl p-5 sm:p-7 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Listo para Imprimir / Celular
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Fichas de Cocina A4 (20 al 30 de Noviembre)
            </h2>
            <p className="text-sm text-blue-100 max-w-xl leading-relaxed">
              11 páginas A4 (1 hoja por día) con cuadrícula de 8 fichas por página, diseño con fondo orgánico, fecha en cabecera y recuadros sin evento en blanco limpio.
            </p>

            {/* Action buttons */}
            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href="/fichas-cocina.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-slate-900 font-extrabold text-sm shadow-md hover:bg-blue-50 transition-all active:scale-95"
              >
                <FileText className="w-4 h-4 text-rose-600" />
                Abrir PDF en Celular
              </a>

              <a
                href="/fichas-cocina.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-sm backdrop-blur-md border border-white/25 transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" />
                Ver Plantilla Web HTML
              </a>
            </div>
          </div>
        </div>

        {/* Resumen de días */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            Resumen de las 11 Páginas A4
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-slate-400 font-medium">Vie 20 Nov</div>
              <div className="font-bold text-slate-600 dark:text-slate-300">0 eventos (En blanco)</div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
              <div className="text-blue-500 font-bold">Sáb 21 Nov</div>
              <div className="font-extrabold text-blue-900 dark:text-blue-200">2 eventos (Cristales, Gladiolos)</div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
              <div className="text-blue-500 font-bold">Dom 22 Nov</div>
              <div className="font-extrabold text-blue-900 dark:text-blue-200">1 evento (Villa Santiago)</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-slate-400 font-medium">Lun 23 a Jue 26</div>
              <div className="font-bold text-slate-600 dark:text-slate-300">0 eventos (En blanco)</div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
              <div className="text-blue-500 font-bold">Vie 27 Nov</div>
              <div className="font-extrabold text-blue-900 dark:text-blue-200">2 eventos (Villa Santiago, Cristales)</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
              <div className="text-emerald-600 font-bold">Sáb 28 Nov ⭐</div>
              <div className="font-extrabold text-emerald-900 dark:text-emerald-200">5 eventos completos</div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
              <div className="text-blue-500 font-bold">Dom 29 Nov</div>
              <div className="font-extrabold text-blue-900 dark:text-blue-200">3 eventos (Cristales, Aryes, Villa S.)</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-slate-400 font-medium">Lun 30 Nov</div>
              <div className="font-bold text-slate-600 dark:text-slate-300">0 eventos (En blanco)</div>
            </div>
          </div>
        </div>

        {/* Visual Previews on mobile */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-500" />
                Vista Previa de la Hoja
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Toca una pestaña para ver la hoja con eventos o la hoja en blanco:
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setSelectedPreview('nov28')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedPreview === 'nov28'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Sáb 28 (Con eventos)
              </button>
              <button
                onClick={() => setSelectedPreview('nov20')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedPreview === 'nov20'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Vie 20 (Sin eventos)
              </button>
            </div>
          </div>

          {/* Image Container with high quality */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 flex justify-center p-2 sm:p-4">
            <img
              src={selectedPreview === 'nov28' ? '/fichas-cocina-28nov.png' : '/fichas-cocina-20nov.png'}
              alt={selectedPreview === 'nov28' ? 'Fichas de Cocina 28 de Noviembre' : 'Fichas de Cocina 20 de Noviembre'}
              className="max-h-[750px] w-auto object-contain rounded-lg shadow-md"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-400 dark:text-slate-600">
        Catering Kevin • Sistema de Fichas de Cocina A4
      </footer>
    </div>
  );
};
