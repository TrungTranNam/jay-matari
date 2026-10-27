import Header from '@/components/Header';
import '../styles/auth.css';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <><Header /><div className="pg-auth">{children}</div></>;
}
