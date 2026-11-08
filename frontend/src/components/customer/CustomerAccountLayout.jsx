import React from 'react';
import PublicNavbar from '../layout/PublicNavbar';
import CustomerMobileNav from './CustomerMobileNav';

export default function CustomerAccountLayout({ children }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f3eb] text-[#173b2e]">
      <PublicNavbar />
      <main className="box-border min-w-0 w-full px-4 pb-28 pt-24 sm:px-7 lg:px-10 lg:pb-20 lg:pt-28">
        <div className="mx-auto w-full max-w-[1500px]">{children}</div>
      </main>
      <CustomerMobileNav activeView="account" />
    </div>
  );
}
