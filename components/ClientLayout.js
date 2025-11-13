'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import SellerNavbar from './SellerNavbar';
import ToastContainer from './Toast';
import useAuthStore from '@/store/useAuthStore';

export default function ClientLayout({ children }) {
  const { user, isHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine which navbar to show
  // Show seller navbar whenever user is a seller, regardless of current path
  const showSellerNavbar = mounted && isHydrated && user && user.role === 'seller';

  return (
    <>
      {showSellerNavbar ? <SellerNavbar /> : <Navbar />}
      <ToastContainer />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
    </>
  );
}

