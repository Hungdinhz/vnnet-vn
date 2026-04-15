// components/Sidebar.tsx
import Link from 'next/link';

export default function Sidebar() {
  const menuItems = [
    { name: '🏠 Bảng tin', path: '/' },
    { name: '👤 Hồ sơ', path: '/profile' },
    { name: '⚙️ Cài đặt', path: '/settings' },
  ];

  return (
    <aside className="w-64 bg-white border-r h-[calc(100vh-4rem)] sticky top-16 hidden md:block">
      <div className="p-4 flex flex-col gap-2">
        {menuItems.map((item, index) => (
          <Link 
            key={index} 
            href={item.path}
            className="p-3 hover:bg-gray-100 rounded-lg text-gray-700 font-medium transition-colors"
          >
            {item.name}
          </Link>
        ))}
      </div>
    </aside>
  );
}