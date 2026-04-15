// app/page.tsx
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto flex">
        <Sidebar />
        {/* Khu vực chứa Newsfeed */}
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold text-gray-800">Newsfeed của Hùng 🚀</h1>
          <div className="mt-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-gray-600">Nội dung các bài đăng sẽ được gọi từ FastAPI và hiển thị ở đây...</p>
          </div>
        </main>
      </div>
    </div>
  );
}