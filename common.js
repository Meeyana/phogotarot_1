/* ============================================= */
/* === COMMON.JS (Menu & History Logic) === */
/* ============================================= */
const starContainer = document.getElementById('stars-bg');
if (starContainer) {
    for (let i = 0; i < 300; i++) {
        const star = document.createElement('div');
        const size = Math.random() * 2 + 1; // 1-3px
        star.classList.add('star');
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.animationDuration = `${2 + Math.random() * 3}s`;
        starContainer.appendChild(star);
    }
}
// --- State ---
let readingHistory = [];

// --- DOM Elements ---
// (Chúng ta dùng 'document.getElementById' để an toàn, 
// ngay cả khi một số phần tử không tồn tại trên 1 trang)
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');
const historyBtn = document.getElementById('history-nav-link');
const historyBackdrop = document.getElementById('history-modal-backdrop');
const historyModal = document.getElementById('history-modal-content');
const historyCloseBtn = document.getElementById('history-modal-close-btn');
const historyList = document.getElementById('history-list');

// (MỚI) Thêm element cho dropdown tarot
const tarotToggle = document.getElementById('tarot-dropdown-toggle');

// --- History Functions ---

/** Tải lịch sử từ localStorage */
function loadHistory() {
    const storedHistory = localStorage.getItem('tarotHistory');
    readingHistory = storedHistory ? JSON.parse(storedHistory) : [];
}

/** * Lưu một lượt trải bài vào lịch sử (Hàm này được gọi bởi tarot.js)
 * @param {object} reading - Đối tượng lượt trải bài
 */
function saveHistory(reading) {
    // Đảm bảo readingHistory đã được tải
    if (readingHistory.length === 0) {
        loadHistory();
    }
    readingHistory.unshift(reading); // Thêm vào đầu mảng
    if (readingHistory.length > 20) { // Giới hạn 20 lượt
        readingHistory.pop();
    }
    localStorage.setItem('tarotHistory', JSON.stringify(readingHistory));
}

/** Hiển thị danh sách lịch sử trong modal */
function renderHistoryList() {
    if (!historyList) return; // Không làm gì nếu không có modal trên trang

    historyList.innerHTML = '';
    if (readingHistory.length === 0) {
        historyList.innerHTML = '<p style="opacity: 0.7; text-align: center;">Chưa có lịch sử trải bài.</p>';
        return;
    }

    readingHistory.forEach(reading => {
        const itemEl = document.createElement('div');
        itemEl.className = 'history-item';

        let cardsHtml = '';
        // Kiểm tra xem có lá bài không (để phòng lỗi)
        if (reading.cards && Array.isArray(reading.cards)) { 
            reading.cards.forEach(card => {
                cardsHtml += `
                    <div class="history-card-item">
                        <img src="${card.image}" alt="${card.name}" class="${card.isReversed ? 'reversed' : ''}">
                        <div class="card-name">${card.name}</div>
                        ${card.isReversed ? `<div class="card-orientation">${card.orientation}</div>` : ''}
                    </div>
                `;
            });
        }

        const shareButtonHtml = reading.text ? 
            `<button class="history-share-btn" data-reading-id="${reading.readingId}">Chia sẻ</button>` :
            '';

        itemEl.innerHTML = `
            <h3>${reading.question}</h3>
            <div class="history-date">${new Date(reading.timestamp).toLocaleString('vi-VN')}</div>
            <div class="history-cards-container">
                ${cardsHtml}
            </div>
            ${shareButtonHtml} 
        `;
        historyList.appendChild(itemEl);
    });
}

/** Mở modal lịch sử */
function openHistoryModal() {
    renderHistoryList(); // Cập nhật nội dung trước khi mở
    if (historyBackdrop) historyBackdrop.style.display = 'block';
    if (historyModal) historyModal.style.display = 'flex'; 
    // (MỚI) Khóa cuộn khi modal mở
    document.body.classList.add('modal-open');
}

/** Đóng modal lịch sử */
function closeHistoryModal() {
    if (historyBackdrop) historyBackdrop.style.display = 'none';
    if (historyModal) historyModal.style.display = 'none';
    // (MỚI) Mở lại cuộn khi modal đóng
    
    // (MỚI) FIX LỖI DESYNC: Gỡ CẢ nav-open khi đóng modal
    document.body.classList.remove('modal-open');
    document.body.classList.remove('nav-open');
}

