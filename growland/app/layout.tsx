import './globals.css';
import Nav from '@/components/Nav';

export const metadata = { title: 'GrowLand | Grow Together, Go Further', description: 'اکوسیستم رشد، مهارت و فرصت شغلی GrowLand' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fa" dir="rtl"><body><Nav />{children}</body></html>;
}
