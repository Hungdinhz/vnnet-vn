/**
 * Helper to reliably download cross-origin files or images without navigation
 */
export async function downloadMediaOrFile(url: string, defaultFilename: string) {
  if (!url) return;

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const proxyUrl = `${backendUrl}/upload/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(defaultFilename)}`;

  try {
    const res = await fetch(proxyUrl);
    if (!res.ok) {
      if (res.status === 401) {
        alert(
          'Tệp này được tải lên trước khi sửa lỗi và bị Cloudinary chặn quyền truy cập trực tiếp. Bạn vui lòng gửi lại tệp PDF mới để tải về bình thường nhé!'
        );
        return;
      }
      throw new Error(`HTTP error ${res.status}`);
    }
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  } catch (err) {
    console.warn('Fetch blob download failed, falling back to direct anchor:', err);
    const link = document.createElement('a');
    link.href = proxyUrl;
    link.setAttribute('download', defaultFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