/** Xử lý khi click vào các nút trong danh sách lịch sử (vd: nút Chia sẻ) */
function handleHistoryClick(event) {
    const shareButton = event.target.closest('.history-share-btn');
    if (shareButton) {
        shareButton.disabled = true;
        const readingId = shareButton.dataset.readingId;
        const reading = readingHistory.find(r => r.readingId == readingId);
        
        if (reading && reading.text) {
            shareReading(reading, shareButton); 
        } else {
            console.error('Không tìm thấy nội dung để chia sẻ.');
            updateShareButtonState(shareButton, 'Lỗi', 'error');
        }
    }
}

/** Hàm chia sẻ (dùng API Web Share hoặc copy clipboard) */
async function shareReading(reading, buttonEl) {
    const title = `Trải bài Tarot: ${reading.question}`;
    const cardNames = (reading.cards && reading.cards.length > 0) ? reading.cards.map(c => `${c.name} ${c.isReversed ? '(Ngược)' : ''}`).join(', ') : 'N/A';
    const text = `Câu hỏi: ${reading.question}\nBài: ${cardNames}\n\nLuận giải:\n${reading.text}`;
    
    if (navigator.share) {
        try {
            await navigator.share({ title: title, text: text });
            updateShareButtonState(buttonEl, 'Đã chia sẻ!', 'success');
        } catch (error) {
            updateShareButtonState(buttonEl, 'Chia sẻ thất bại', 'error');
        }
    } else {
        try {
            await navigator.clipboard.writeText(text);
            updateShareButtonState(buttonEl, 'Đã sao chép!', 'success');
        } catch (err) {
            updateShareButtonState(buttonEl, 'Lỗi sao chép', 'error');
        }
    }
}

/** Cập nhật trạng thái nút Chia sẻ (vd: "Đã sao chép!") */
function updateShareButtonState(button, message, state) {
    if (!button) return;
    const originalText = 'Chia sẻ';
    button.textContent = message;
    if(state) button.classList.add(state); 
    
    setTimeout(() => {
        button.textContent = originalText;
        if(state) button.classList.remove(state);
        button.disabled = false; 
    }, 2000);
}

// --- Event Listeners (Chạy ngay khi file được tải) ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Tải lịch sử ngay khi trang mở
    loadHistory();

    // 2. Gắn logic cho nút bật/tắt Menu Mobile
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
            navToggle.classList.toggle('open');
            // (MỚI) Khóa/mở cuộn body
            document.body.classList.toggle('nav-open');
        });
    }

    // (MỚI) 3. Gắn logic cho nút dropdown "Bói tarot" (chỉ trên mobile)
    if (tarotToggle) {
        tarotToggle.addEventListener('click', (e) => {
            // Chỉ chạy logic này trên mobile
            if (window.innerWidth <= 768) {
                e.preventDefault(); // Ngăn <a> điều hướng
                // Toggle class 'open' trên thẻ cha (.nav-dropdown)
                tarotToggle.parentElement.classList.toggle('open');
            }
            // Trên desktop (width > 768), sự kiện click mặc định (điều hướng) sẽ diễn ra
        });
    }
    
    // (CHỈNH SỬA) 4. Gắn logic cho các link trong Menu (để đóng menu khi click)
    if (navLinks) {
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                
                // (CHỈNH SỬA) Không làm gì nếu click vào nút Lịch sử HOẶC nút dropdown Tarot
                // (chúng đã có listener riêng)
                if (e.currentTarget.id === 'history-nav-link' || e.currentTarget.id === 'tarot-dropdown-toggle') {
                    // Để các listener riêng của chúng xử lý
                } else if (navLinks.classList.contains('open')) { 
                    // Nếu là link khác (VD: Trang Chủ, Về chúng tôi, HOẶC link trong submenu),
                    // thì đóng menu chính
                    navLinks.classList.remove('open');
                    navToggle.classList.remove('open');
                    // (MỚI) Mở cuộn body
                    document.body.classList.remove('nav-open');
                }
            });
        });
    }

    // 5. Gắn logic cho Modal Lịch sử
    if (historyBtn) {
        historyBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Ngăn link <a> điều hướng
            openHistoryModal(); // Hàm này sẽ thêm class 'modal-open'
            
            // Đóng menu mobile (nếu đang mở)
            if (navLinks.classList.contains('open')) {
                navLinks.classList.remove('open');
                navToggle.classList.remove('open');
                // Giữ nguyên class 'nav-open' để khóa cuộn nền
            }
        });
    }
    if (historyBackdrop) historyBackdrop.addEventListener('click', closeHistoryModal);
    if (historyCloseBtn) historyCloseBtn.addEventListener('click', closeHistoryModal);
    if (historyList) historyList.addEventListener('click', handleHistoryClick);
});