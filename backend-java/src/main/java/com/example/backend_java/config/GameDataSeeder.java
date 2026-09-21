package com.example.backend_java.config;

import com.example.backend_java.entity.Game;
import com.example.backend_java.entity.GameAchievement;
import com.example.backend_java.repository.GameAchievementRepository;
import com.example.backend_java.repository.GameRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class GameDataSeeder implements CommandLineRunner {

    private final GameRepository gameRepository;
    private final GameAchievementRepository gameAchievementRepository;

    public GameDataSeeder(GameRepository gameRepository, GameAchievementRepository gameAchievementRepository) {
        this.gameRepository = gameRepository;
        this.gameAchievementRepository = gameAchievementRepository;
    }

    @Override
    public void run(String... args) {
        // 1. Nếu chưa có game nào trong DB thì seed mới
        if (gameRepository.count() == 0) {
            seedInitialGames();
            return;
        }

        // 2. Nếu đã có dữ liệu cũ trong DB (chứa Anime), tự động chuẩn hóa sang phong cách hiện đại tiêu chuẩn
        List<Game> existingGames = gameRepository.findAll();
        for (Game g : existingGames) {
            boolean updated = false;

            if (g.getTitle() != null && g.getTitle().toLowerCase().contains("quiz")) {
                g.setTitle("Đố Vui Kiến Thức");
                g.setDescription("Thử thách kiến thức tổng hợp với đa dạng chủ đề hấp dẫn: Khoa học, Địa lý, Lịch sử, Âm nhạc, Đố vui Logo...");
                g.setImageUrl("https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&auto=format&fit=crop&q=60");
                g.setThumbnailUrl("https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=400&auto=format&fit=crop&q=60");
                updated = true;
            } else if (g.getTitle() != null && (g.getTitle().toLowerCase().contains("speed") || g.getTitle().toLowerCase().contains("type"))) {
                g.setTitle("Thử Thách Gõ Nhanh");
                g.setDescription("Kiểm tra tốc độ gõ phím và độ chính xác với kho từ vựng phong phú trong thời gian 60 giây!");
                g.setImageUrl("https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=60");
                g.setThumbnailUrl("https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&auto=format&fit=crop&q=60");
                updated = true;
            } else if (g.getTitle() != null && (g.getTitle().toLowerCase().contains("memory") || g.getTitle().toLowerCase().contains("match"))) {
                g.setTitle("Lật Thẻ Ghi Nhớ");
                g.setDescription("Lật thẻ và tìm các cặp biểu tượng giống nhau trong lưới 4x4. Rèn luyện khả năng quan sát và trí nhớ đỉnh cao!");
                g.setImageUrl("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60");
                g.setThumbnailUrl("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=60");
                updated = true;
            }

            if (updated) {
                gameRepository.save(g);
                updateGameAchievements(g);
            }
        }
    }

    private void updateGameAchievements(Game game) {
        List<GameAchievement> achievements = gameAchievementRepository.findByGameId(game.getId());
        for (GameAchievement a : achievements) {
            if (a.getTitle() != null && a.getTitle().contains("Otaku")) {
                a.setTitle("Khởi Đầu Thuận Lợi");
                a.setDescription("Đạt từ 100 điểm trở lên trong Đố Vui");
                gameAchievementRepository.save(a);
            } else if (a.getTitle() != null && a.getTitle().contains("Thần Đồng")) {
                a.setTitle("Nhà Thông Thái");
                a.setDescription("Đạt từ 1300 điểm trở lên trong Đố Vui");
                gameAchievementRepository.save(a);
            } else if (a.getTitle() != null && a.getTitle().contains("Thần Bài")) {
                a.setTitle("Kiên Trì Bền Bỉ");
                a.setDescription("Chơi 5 ván Lật Thẻ Ghi Nhớ");
                gameAchievementRepository.save(a);
            }
        }
    }

    private void seedInitialGames() {
        // 1. Đố Vui Kiến Thức (General Knowledge Quiz)
        Game quiz = Game.builder()
                .title("Đố Vui Kiến Thức")
                .category("QUIZ")
                .difficulty("MEDIUM")
                .maxScore(1500)
                .isActive(true)
                .playCount(48L)
                .description("Thử thách kiến thức tổng hợp với đa dạng chủ đề hấp dẫn: Khoa học, Địa lý, Lịch sử, Âm nhạc, Đố vui Logo...")
                .imageUrl("https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&auto=format&fit=crop&q=60")
                .thumbnailUrl("https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=400&auto=format&fit=crop&q=60")
                .build();
        quiz = gameRepository.save(quiz);

        gameAchievementRepository.saveAll(List.of(
                GameAchievement.builder().game(quiz).gameId(quiz.getId()).title("Khởi Đầu Thuận Lợi").description("Đạt từ 100 điểm trở lên trong Đố Vui").icon("🌱").requiredScore(100).requiredPlays(0).build(),
                GameAchievement.builder().game(quiz).gameId(quiz.getId()).title("Bách Khoa Toàn Thư").description("Đạt từ 800 điểm trở lên").icon("📚").requiredScore(800).requiredPlays(0).build(),
                GameAchievement.builder().game(quiz).gameId(quiz.getId()).title("Nhà Thông Thái").description("Đạt từ 1300 điểm trở lên").icon("👑").requiredScore(1300).requiredPlays(0).build(),
                GameAchievement.builder().game(quiz).gameId(quiz.getId()).title("Chăm Chỉ Học Hỏi").description("Tham gia 5 lượt chơi Đố Vui").icon("🔥").requiredScore(0).requiredPlays(5).build()
        ));

        // 2. Lật Thẻ Ghi Nhớ (Memory Match)
        Game memory = Game.builder()
                .title("Lật Thẻ Ghi Nhớ")
                .category("PUZZLE")
                .difficulty("EASY")
                .maxScore(1000)
                .isActive(true)
                .playCount(35L)
                .description("Lật thẻ và tìm các cặp biểu tượng giống nhau trong lưới 4x4. Rèn luyện khả năng quan sát và trí nhớ đỉnh cao!")
                .imageUrl("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60")
                .thumbnailUrl("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=60")
                .build();
        memory = gameRepository.save(memory);

        gameAchievementRepository.saveAll(List.of(
                GameAchievement.builder().game(memory).gameId(memory.getId()).title("Mắt Tinh Nhanh Nhạy").description("Hoàn thành vòng lật thẻ đạt từ 300 điểm").icon("👀").requiredScore(300).requiredPlays(0).build(),
                GameAchievement.builder().game(memory).gameId(memory.getId()).title("Siêu Trí Nhớ").description("Đạt từ 700 điểm trở lên").icon("🧠").requiredScore(700).requiredPlays(0).build(),
                GameAchievement.builder().game(memory).gameId(memory.getId()).title("Kỷ Lục Gia Thẻ Bài").description("Đạt từ 900 điểm trở lên").icon("⚡").requiredScore(900).requiredPlays(0).build(),
                GameAchievement.builder().game(memory).gameId(memory.getId()).title("Kiên Trì Bền Bỉ").description("Chơi 5 ván Lật Thẻ Ghi Nhớ").icon("🃏").requiredScore(0).requiredPlays(5).build()
        ));

        // 3. Thử Thách Gõ Nhanh (Speed Typing)
        Game speed = Game.builder()
                .title("Thử Thách Gõ Nhanh")
                .category("ACTION")
                .difficulty("HARD")
                .maxScore(2000)
                .isActive(true)
                .playCount(62L)
                .description("Kiểm tra tốc độ gõ phím và độ chính xác với các từ vựng tiếng Việt và thuật ngữ phổ biến trong thời gian 60 giây!")
                .imageUrl("https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=60")
                .thumbnailUrl("https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&auto=format&fit=crop&q=60")
                .build();
        speed = gameRepository.save(speed);

        gameAchievementRepository.saveAll(List.of(
                GameAchievement.builder().game(speed).gameId(speed.getId()).title("Gõ Phím Nhanh Nhẹn").description("Đạt từ 500 điểm trở lên trong Gõ Nhanh").icon("⌨️").requiredScore(500).requiredPlays(0).build(),
                GameAchievement.builder().game(speed).gameId(speed.getId()).title("Tốc Biến Bàn Phím").description("Đạt từ 1200 điểm trở lên").icon("🌪️").requiredScore(1200).requiredPlays(0).build(),
                GameAchievement.builder().game(speed).gameId(speed.getId()).title("Bàn Tay Siêu Tốc").description("Đạt từ 1800 điểm trở lên").icon("⚡").requiredScore(1800).requiredPlays(0).build(),
                GameAchievement.builder().game(speed).gameId(speed.getId()).title("Bậc Thầy Bàn Phím").description("Chơi 5 ván Thử Thách Gõ Nhanh").icon("🏆").requiredScore(0).requiredPlays(5).build()
        ));
    }
}
