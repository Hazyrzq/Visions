import { Figtree } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";
import { ConfirmProvider } from '@/components/ui/ConfirmProvider';
import { LanguageProvider } from '@/lib/i18n/LanguageContext'; // 1. TAMBAHKAN IMPORT INI

const figtree = Figtree({ 
  subsets: ['latin'], 
  weight: ['300','400','500','600','700','800'],
  variable: '--font-sans' 
});

export const metadata = {
  title: 'Visions - ChurnShield',
  description: 'Platform prediksi churn pelanggan berbasis Machine Learning',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Visions',
  },
};

export const viewport = {
  themeColor: '#2563EB',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={cn("font-sans", figtree.variable)}>
      <body className={figtree.className}>
        {/* 2. BUNGKUS CONFIRM PROVIDER DI DALAM LANGUAGE PROVIDER */}
        <LanguageProvider>
          <ConfirmProvider>
            {children}
          </ConfirmProvider>
        </LanguageProvider>
        
        {/* Service Worker Registration for PWA */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(reg) {
                      console.log('[PWA] Service Worker registered with scope: ', reg.scope);
                    },
                    function(err) {
                      console.log('[PWA] Service Worker registration failed: ', err);
                    }
                  );
                });
              }
            `
          }}
        />
      </body>
    </html>
  );
}