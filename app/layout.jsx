import { Figtree } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";
import { ConfirmProvider } from '@/components/ui/ConfirmProvider';

const figtree = Figtree({ 
  subsets: ['latin'], 
  weight: ['300','400','500','600','700','800'],
  variable: '--font-sans' 
});

export const metadata = {
  title: 'Visions - ChurnShield',
  description: 'Platform prediksi churn pelanggan berbasis Machine Learning',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={cn("font-sans", figtree.variable)}>
      <body className={figtree.className}>
        {/* BUNGKUS CHILDREN DENGAN CONFIRM PROVIDER */}
        <ConfirmProvider>
          {children}
        </ConfirmProvider>
      </body>
    </html>
  );
}