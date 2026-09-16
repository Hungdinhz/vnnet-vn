import { GameItem } from '@/types/game';

export function normalizeGameItem(game: GameItem): GameItem {
  if (!game) return game;

  const titleLower = (game.title || '').toLowerCase();

  let title = game.title;
  let description = game.description;
  let imageUrl = game.image_url;
  let thumbnailUrl = game.thumbnail_url;

  if (titleLower.includes('quiz')) {
    title = 'Đố Vui Kiến Thức';
    description = 'Thử thách kiến thức tổng hợp với đa dạng chủ đề hấp dẫn: Khoa học, Địa lý, Lịch sử, Âm nhạc, Đố vui Logo...';
    imageUrl = 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&auto=format&fit=crop&q=60';
    thumbnailUrl = 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=400&auto=format&fit=crop&q=60';
  } else if (titleLower.includes('speed') || titleLower.includes('type')) {
    title = 'Thử Thách Gõ Nhanh';
    description = 'Kiểm tra tốc độ gõ phím và độ chính xác với kho từ vựng phong phú trong thời gian 60 giây!';
    imageUrl = 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=60';
    thumbnailUrl = 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&auto=format&fit=crop&q=60';
  } else if (titleLower.includes('memory') || titleLower.includes('match')) {
    title = 'Lật Thẻ Ghi Nhớ';
    description = 'Lật thẻ và tìm các cặp biểu tượng giống nhau trong lưới 4x4. Rèn luyện khả năng quan sát và trí nhớ đỉnh cao!';
    imageUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60';
    thumbnailUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=60';
  }

  return {
    ...game,
    title,
    description,
    image_url: imageUrl,
    thumbnail_url: thumbnailUrl,
  };
}
