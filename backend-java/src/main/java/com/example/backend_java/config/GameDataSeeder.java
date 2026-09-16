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
        if (gameRepository.count() > 0) {
            return;
        }

        // 1. Anime Quiz Battle
        Game quiz = Game.builder()
                .title("Anime Quiz Battle")
                .category("QUIZ")
                .difficulty("MEDIUM")
                .maxScore(1500)
                .isActive(true)
                .playCount(48L)
                .description("Thử thách kiến thức thế giới anime với 10 câu hỏi đa dạng và hấp dẫn. Trả lời càng nhanh điểm thưởng càng cao!")
                .imageUrl("https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=60")
                .thumbnailUrl("https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=60")
                .build();
        quiz = gameRepository.save(quiz);

        gameAchievementRepository.saveAll(List.of(
                GameAchievement.builder().game(quiz).gameId(quiz.getId()).title("Tân Binh Otaku").description("Đạt từ 100 điểm trở lên trong Quiz").icon("🌱").requiredScore(100).requiredPlays(0).build(),
                GameAchievement.builder().game(quiz).gameId(quiz.getId()).title("Bách Khoa Toàn Thư").description("Đạt từ 800 điểm trở lên").icon("📚").requiredScore(800).requiredPlays(0).build(),
                GameAchievement.builder().game(quiz).gameId(quiz.getId()).title("Thần Đồng Anime").description("Đạt từ 1300 điểm trở lên").icon("👑").requiredScore(1300).requiredPlays(0).build(),
                GameAchievement.builder().game(quiz).gameId(quiz.getId()).title("Người Chơi Chăm Chỉ").description("Tham gia 5 lượt chơi Quiz").icon("🔥").requiredScore(0).requiredPlays(5).build()
        ));

        // 2. Memory Match Anime
        Game memory = Game.builder()
                .title("Memory Match Anime")
                .category("PUZZLE")
                .difficulty("EASY")
                .maxScore(1000)
                .isActive(true)
                .playCount(35L)
                .description("Lật thẻ và tìm các cặp nhân vật anime giống nhau trong lưới 4x4. Hoàn thành nhanh và ít lật sai để đạt điểm tuyệt đối!")
                .imageUrl("https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=60")
                .thumbnailUrl("https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&auto=format&fit=crop&q=60")
                .build();
        memory = gameRepository.save(memory);

        gameAchievementRepository.saveAll(List.of(
                GameAchievement.builder().game(memory).gameId(memory.getId()).title("Đôi Mắt Tinh Anh").description("Hoàn thành vòng lật thẻ đạt từ 300 điểm").icon("👀").requiredScore(300).requiredPlays(0).build(),
                GameAchievement.builder().game(memory).gameId(memory.getId()).title("Siêu Trí Nhớ").description("Đạt từ 700 điểm trở lên").icon("🧠").requiredScore(700).requiredPlays(0).build(),
                GameAchievement.builder().game(memory).gameId(memory.getId()).title("Kỷ Lục Gia Thẻ Bài").description("Đạt từ 900 điểm trở lên").icon("⚡").requiredScore(900).requiredPlays(0).build(),
                GameAchievement.builder().game(memory).gameId(memory.getId()).title("Thần Bài Tái Thế").description("Chơi 5 ván Memory Match").icon("🃏").requiredScore(0).requiredPlays(5).build()
        ));

        // 3. Speed Type Anime
        Game speed = Game.builder()
                .title("Speed Type Anime")
                .category("ACTION")
                .difficulty("HARD")
                .maxScore(2000)
                .isActive(true)
                .playCount(62L)
                .description("Kiểm tra tốc độ gõ phím và phản xạ với tên nhân vật, tuyệt kỹ và thuật ngữ anime kinh điển trong 60 giây!")
                .imageUrl("https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=60")
                .thumbnailUrl("https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=60")
                .build();
        speed = gameRepository.save(speed);

        gameAchievementRepository.saveAll(List.of(
                GameAchievement.builder().game(speed).gameId(speed.getId()).title("Gõ Phím Nhanh Nhẹn").description("Đạt từ 500 điểm trở lên trong Speed Type").icon("⌨️").requiredScore(500).requiredPlays(0).build(),
                GameAchievement.builder().game(speed).gameId(speed.getId()).title("Tốc Biến Bàn Phím").description("Đạt từ 1200 điểm trở lên").icon("🌪️").requiredScore(1200).requiredPlays(0).build(),
                GameAchievement.builder().game(speed).gameId(speed.getId()).title("Thần Tốc Vô Song").description("Đạt từ 1800 điểm trở lên").icon("⚡").requiredScore(1800).requiredPlays(0).build(),
                GameAchievement.builder().game(speed).gameId(speed.getId()).title("Bậc Thầy Gõ Phím").description("Chơi 5 ván Speed Type").icon("🏆").requiredScore(0).requiredPlays(5).build()
        ));
    }
}
