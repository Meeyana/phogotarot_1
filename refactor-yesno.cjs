const fs = require('fs');

const xemTarot = fs.readFileSync('src/pages/xem-tarot.astro', 'utf8');

let newPageContent = xemTarot
  .replace(/Trải Bài Tarot Hằng Ngày \| Phở Gõ Tarot/g, 'Trải Bài Tarot Yes/No - Câu Trả Lời Nhanh | Phở Gõ Tarot')
  .replace(/Công cụ bói bài Tarot online miễn phí.*/g, 'Nhận câu trả lời Yes (Có) hoặc No (Không) nhanh chóng cho các câu hỏi của bạn, cùng với luận giải AI chi tiết từ một lá bài Tarot.')
  .replace(/\/api\/tarot-validate/g, '/api/yesno-validate')
  .replace(/\/api\/tarot-interpret/g, '/api/yesno-interpret');

// Thay the openTarotModal(); bang logic instant
const instantLogic = `
                    // MÌ ĂN LIỀN: Tự động bốc 1 lá và luận giải luôn
                    const randomIdx = Math.floor(Math.random() * cardData.length);
                    const isReversed = Math.random() < 0.3;
                    const drawnCard = {
                        ...cardData[randomIdx],
                        isReversed: isReversed,
                        orientation: isReversed ? 'Ngược' : 'Xuôi'
                    };
                    selectedCards = [drawnCard];
                    
                    addMessage('Vũ trụ đã gửi đến lá bài **' + drawnCard.name + ' (' + drawnCard.orientation + ')**. Đang chờ thông điệp Yes/No...', 'bot', false);
                    handleGetInterpretation();
`;
newPageContent = newPageContent.replace(/openTarotModal\(\);/g, instantLogic);

// Trong hàm showConfirmationBox, thay đổi text
newPageContent = newPageContent.replace(/gồm \*\*.*?\*\*.*?Mỗi lượt trải bài sẽ tốn \*\*1 Credit\*\*/g, 'sẽ tiêu tốn **1 Credit**');
newPageContent = newPageContent.replace(/Đồng ý trải bài 🔮/g, 'Đồng ý bốc bài 🔮');

// Đổi storage key để không đụng với xem-tarot
newPageContent = newPageContent.replace(/phogotarot_history/g, 'phogotarot_yesno_history');
newPageContent = newPageContent.replace(/targetSpreadCount = parseInt\(result\.numbercard\) \|\| 3/g, 'targetSpreadCount = 1');

fs.writeFileSync('src/pages/yes-no-reading.astro', newPageContent);
console.log('Successfully generated yes-no-reading.astro');
