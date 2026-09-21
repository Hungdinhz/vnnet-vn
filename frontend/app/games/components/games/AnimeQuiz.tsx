"use client";

import React, { useState, useEffect, useRef } from 'react';
import { GameItem } from '@/types/game';
import {
  Clock, Zap, CheckCircle2, XCircle, RotateCcw,
  Sparkles, Star, ArrowLeft, Search, Flame, Shuffle, BookOpen
} from 'lucide-react';

interface AnimeQuizProps {
  game: GameItem;
  onGameEnd: (score: number, playTimeSeconds: number) => void;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizTopic {
  id: string;
  title: string;
  category: string;
  rating: number;
  author: string;
  image: string;
  description: string;
  isPopular?: boolean;
  isBestRating?: boolean;
  questions: Question[];
}

const QUIZ_TOPICS: QuizTopic[] = [
  {
    id: 'flags',
    title: 'Đoán Quốc Kỳ Các Nước',
    category: 'Địa lý',
    rating: 4.8,
    author: 'VnNet Quiz',
    image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=600&auto=format&fit=crop&q=60',
    description: 'Nhận biết quốc kỳ đặc trưng của các quốc gia trên khắp thế giới!',
    isPopular: true,
    isBestRating: true,
    questions: [
      { id: 1, question: "Quốc kỳ của quốc gia nào có hình một chiếc lá phong đỏ ở giữa?", options: ["Hoa Kỳ", "Canada", "Úc", "New Zealand"], correctIndex: 1, explanation: "Lá phong đỏ (Maple Leaf) là biểu tượng quốc gia chính thức của Canada." },
      { id: 2, question: "Quốc kỳ Nhật Bản có một hình tròn màu gì trên nền trắng?", options: ["Màu vàng", "Màu đỏ", "Màu đen", "Màu cam"], correctIndex: 1, explanation: "Quốc kỳ Nhật Bản (Hinomaru) có hình tròn đỏ tượng trưng cho Mặt Trời mọc." },
      { id: 3, question: "Quốc kỳ Pháp gồm 3 sọc dọc theo thứ tự từ trái sang phải là những màu nào?", options: ["Đỏ - Trắng - Xanh dương", "Xanh dương - Trắng - Đỏ", "Xanh lá - Trắng - Đỏ", "Vàng - Đỏ - Đen"], correctIndex: 1, explanation: "Quốc kỳ Pháp (Tricolore) có thứ tự: Xanh dương - Trắng - Đỏ." },
      { id: 4, question: "Ngôi sao trên Quốc kỳ Việt Nam có bao nhiêu cánh?", options: ["4 cánh", "5 cánh", "6 cánh", "7 cánh"], correctIndex: 1, explanation: "Cờ đỏ sao vàng của Việt Nam có một ngôi sao vàng năm cánh ở chính giữa." },
      { id: 5, question: "Quốc gia duy nhất trên thế giới có quốc kỳ không phải hình chữ nhật hoặc hình vuông là?", options: ["Thụy Sĩ", "Vatican", "Nepal", "Monaco"], correctIndex: 2, explanation: "Quốc kỳ Nepal gồm hai hình tam giác chồng lên nhau, tượng trưng cho dãy Himalaya." },
      { id: 6, question: "Quốc kỳ của quốc gia nào có hình một chú chim đại bàng đang cắn rắn đậu trên cây xương rồng?", options: ["Mexico", "Brazil", "Argentina", "Chile"], correctIndex: 0, explanation: "Đó là quốc huy trên quốc kỳ Mexico, bắt nguồn từ truyền thuyết của người Aztec." },
      { id: 7, question: "Trên Quốc kỳ Hoa Kỳ hiện tại có bao nhiêu ngôi sao trắng?", options: ["48 ngôi sao", "50 ngôi sao", "52 ngôi sao", "55 ngôi sao"], correctIndex: 1, explanation: "50 ngôi sao đại diện cho 50 tiểu bang của Hợp chúng quốc Hoa Kỳ." },
      { id: 8, question: "Quốc kỳ Brazil có dòng chữ tiếng Bồ Đào Nha mang ý nghĩa gì?", options: ["Tự Do và Bình Đẳng", "Trật Tự và Tiến Bộ", "Hòa Bình và Thịnh Vượng", "Đoàn Kết là Sức Mạnh"], correctIndex: 1, explanation: "Dòng chữ 'Ordem e Progresso' có nghĩa là 'Trật tự và Tiến bộ'." },
      { id: 9, question: "Quốc kỳ Hàn Quốc (Taegeukgi) có biểu tượng gì ở trung tâm?", options: ["Rồng xanh", "Thái cực âm dương", "Ngôi sao bạc", "Hoa hồng Sharon"], correctIndex: 1, explanation: "Vòng tròn âm dương màu xanh đỏ ở trung tâm tượng trưng cho sự hài hòa của vũ trụ." },
      { id: 10, question: "Quốc kỳ Thụy Sĩ có hình chữ thập màu gì trên nền đỏ?", options: ["Màu vàng", "Màu đen", "Màu trắng", "Màu xanh"], correctIndex: 2, explanation: "Quốc kỳ Thụy Sĩ là hình vuông với chữ thập trắng trên nền đỏ nổi bật." }
    ]
  },
  {
    id: 'vietpop',
    title: 'Đoán Ca Khúc & V-Pop Hits',
    category: 'Âm nhạc',
    rating: 4.9,
    author: 'MusicVn',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=60',
    description: 'Thử tài am hiểu các ca khúc V-Pop đình đám làm mưa làm gió làng nhạc Việt!',
    isPopular: true,
    isBestRating: true,
    questions: [
      { id: 1, question: "Ca khúc 'Lạc Trôi' và 'Chúng Ta Của Hiện Tại' do ca sĩ nào sáng tác và thể hiện?", options: ["Sơn Tùng M-TP", "Soobin Hoàng Sơn", "Jack", "Erik"], correctIndex: 0, explanation: "Sơn Tùng M-TP là tác giả kiêm ca sĩ thể hiện hai bản hit quốc dân này." },
      { id: 2, question: "Bài hát 'Đi Về Nhà' là màn kết hợp ăn ý giữa JustaTee và rapper nào?", options: ["Karik", "Đen Vâu", "Suboi", "Binz"], correctIndex: 1, explanation: "Ca khúc Tết xúc động 'Đi Về Nhà' do Đen Vâu và JustaTee thể hiện." },
      { id: 3, question: "'See Tình' - ca khúc viral toàn cầu trên TikTok là sản phẩm âm nhạc của nữ ca sĩ nào?", options: ["Bích Phương", "Hoàng Thùy Linh", "Tóc Tiên", "Min"], correctIndex: 1, explanation: "Hoàng Thùy Linh cùng DTAP đã tạo nên cơn sốt 'See Tình' lan tỏa khắp châu Á." },
      { id: 4, question: "Ca khúc 'Nàng Thơ' với giai điệu lãng mạn nhẹ nhàng được trình bày bởi ai?", options: ["Vũ", "Hoàng Dũng", "Hà Anh Tuấn", "Bùi Anh Tuấn"], correctIndex: 1, explanation: "'Nàng Thơ' là bản hit làm nên tên tuổi của nam ca sĩ nhạc sĩ Hoàng Dũng." },
      { id: 5, question: "Lời hát 'Hà Nội mùa này vắng những cơn mưa...' nằm trong ca khúc bất hủ nào?", options: ["Hà Nội Mùa Thu", "Em Ơi Hà Nội Phố", "Nhớ Về Hà Nội", "Hà Nội Đêm Trở Gió"], correctIndex: 1, explanation: "Đó là ca khúc 'Em Ơi Hà Nội Phố' của nhạc sĩ Phú Quang, thơ Phan Vũ." },
      { id: 6, question: "Ca sĩ nào được khán giả ưu ái gọi với danh xưng 'Hoàng tử Indie Việt'?", options: ["Vũ", "Thịnh Suy", "Đạt G", "Trang"], correctIndex: 0, explanation: "Vũ (Hoàng Thái Vũ) nổi tiếng với các bản hit 'Bước Qua Nhau', 'Lạ Lùng'..." },
      { id: 7, question: "Bản hit 'Ngày Chưa Giông Bão' là nhạc phim của tác phẩm điện ảnh nào?", options: ["Mắt Biếc", "Người Bất Tử", "Tiệc Trăng Máu", "Tôi Thấy Hoa Vàng Trên Cỏ Xanh"], correctIndex: 1, explanation: "Bài hát của nhạc sĩ Phan Mạnh Quỳnh, Bùi Lan Hương hát cho phim 'Người Bất Tử'." },
      { id: 8, question: "Bài hát 'Cắt Đôi Nỗi Sầu' khuấy đảo giới trẻ năm 2023 do ai sáng tác?", options: ["Tăng Duy Tân", "Hòa Minzy", "Quân A.P", "Đức Phúc"], correctIndex: 0, explanation: "Tăng Duy Tân là chủ nhân bản hit triệu view 'Cắt Đôi Nỗi Sầu'." },
      { id: 9, question: "Ca khúc 'Tháng Tư Là Lời Nói Dối Của Em' gắn liền với tên tuổi của nam ca sĩ nào?", options: ["Hà Anh Tuấn", "Noo Phước Thịnh", "Trung Quân Idol", "Lê Hiếu"], correctIndex: 0, explanation: "Hà Anh Tuấn đã thể hiện xuất sắc sáng tác của nhạc sĩ Phạm Toàn Thắng." },
      { id: 10, question: "Bài hát 'Bật Tình Yêu Lên' là màn song ca ngọt ngào giữa Hòa Minzy và ai?", options: ["Tăng Duy Tân", "Đức Phúc", "Erik", "MONO"], correctIndex: 0, explanation: "Hòa Minzy và Tăng Duy Tân đã tạo nên bản hit song ca 'Bật Tình Yêu Lên'." }
    ]
  },
  {
    id: 'emojis',
    title: 'Đoán Chữ Qua Biểu Tượng Emoji',
    category: 'Đố mẹo',
    rating: 4.7,
    author: 'EmojiMaster',
    image: 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?w=600&auto=format&fit=crop&q=60',
    description: 'Thử thách giải mã các biểu tượng Emoji ghép thành từ ngữ, thành ngữ quen thuộc!',
    isPopular: true,
    isBestRating: false,
    questions: [
      { id: 1, question: "Giải mã cụm emoji: ☕ + 🥛 = ?", options: ["Cà phê đen", "Cà phê sữa", "Trà sữa", "Bạc xỉu"], correctIndex: 1, explanation: "Tách cà phê + ly sữa = Cà phê sữa truyền thống thơm ngon!" },
      { id: 2, question: "Cặp emoji: 🌧️ + ☀️ gợi nhớ đến hiện tượng thời tiết nào?", options: ["Mưa đá", "Cầu vồng", "Mưa bóng mây", "Sương mù"], correctIndex: 2, explanation: "Vừa mưa vừa có nắng thường gọi là Mưa bóng mây (hoặc sinh ra Cầu vồng)." },
      { id: 3, question: "Biểu tượng: 👁️ + 💧 diễn tả điều gì?", options: ["Rửa mắt", "Nhỏ mắt", "Nước mắt", "Mắt kính"], correctIndex: 2, explanation: "Con mắt + giọt nước = Nước mắt." },
      { id: 4, question: "Biểu tượng: ✈️ + ☁️ gợi ý phương tiện gì đang bay?", options: ["Khinh khí cầu", "Tên lửa", "Máy bay", "Trực thăng"], correctIndex: 2, explanation: "Máy bay bay trên những tầng mây trời." },
      { id: 5, question: "Giải mã thành ngữ: 🐴 + 🏃 = ?", options: ["Ngựa quen đường cũ", "Chạy như ngựa", "Cưỡi ngựa xem hoa", "Ngựa non háu đá"], correctIndex: 1, explanation: "Hình con ngựa và người đang chạy tượng trưng cho câu ví von 'Chạy như ngựa'." },
      { id: 6, question: "Cặp emoji: 🍎 + 📱 gợi nhớ đến tập đoàn công nghệ nào?", options: ["Google", "Samsung", "Apple", "Microsoft"], correctIndex: 2, explanation: "Quả táo khuyết và chiếc smartphone chính là biểu tượng của Apple!" },
      { id: 7, question: "Biểu tượng: ⚽ + 🥅 biểu thị hành động gì trong bóng đá?", options: ["Phạt đền", "Vào lưới (Ghi bàn)", "Việt vị", "Phạt góc"], correctIndex: 1, explanation: "Bóng đá bay vào cầu môn tức là Ghi bàn vào lưới đối phương!" },
      { id: 8, question: "Cặp emoji: ⏰ + 💣 miêu tả vật thể nào?", options: ["Pháo hoa", "Đồng hồ cát", "Bom hẹn giờ", "Chuông báo thức"], correctIndex: 2, explanation: "Đồng hồ hẹn giờ kết hợp với quả bom = Bom hẹn giờ." },
      { id: 9, question: "Biểu tượng: 🏠 + 🚗 ghép thành cụm từ phong cách sống nào?", options: ["Nhà xe (Gara)", "Biệt thự phố", "Xe cứu thương", "Du lịch bụi"], correctIndex: 0, explanation: "Nhà + Xe = Nhà xe hoặc Gara ô tô." },
      { id: 10, question: "Cặp emoji: 📚 + 🐛 gợi nhớ đến từ ngữ nào dùng chỉ người say mê đọc sách?", options: ["Học sinh giỏi", "Mọt sách", "Giáo sư", "Thư viện"], correctIndex: 1, explanation: "Cuốn sách + Con sâu = Thành ngữ 'Mọt sách' (Bookworm)." }
    ]
  },
  {
    id: 'logos',
    title: 'Đoán Logo & Thương Hiệu',
    category: 'Đời sống',
    rating: 4.8,
    author: 'BrandHunter',
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=60',
    description: 'Bạn có nhận ra các thương hiệu nổi tiếng toàn cầu qua logo và khẩu hiệu?',
    isPopular: true,
    isBestRating: true,
    questions: [
      { id: 1, question: "Thương hiệu nào sử dụng logo hình dấu phẩy 'Swoosh' huyền thoại?", options: ["Adidas", "Puma", "Nike", "Under Armour"], correctIndex: 2, explanation: "Logo Swoosh nổi tiếng toàn cầu được sáng tạo cho hãng thể thao Nike năm 1971." },
      { id: 2, question: "Logo thương hiệu ô tô nào có hình ngôi sao 3 cánh lồng trong vòng tròn?", options: ["BMW", "Audi", "Mercedes-Benz", "Lexus"], correctIndex: 2, explanation: "Ngôi sao 3 cánh là biểu tượng độc quyền của hãng xe sang Mercedes-Benz nước Đức." },
      { id: 3, question: "Thương hiệu thức ăn nhanh nào có logo hình chữ 'M' màu vàng uốn lượn?", options: ["KFC", "Lotteria", "McDonald's", "Jollibee"], correctIndex: 2, explanation: "Vòm vàng chữ M (Golden Arches) là biểu tượng trứ danh của McDonald's." },
      { id: 4, question: "Logo của mạng xã hội nào có hình một chú chim xanh trước khi đổi thành chữ 'X'?", options: ["Facebook", "Twitter", "Telegram", "Instagram"], correctIndex: 1, explanation: "Twitter từng dùng logo chim xanh 'Larry' trước khi tỷ phú Elon Musk đổi sang chữ 'X'." },
      { id: 5, question: "Hãng cà phê nổi tiếng nào có logo màu xanh lá hình Nàng tiên cá hai đuôi (Siren)?", options: ["Highlands Coffee", "The Coffee House", "Starbucks", "Trung Nguyên"], correctIndex: 2, explanation: "Starbucks sử dụng hình ảnh nàng Siren trong thần thoại Hy Lạp từ năm 1971." },
      { id: 6, question: "Hãng ô tô nào của Việt Nam có logo hình chữ 'V' cách điệu vươn lên?", options: ["Thaco", "VinFast", "TC Motor", "Samco"], correctIndex: 1, explanation: "Chữ V tượng trưng cho VinFast, Vingroup và Việt Nam vươn tầm quốc tế." },
      { id: 7, question: "Khẩu hiệu 'Think Different' (Nghĩ Khác Biệt) thuộc về tập đoàn nào?", options: ["Microsoft", "IBM", "Apple", "Google"], correctIndex: 2, explanation: "Chiến dịch quảng cáo kinh điển 'Think Different' của Apple khởi xướng năm 1997." },
      { id: 8, question: "Hãng xe nào có logo gồm 4 vòng tròn đan xen vào nhau?", options: ["Audi", "Toyota", "Subaru", "Volvo"], correctIndex: 0, explanation: "Bốn vòng tròn của Audi đại diện cho sự hợp nhất của 4 nhà sản xuất ô tô ban đầu." },
      { id: 9, question: "Hình chú robot màu xanh lá cây là biểu tượng của hệ điều hành di động nào?", options: ["iOS", "Windows Phone", "Android", "Symbian"], correctIndex: 2, explanation: "Robot xanh 'Bugdroid' là linh vật quen thuộc của hệ điều hành Android (Google)." },
      { id: 10, question: "Thương hiệu nước giải khát nào gắn liền với sắc đỏ và hình ảnh ông già Noel hiện đại?", options: ["Pepsi", "Coca-Cola", "7Up", "Red Bull"], correctIndex: 1, explanation: "Các chiến dịch quảng cáo mùa đông của Coca-Cola từ những năm 1930 đã định hình hình tượng Santa Claus." }
    ]
  },
  {
    id: 'sights',
    title: 'Khám Phá Địa Danh & Du Lịch',
    category: 'Du lịch',
    rating: 4.9,
    author: 'TravelGuide',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=60',
    description: 'Chu du thế giới và chiêm ngưỡng những kỳ quan thiên nhiên, di sản văn hóa vĩ đại!',
    isPopular: false,
    isBestRating: true,
    questions: [
      { id: 1, question: "Vịnh Hạ Long - di sản thiên nhiên thế giới của UNESCO thuộc tỉnh nào ở Việt Nam?", options: ["Hải Phòng", "Quảng Ninh", "Thanh Hóa", "Nghệ An"], correctIndex: 1, explanation: "Vịnh Hạ Long nằm ở bờ tây vịnh Bắc Bộ thuộc địa phận tỉnh Quảng Ninh." },
      { id: 2, question: "Đấu trường La Mã (Colosseum) nổi tiếng nằm ở thành phố nào của nước Ý?", options: ["Venice", "Milan", "Rome", "Florence"], correctIndex: 2, explanation: "Đấu trường La Mã là công trình kiến trúc cổ đại hùng vĩ nằm tại thủ đô Rome." },
      { id: 3, question: "Tháp Eiffel là biểu tượng kiến trúc nổi tiếng tại thành phố nào?", options: ["London", "Paris", "Berlin", "Madrid"], correctIndex: 1, explanation: "Tháp Eiffel hoàn thành năm 1889, tọa lạc bên bờ sông Seine tại Paris, Pháp." },
      { id: 4, question: "Kỳ quan cổ đại Kim Tự Tháp Giza nằm ở quốc gia nào?", options: ["Hy Lạp", "Ấn Độ", "Ai Cập", "Iran"], correctIndex: 2, explanation: "Đại kim tự tháp Giza là kỳ quan cổ đại duy nhất còn tồn tại nguyên vẹn tại Ai Cập." },
      { id: 5, question: "Cầu Vàng với hai bàn tay khổng lồ nâng đỡ nằm ở khu du lịch nào của Việt Nam?", options: ["Bà Nà Hills (Đà Nẵng)", "Fansipan (Sapa)", "Đà Lạt", "Tràng An (Ninh Bình)"], correctIndex: 0, explanation: "Cầu Vàng tuyệt đẹp tọa lạc tại đỉnh Bà Nà Hills, thành phố Đà Nẵng." },
      { id: 6, question: "Bức tường thành dài nhất thế giới có tên là gì?", options: ["Tường thành Berlin", "Vạn Lý Trường Thành", "Tường thành Babylon", "Tường thành La Mã"], correctIndex: 1, explanation: "Vạn Lý Trường Thành ở Trung Quốc có tổng chiều dài lên tới hơn 21.000 km." },
      { id: 7, question: "Đền Taj Mahal - biểu tượng tình yêu vĩnh cửu nằm ở quốc gia nào?", options: ["Thái Lan", "Ấn Độ", "Indonesia", "Myanmar"], correctIndex: 1, explanation: "Hoàng đế Shah Jahan đã cho xây đền lăng mộ Taj Mahal tại Ấn Độ để tưởng nhớ hoàng hậu." },
      { id: 8, question: "Kênh đào đào nhân tạo nào kết nối Biển Đỏ với Địa Trung Hải?", options: ["Kênh đào Panama", "Kênh đào Suez", "Kênh đào Corinth", "Kênh đào Kiel"], correctIndex: 1, explanation: "Kênh đào Suez ở Ai Cập là tuyến hàng hải huyết mạch giữa châu Âu và châu Á." },
      { id: 9, question: "Quần thể di tích Cố đô Huế nằm bên bờ dòng sông thơ mộng nào?", options: ["Sông Hồng", "Sông Hàn", "Sông Hương", "Sông Lam"], correctIndex: 2, explanation: "Sông Hương núi Ngự là hình ảnh biểu trưng gắn liền với Cố đô Huế." },
      { id: 10, question: "Thác nước tự nhiên lớn nhất thế giới nằm giữa biên giới Mỹ và Canada là thác gì?", options: ["Thác Angel", "Thác Victoria", "Thác Niagara", "Thác Iguazu"], correctIndex: 2, explanation: "Thác Niagara là cụm thác nước hùng vĩ nổi tiếng nằm giữa bang New York và tỉnh Ontario." }
    ]
  },
  {
    id: 'science',
    title: 'Vũ Trụ & Khoa Học Tự Nhiên',
    category: 'Khoa học',
    rating: 4.8,
    author: 'ScienceDaily',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=60',
    description: 'Khám phá bí ẩn của các vì sao, hố đen và quy luật vật lý kỳ thú!',
    isPopular: true,
    isBestRating: false,
    questions: [
      { id: 1, question: "Hành tinh nào có kích thước và khối lượng lớn nhất trong Hệ Mặt Trời?", options: ["Sao Thổ", "Sao Hải Vương", "Sao Mộc", "Sao Thiên Vương"], correctIndex: 2, explanation: "Sao Mộc (Jupiter) có khối lượng gấp hơn 2,5 lần tất cả các hành tinh khác cộng lại." },
      { id: 2, question: "Vận tốc của ánh sáng trong môi trường chân không xấp xỉ là bao nhiêu?", options: ["300.000 km/s", "150.000 km/s", "1.000.000 km/s", "30.000 km/s"], correctIndex: 0, explanation: "Ánh sáng truyền đi trong chân không với tốc độ kỷ lục xấp xỉ 299.792 km/s." },
      { id: 3, question: "Khí nào cần thiết cho quá trình hô hấp của con người và hầu hết động vật?", options: ["Carbonic", "Nitơ", "Oxy", "Hydro"], correctIndex: 2, explanation: "Khí Oxy (O2) tham gia phản ứng oxy hóa dưỡng chất tạo năng lượng cho tế bào." },
      { id: 4, question: "Ai là người đầu tiên đặt chân lên Mặt Trăng vào năm 1969?", options: ["Yuri Gagarin", "Neil Armstrong", "Buzz Aldrin", "Michael Collins"], correctIndex: 1, explanation: "Neil Armstrong trong sứ mệnh Apollo 11 đã bước chân lên bề mặt Mặt Trăng ngày 20/7/1969." },
      { id: 5, question: "Nguyên tố hóa học nào có số hiệu nguyên tử là 1 và nhẹ nhất bảng tuần hoàn?", options: ["Heli", "Oxy", "Hydro", "Carbon"], correctIndex: 2, explanation: "Hydro (H) là nguyên tố nhẹ nhất và dồi dào nhất trong toàn vũ trụ." },
      { id: 6, question: "Nước sôi ở bao nhiêu độ C ở áp suất khí quyển tiêu chuẩn?", options: ["80°C", "90°C", "100°C", "120°C"], correctIndex: 2, explanation: "Nước nguyên chất sôi ở 100°C (212°F) ở mực nước biển." },
      { id: 7, question: "Thiên hà chứa Hệ Mặt Trời của chúng ta có tên là gì?", options: ["Andromeda (Tiên Nữ)", "Milky Way (Ngân Hà)", "Sombrero", "Triangulum"], correctIndex: 1, explanation: "Hệ Mặt Trời của chúng ta nằm trong dải Ngân Hà (Milky Way)." },
      { id: 8, question: "Lực nào giữ cho các hành tinh quay xung quanh Mặt Trời?", options: ["Lực từ trường", "Lực hấp dẫn", "Lực ma sát", "Lực ly tâm"], correctIndex: 1, explanation: "Lực hấp dẫn giữa khối lượng khổng lồ của Mặt Trời và các hành tinh tạo nên quỹ đạo." },
      { id: 9, question: "Chất lỏng màu đỏ trong cơ thể người có tế bào nào vận chuyển oxy?", options: ["Bạch cầu", "Hồng cầu", "Tiểu cầu", "Huyết tương"], correctIndex: 1, explanation: "Hồng cầu chứa huyết sắc tố (Hemoglobin) có chức năng gắn và vận chuyển oxy." },
      { id: 10, question: "Hiện tượng Nhật thực xảy ra khi thiên thể nào nằm giữa Trái Đất và Mặt Trời?", options: ["Sao Kim", "Mặt Trăng", "Sao Hỏa", "Sao Thủy"], correctIndex: 1, explanation: "Nhật thực xảy ra khi Mặt Trăng đi qua giữa Trái Đất và Mặt Trời, che khuất một phần hoặc toàn phần Mặt Trời." }
    ]
  },
  {
    id: 'food',
    title: 'Ẩm Thực & Món Ngon 4 Phương',
    category: 'Ẩm thực',
    rating: 4.8,
    author: 'ChefCorner',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=60',
    description: 'Khám phá hương vị đậm đà của các món ăn trứ danh Việt Nam và ẩm thực quốc tế!',
    isPopular: true,
    isBestRating: false,
    questions: [
      { id: 1, question: "Món ăn nào được xem là 'quốc hồn quốc túy' của nền ẩm thực Việt Nam?", options: ["Phở", "Bún đậu", "Hủ tiếu", "Cơm tấm"], correctIndex: 0, explanation: "Phở Việt Nam với nước dùng ninh từ xương thơm nức mùi hồi quế nức tiếng khắp năm châu." },
      { id: 2, question: "Món Sushi và Sashimi có nguồn gốc từ nền ẩm thực của quốc gia nào?", options: ["Hàn Quốc", "Nhật Bản", "Trung Quốc", "Thái Lan"], correctIndex: 1, explanation: "Sushi và cá sống Sashimi là niềm tự hào tinh hoa ẩm thực xứ sở Mặt Trời mọc." },
      { id: 3, question: "Bánh Pizza và mì Spaghetti xuất xứ từ đất nước xinh đẹp nào?", options: ["Pháp", "Hy Lạp", "Ý (Italy)", "Tây Ban Nha"], correctIndex: 2, explanation: "Đất nước hình chiếc ủng Italy là quê hương của Pizza Napoli và mì Ý trứ danh." },
      { id: 4, question: "Kimchi là món dưa muối lên men truyền thống của quốc gia nào?", options: ["Hàn Quốc", "Nhật Bản", "Việt Nam", "Mông Cổ"], correctIndex: 0, explanation: "Kimchi cải thảo cay nồng là món ăn kèm không thể thiếu trong bữa cơm của người Hàn Quốc." },
      { id: 5, question: "Bánh mì Việt Nam từng được tạp chí du lịch quốc tế vinh danh là gì?", options: ["Món bánh ngọt ngon nhất", "Một trong những món sandwich ngon nhất thế giới", "Bánh nướng giòn nhất", "Món điểm tâm đắt đỏ nhất"], correctIndex: 1, explanation: "Bánh mì kẹp Việt Nam liên tục lọt top những món ăn đường phố ngon nhất hành tinh." },
      { id: 6, question: "Cà phê trứng - đặc sản độc đáo nức tiếng được sáng tạo tại thành phố nào?", options: ["Sài Gòn", "Đà Nẵng", "Hà Nội", "Huế"], correctIndex: 2, explanation: "Cà phê Giảng tại Hà Nội từ những năm 1940 đã sáng tạo ra món cà phê trứng béo ngậy." },
      { id: 7, question: "Gia vị nào đắt đỏ nhất thế giới, được thu hoạch từ nhụy hoa huệ tây?", options: ["Vani", "Nhụy hoa nghệ tây (Saffron)", "Quế hồi", "Tiêu đen"], correctIndex: 1, explanation: "Saffron được ví như 'vàng đỏ' vì cần hàng chục nghìn bông hoa để thu được vài gram." },
      { id: 8, question: "Món lẩu Tom Yum chua cay trứ danh là đặc sản của quốc gia nào?", options: ["Lào", "Thái Lan", "Campuchia", "Malaysia"], correctIndex: 1, explanation: "Tom Yum với hương sả, lá chanh kaffir và ớt cay nồng là biểu tượng ẩm thực Thái Lan." },
      { id: 9, question: "Bánh Chưng truyền thống của người Việt Nam gắn liền với sự tích hoàng tử nào?", options: ["Lang Liêu", "Mai An Tiêm", "Thạch Sanh", "Lê Lợi"], correctIndex: 0, explanation: "Hoàng tử Lang Liêu đời Vua Hùng thứ 6 đã sáng tạo ra Bánh Chưng vuông tượng trưng cho đất." },
      { id: 10, question: "Món tráng miệng Tiramisu thơm vị cà phê và phô mai mascarpone đến từ đâu?", options: ["Pháp", "Thụy Sĩ", "Ý", "Bỉ"], correctIndex: 2, explanation: "Tiramisu có nghĩa là 'Hãy mang tôi đi' (Pick me up), một món bánh ngọt nổi tiếng của Ý." }
    ]
  },
  {
    id: 'sports',
    title: 'Bóng Đá & Thể Thao Đỉnh Cao',
    category: 'Thể thao',
    rating: 4.9,
    author: 'SportZone',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=60',
    description: 'Thử sức với các mốc son lịch sử của bóng đá thế giới và các giải đấu danh giá!',
    isPopular: false,
    isBestRating: true,
    questions: [
      { id: 1, question: "Quốc gia nào giữ kỷ lục vô địch World Cup nhiều lần nhất lịch sử (5 lần)?", options: ["Đức", "Ý", "Brazil", "Argentina"], correctIndex: 2, explanation: "Đội tuyển bóng đá xứ sở Samba Brazil đã 5 lần nâng cao cúp vàng World Cup." },
      { id: 2, question: "Cầu thủ bóng đá nào đã giành được 8 Quả Bóng Vàng (Ballon d'Or) danh giá?", options: ["Cristiano Ronaldo", "Lionel Messi", "Pelé", "Diego Maradona"], correctIndex: 1, explanation: "Siêu sao người Argentina Lionel Messi đang nắm giữ kỷ lục vô tiền khoáng hậu 8 Quả Bóng Vàng." },
      { id: 3, question: "Một trận đấu bóng đá tiêu chuẩn gồm bao nhiêu phút thi đấu chính thức?", options: ["80 phút", "90 phút", "100 phút", "120 phút"], correctIndex: 1, explanation: "Trận đấu tiêu chuẩn gồm 2 hiệp, mỗi hiệp 45 phút, tổng cộng 90 phút thi đấu chính thức." },
      { id: 4, question: "Đại hội Thể thao Olympic cổ đại bắt nguồn từ quốc gia nào?", options: ["La Mã", "Hy Lạp", "Ai Cập", "Pháp"], correctIndex: 1, explanation: "Thế vận hội Olympic bắt nguồn từ đền thờ Olympia ở Hy Lạp cổ đại từ năm 776 trước Công nguyên." },
      { id: 5, question: "Đội tuyển bóng đá nam quốc gia Việt Nam đã vô địch AFF Cup vào những năm nào?", options: ["2008 và 2018", "2006 và 2016", "2010 và 2020", "2004 và 2014"], correctIndex: 0, explanation: "Đội tuyển Việt Nam vô địch Đông Nam Á năm 2008 (dưới thời HLV Calisto) và 2018 (HLV Park Hang-seo)." },
      { id: 6, question: "CLB bóng đá nào đang giữ kỷ lục vô địch UEFA Champions League nhiều nhất?", options: ["Barcelona", "Bayern Munich", "Real Madrid", "AC Milan"], correctIndex: 2, explanation: "Real Madrid là ông vua của cúp C1 châu Âu với hơn 15 lần nâng cao chiếc cúp tai voi." },
      { id: 7, question: "Huyền thoại chạy nước rút Usain Bolt mang quốc tịch của quốc gia nào?", options: ["Hoa Kỳ", "Jamaica", "Kenya", "Ethiopia"], correctIndex: 1, explanation: "'Tia chớp' Usain Bolt là vận động viên điền kinh vĩ đại đến từ đảo quốc Jamaica." },
      { id: 8, question: "Môn thể thao nào được mệnh danh là 'Môn thể thao Vua'?", options: ["Bóng rổ", "Quần vợt", "Bóng đá", "Bơi lội"], correctIndex: 2, explanation: "Bóng đá là môn thể thao phổ biến và có số lượng người hâm mộ đông đảo nhất hành tinh." },
      { id: 9, question: "Giải quần vợt danh giá Wimbledon được tổ chức trên mặt sân nào?", options: ["Sân cỏ", "Sân đất nện", "Sân cứng", "Sân thảm"], correctIndex: 0, explanation: "Wimbledon tại Anh là giải Grand Slam duy nhất vẫn duy trì thi đấu trên mặt sân cỏ truyền thống." },
      { id: 10, question: "Vận động viên bơi lội nào giữ kỷ lục giành nhiều huy chương vàng Olympic nhất (23 HCV)?", options: ["Michael Phelps", "Ian Thorpe", "Caeleb Dressel", "Sun Yang"], correctIndex: 0, explanation: "Kình ngư người Mỹ Michael Phelps là VĐV vĩ đại nhất lịch sử Olympic với 23 Huy chương Vàng." }
    ]
  }
];

const CATEGORY_LIST = ['Tất cả', 'Địa lý', 'Âm nhạc', 'Đố mẹo', 'Đời sống', 'Du lịch', 'Khoa học', 'Ẩm thực', 'Thể thao'];

export default function AnimeQuiz({ game, onGameEnd }: AnimeQuizProps) {
  // Topic selection state
  const [selectedTopic, setSelectedTopic] = useState<QuizTopic | null>(null);
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  // Game session state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
  const [isGameOver, setIsGameOver] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const questionStartTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start a topic
  const handleStartTopic = (topic: QuizTopic) => {
    setSelectedTopic(topic);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setStreak(0);
    setTimeLeft(25);
    setIsGameOver(false);
    startTimeRef.current = Date.now();
    questionStartTimeRef.current = Date.now();
  };

  // Random topic
  const handleRandomTopic = () => {
    const randomTopic = QUIZ_TOPICS[Math.floor(Math.random() * QUIZ_TOPICS.length)];
    handleStartTopic(randomTopic);
  };

  // Question timer
  useEffect(() => {
    if (!selectedTopic || isGameOver || isAnswered) return;

    setTimeLeft(25);
    questionStartTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isAnswered, isGameOver, selectedTopic]);

  const handleTimeOut = () => {
    setIsAnswered(true);
    setStreak(0);
  };

  const handleSelectOption = (optionIndex: number) => {
    if (isAnswered || isGameOver || !selectedTopic) return;

    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(optionIndex);
    setIsAnswered(true);

    const currentQ = selectedTopic.questions[currentIndex];
    const isCorrect = optionIndex === currentQ.correctIndex;

    if (isCorrect) {
      const responseTime = (Date.now() - questionStartTimeRef.current) / 1000;
      const speedBonus = Math.max(0, Math.round((25 - responseTime) * 2));
      const streakBonus = streak * 10;
      const pointsEarned = 100 + speedBonus + streakBonus;

      setScore((prev) => Math.min(game.max_score, prev + pointsEarned));
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }
  };

  const handleNextQuestion = () => {
    if (!selectedTopic) return;

    if (currentIndex + 1 < selectedTopic.questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    setIsGameOver(true);
    const totalPlayTime = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
    onGameEnd(score, totalPlayTime);
  };

  // Filter topics
  const filteredTopics = QUIZ_TOPICS.filter((t) => {
    const matchCategory = activeCategory === 'Tất cả' || t.category === activeCategory;
    const matchQuery = !searchQuery.trim() || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchQuery;
  });

  const popularTopics = QUIZ_TOPICS.filter((t) => t.isPopular);
  const bestRatingTopics = QUIZ_TOPICS.filter((t) => t.isBestRating);

  // ================= RENDER TOPIC SELECTION SCREEN =================
  if (!selectedTopic) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
        {/* Top Call to Action Banner (like Image 2) */}
        <div className="glass-card p-5 md:p-6 rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="text-center sm:text-left">
            <h3 className="text-lg md:text-xl font-black text-white flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="w-5 h-5 text-amber-400 animate-spin-slow" />
              Chưa biết chọn gì? Bắt đầu ngay!
            </h3>
            <p className="text-xs text-indigo-200/80 mt-1">
              Thử thách bất kỳ một trong các chủ đề hấp dẫn nhất hôm nay
            </p>
          </div>

          <button
            onClick={handleRandomTopic}
            className="btn-anime py-2.5 px-6 rounded-xl font-bold text-white text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/30 flex-shrink-0 cursor-pointer"
          >
            <Shuffle className="w-4 h-4" />
            Chơi ngẫu nhiên
          </button>
        </div>

        {/* Search & Category Filter Pills */}
        <div className="space-y-3">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Tìm kiếm chủ đề câu hỏi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs py-3 pl-10 pr-4 rounded-2xl bg-surface-hover/70 border border-indigo-500/20 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-foreground"
            />
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
            {CATEGORY_LIST.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'btn-anime text-white shadow-md shadow-indigo-500/20'
                    : 'bg-surface-hover/60 hover:bg-surface-hover text-text-muted hover:text-foreground border border-indigo-500/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Section 1: Best Rating Right Now (Image 2 style) */}
        {!searchQuery && activeCategory === 'Tất cả' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Được Đánh Giá Cao Nhất
              </h3>
              <span className="text-xs text-text-muted">Top yêu thích</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {bestRatingTopics.slice(0, 4).map((topic) => (
                <div
                  key={topic.id}
                  onClick={() => handleStartTopic(topic)}
                  className="glass-card glass-card-hover rounded-2xl overflow-hidden cursor-pointer flex flex-col group border border-indigo-500/20 hover:border-indigo-400/50 transition-all hover:scale-[1.02]"
                >
                  <div className="relative h-28 w-full overflow-hidden bg-surface-hover">
                    <img
                      src={topic.image}
                      alt={topic.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                      ★ {topic.rating}
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <h4 className="font-bold text-xs text-foreground group-hover:text-indigo-400 line-clamp-1 transition-colors">
                      {topic.title}
                    </h4>
                    <div className="flex items-center justify-between text-[10px] text-text-muted mt-2">
                      <span>{topic.questions.length} câu hỏi</span>
                      <span className="text-indigo-400 font-semibold">{topic.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: All / Filtered Topics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              {activeCategory === 'Tất cả' ? 'Tất Cả Chủ Đề Thịnh Hành' : `Chủ Đề: ${activeCategory}`} ({filteredTopics.length})
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {filteredTopics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => handleStartTopic(topic)}
                className="glass-card glass-card-hover rounded-2xl overflow-hidden cursor-pointer flex flex-col group border border-indigo-500/20 hover:border-indigo-400/50 transition-all hover:scale-[1.02]"
              >
                <div className="relative h-28 w-full overflow-hidden bg-surface-hover">
                  <img
                    src={topic.image}
                    alt={topic.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                    ★ {topic.rating}
                  </div>
                  <div className="absolute bottom-2 left-2 bg-indigo-600/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] font-bold text-white">
                    {topic.category}
                  </div>
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-foreground group-hover:text-indigo-400 line-clamp-1 transition-colors">
                      {topic.title}
                    </h4>
                    <p className="text-[10px] text-text-muted line-clamp-1 mt-1">
                      {topic.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-text-muted mt-3 pt-2 border-t border-indigo-500/10">
                    <span>{topic.questions.length} câu hỏi</span>
                    <span className="font-bold text-indigo-400 group-hover:underline">Vào chơi →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ================= RENDER ACTIVE QUIZ GAMEPLAY =================
  const currentQ = selectedTopic.questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / selectedTopic.questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Top Bar with Topic Name & Switch Topic Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedTopic(null)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-surface-hover/80 hover:bg-surface-hover text-text-muted hover:text-foreground border border-indigo-500/10 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Đổi chủ đề
        </button>

        <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
          Chủ đề: {selectedTopic.title}
        </span>
      </div>

      {/* Top Status Bar */}
      <div className="glass-card p-4 rounded-2xl border border-indigo-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            Câu {currentIndex + 1} / {selectedTopic.questions.length}
          </span>
          {streak > 1 && (
            <span className="flex items-center gap-1 text-xs font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30 animate-pulse">
              <Zap className="w-3.5 h-3.5 fill-current" /> Combo x{streak}
            </span>
          )}
        </div>

        {/* Timer */}
        <div className="flex items-center gap-1.5 font-mono text-sm font-bold">
          <Clock className={`w-4 h-4 ${timeLeft <= 5 ? 'text-rose-400 animate-pulse' : 'text-indigo-400'}`} />
          <span className={timeLeft <= 5 ? 'text-rose-400' : 'text-foreground'}>
            {timeLeft}s
          </span>
        </div>

        {/* Score */}
        <div className="text-right">
          <span className="text-xs text-text-muted">Điểm: </span>
          <span className="text-lg font-black text-indigo-400 font-mono">
            {score}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full bg-surface-hover/60 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border border-indigo-500/25 shadow-xl">
        <h2 className="text-lg md:text-xl font-bold text-foreground text-center leading-relaxed mb-6">
          {currentQ.question}
        </h2>

        {/* Answer Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {currentQ.options.map((option, idx) => {
            let btnStyle = 'bg-surface-hover/40 border-indigo-500/20 hover:bg-surface-hover/80 hover:border-indigo-500/40 text-foreground';

            if (isAnswered) {
              if (idx === currentQ.correctIndex) {
                btnStyle = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold shadow-lg shadow-emerald-500/20';
              } else if (idx === selectedOption) {
                btnStyle = 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold shadow-lg shadow-rose-500/20';
              } else {
                btnStyle = 'opacity-40 bg-surface-hover/20 border-transparent';
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`p-4 rounded-2xl border text-left text-sm md:text-base font-semibold transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${btnStyle}`}
              >
                <span>{option}</span>
                {isAnswered && idx === currentQ.correctIndex && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                )}
                {isAnswered && idx === selectedOption && idx !== currentQ.correctIndex && (
                  <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation & Next Button */}
        {isAnswered && (
          <div className="mt-6 pt-5 border-t border-indigo-500/15 space-y-4">
            <p className="text-xs md:text-sm text-indigo-300/90 bg-indigo-500/10 p-3.5 rounded-xl border border-indigo-500/20">
              💡 <span className="font-semibold">Giải thích:</span> {currentQ.explanation}
            </p>

            <button
              onClick={handleNextQuestion}
              className="w-full btn-anime py-3 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              {currentIndex + 1 < selectedTopic.questions.length ? 'Câu tiếp theo →' : 'Xem kết quả tổng kết 🏆'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
