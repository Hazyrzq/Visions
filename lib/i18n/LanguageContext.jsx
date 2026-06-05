'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import id from '@/lib/i18n/id.json';
import en from '@/lib/i18n/en.json';

const translations = { id, en };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('id');

  // Persist pilihan bahasa ke localStorage
  useEffect(() => {
    const saved = localStorage.getItem('vs-lang');
    if (saved === 'id' || saved === 'en') setLang(saved);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'id' ? 'en' : 'id';
      localStorage.setItem('vs-lang', next);
      return next;
    });
  }, []);

  // t('nav.overview') → string terjemahan
  // t('nav.overview', { name: 'Budi' }) → interpolasi {{name}}
  const t = useCallback((key, vars) => {
    const keys = key.split('.');
    let val = translations[lang];
    for (const k of keys) {
      val = val?.[k];
      if (val === undefined) break;
    }
    if (Array.isArray(val)) return val;
    if (typeof val !== 'string') return key; // fallback ke key jika tidak ditemukan
    if (!vars) return val;
    return val.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang harus dipakai di dalam LanguageProvider');
  return ctx;
}
