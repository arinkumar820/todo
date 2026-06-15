// src/app/layout.js
import './globals.css';

export const metadata = {
  title: 'AuraTodo — Premium Task Manager',
  description: 'Manage your daily workflows with absolute clarity and smooth performance.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
