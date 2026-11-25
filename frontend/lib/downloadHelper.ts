import api from '@/lib/axios';

/**
 * Helper tải tệp/ảnh an toàn qua backend proxy có xác thực JWT (chặn điều hướng cross-origin trực tiếp)
 */
export async function downloadMediaOrFile(url: string, defaultFilename: string) {
  if (!url) return;

  try {
    const res = await api.get('/upload/download', {
      params: { url, name: defaultFilename },
      responseType: 'blob',
    });

    const blob = new Blob([res.data], {
      type: res.headers['content-type'] || 'application/octet-stream',
    });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 401) {
      alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tải tệp!');
      return;
    }
    console.error('Không thể tải tệp xuống:', err);
    alert('Không thể tải tệp này xuống. Tệp có thể không hợp lệ hoặc không thuộc máy chủ lưu trữ của hệ thống.');
  }
}
