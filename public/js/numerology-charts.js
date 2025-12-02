/**
 * Vẽ biểu đồ sóng vận hạn 9 năm
 * @param {string} canvasId - ID của thẻ canvas
 * @param {number} day - Ngày sinh
 * @param {number} month - Tháng sinh
 */
function drawWaveChart(canvasId, day, month) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    // Helper rút gọn số
    const reduceToSingle = (num) => {
        while (num > 9) {
            num = String(num).split('').reduce((a, b) => parseInt(a) + parseInt(b), 0);
        }
        return num;
    };

    // Chuẩn bị dữ liệu 9 năm (từ 5 năm trước đến 5 năm sau)
    const currentYear = new Date().getFullYear();
    const years = [];
    const heightPoints = []; // Độ cao sóng (để vẽ đẹp)
    const realNumbers = [];  // Số thực tế (để hiển thị label)
    
    // Mapping độ cao sóng cho thẩm mỹ (Số 1, 9 cao nhất; 4, 7 thấp nhất)
    const WAVE_HEIGHTS = { 1: 8, 2: 4, 3: 5, 4: 1, 5: 6, 6: 7, 7: 2, 8: 9, 9: 10 };

    for (let i = 0; i < 9; i++) {
        // Vẽ từ năm hiện tại - 4 đến năm hiện tại + 4
        const y = currentYear - 4 + i;
        
        const rDay = reduceToSingle(day);
        const rMonth = reduceToSingle(month);
        // Năm cá nhân = Ngày + Tháng + Năm thế giới
        let rYear = reduceToSingle(String(y).split('').reduce((a,b)=>parseInt(a)+parseInt(b),0));
        
        let personalYear = rDay + rMonth + rYear;
        personalYear = reduceToSingle(personalYear);

        years.push(y);
        realNumbers.push(personalYear);
        heightPoints.push(WAVE_HEIGHTS[personalYear]);
    }

    // Update text năm hiện tại
    const currentYearEl = document.getElementById('current-year-display');
    if(currentYearEl) {
        // Index 4 là năm hiện tại (vì loop từ current-4)
        currentYearEl.textContent = realNumbers[4]; 
    }

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                data: heightPoints, // Dùng độ cao giả lập để vẽ sóng đẹp
                borderColor: '#F2C94C',
                backgroundColor: (context) => {
                    const bg = context.chart.ctx.createLinearGradient(0, 0, 0, 300);
                    bg.addColorStop(0, 'rgba(242, 201, 76, 0.4)');
                    bg.addColorStop(1, 'rgba(242, 201, 76, 0)');
                    return bg;
                },
                borderWidth: 2,
                tension: 0.4, // Độ cong mềm mại
                fill: true,
                pointBackgroundColor: (context) => context.chart.data.labels[context.dataIndex] === currentYear ? '#fff' : '#0b132b',
                pointBorderColor: '#F2C94C',
                pointRadius: (context) => context.chart.data.labels[context.dataIndex] === currentYear ? 6 : 4,
                // Lưu số thực để hiển thị ở tooltip/datalabel
                realData: realNumbers 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => `Năm ${items[0].label}`,
                        label: (item) => `Năm cá nhân số: ${item.dataset.realData[item.dataIndex]}`
                    }
                },
                datalabels: {
                    align: 'top',
                    color: '#fff',
                    font: { weight: 'bold' },
                    formatter: (value, context) => context.dataset.realData[context.dataIndex]
                }
            },
            scales: {
                y: { display: false, min: 0, max: 12 },
                x: { 
                    grid: { display: false },
                    ticks: { color: '#aaa' }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}