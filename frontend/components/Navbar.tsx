// components/Navbar.tsx
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-blue-600">
          MạngXãHội
        </Link>

        {/* Khung tìm kiếm giả lập */}
        <div className="hidden md:block">
          <input 
            type="text" 
            placeholder="Tìm kiếm..." 
            className="bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>

        {/* Menu góc phải (Avatar user) */}
        <div className="flex items-center space-x-4">
          <button className="text-gray-600 hover:bg-gray-100 p-2 rounded-full">
            🔔
          </button>
          <div className="w-8 h-8 bg-blue-500 rounded-full text-white flex items-center justify-center font-bold">
            H
          </div>
        </div>
      </div>
    </nav>
  );
}