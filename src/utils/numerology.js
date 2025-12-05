// Bảng quy đổi chữ cái ra số (Hệ thống Pythagorean)
const letterMap = {
    1: ['a', 'j', 's'],
    2: ['b', 'k', 't'],
    3: ['c', 'l', 'u'],
    4: ['d', 'm', 'v'],
    5: ['e', 'n', 'w'],
    6: ['f', 'o', 'x'],
    7: ['g', 'p', 'y'],
    8: ['h', 'q', 'z'],
    9: ['i', 'r']
};

const vowels = ['u', 'e', 'o', 'a', 'i', 'y'];

function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}

// Hàm rút gọn tổng: Giữ nguyên 11, 22, 33
function reduceSum(num) {
    if (num === 11 || num === 22 || num === 33) return num;
    if (num < 10) return num;
    let sum = 0;
    while (num > 0) {
        sum += num % 10;
        num = Math.floor(num / 10);
    }
    return reduceSum(sum);
}

// Hàm rút gọn về 1 chữ số (Dùng cho Base của Kim Tự Tháp & Số Tư Duy mới)
function reduceToSingle(num) {
    while (num > 9) {
        num = String(num).split('').reduce((a, b) => parseInt(a) + parseInt(b), 0);
    }
    return num;
}

function getCharValue(char) {
    char = char.toLowerCase();
    for (const [val, chars] of Object.entries(letterMap)) {
        if (chars.includes(char)) return parseInt(val);
    }
    return 0;
}

// === CÁC HÀM TÍNH TOÁN CHỈ SỐ ===

// 1. Life Path (Đường đời) - GIỮ NGUYÊN
export function calculateLifePath(day, month, year) {
    let sum = 0;
    const dateStr = `${day}${month}${year}`;
    for (let char of dateStr) {
        if (!isNaN(parseInt(char))) {
            sum += parseInt(char);
        }
    }
    return reduceSum(sum);
}

// 2. Destiny (Sứ mệnh) - REVERT: Cộng tổng toàn bộ tên rồi mới rút gọn
export function calculateDestiny(fullName) {
    const cleanName = removeAccents(fullName).trim();
    // Tách tên thành mảng các từ, loại bỏ khoảng trắng thừa
    const nameParts = cleanName.split(/\s+/);
    
    let totalOfParts = 0;

    for (let part of nameParts) {
        let partSum = 0;
        // Tính tổng giá trị các chữ cái trong 1 từ
        for (let char of part) {
            if (/[a-zA-Z]/.test(char)) {
                partSum += getCharValue(char);
            }
        }
        // Rút gọn tổng của từ đó (Giữ 11, 22, 33) trước khi cộng vào tổng chính
        totalOfParts += reduceSum(partSum);
    }

    // Rút gọn tổng cuối cùng
    return reduceSum(totalOfParts);
}

// 3. Soul (Linh hồn) - REVERT: Cộng tổng toàn bộ nguyên âm
export function calculateSoul(fullName) {
    const cleanName = removeAccents(fullName);
    let total = 0;
    for (let char of cleanName) {
        if (vowels.includes(char.toLowerCase())) total += getCharValue(char);
    }
    return reduceSum(total);
}

// 4. Personality (Nhân cách) - REVERT: Cộng tổng toàn bộ phụ âm
export function calculatePersonality(fullName) {
    const cleanName = removeAccents(fullName);
    let total = 0;
    for (let char of cleanName) {
        const lower = char.toLowerCase();
        if (/[a-z]/.test(lower) && !vowels.includes(lower)) {
            total += getCharValue(char);
        }
    }
    return reduceSum(total);
}

// 5. Attitude (Thái độ) - GIỮ NGUYÊN
export function calculateAttitude(day, month) {
    let sum = 0;
    const dateStr = `${day}${month}`;
    for (let char of dateStr) {
        if (!isNaN(parseInt(char))) {
            sum += parseInt(char);
        }
    }
    return reduceSum(sum);
}

// 6. Maturity (Trưởng thành)
export function calculateMaturity(lifePath, destiny) {
    return reduceSum(lifePath + destiny);
}

// 7. Rational Thought (Tư duy) - CẬP NHẬT LOGIC MỚI

// PHIÊN BẢN HÀM MỚI (Cần cập nhật bên file .astro gọi hàm này)
export function calculateRationalThought(day, destiny) {
    // 1. Xử lý ngày sinh: Rút gọn nhưng giữ nguyên 11, 22 (nếu có)
    const dayVal = reduceSum(day);
    
    // 2. Cộng với số Sứ mệnh (đã có master number từ hàm calculateDestiny)
    const sum = dayVal + destiny;

    // 3. Rút gọn kết quả cuối cùng (Giữ 11, 22, 33)
    return reduceSum(sum);
}

export function calculatePeriodCycles(day, month, year, lifePath) {
    // 1. Tính con số đại diện cho từng chu kỳ
    // Chu kỳ 1 = Rút gọn Tháng sinh
    const cycle1 = reduceSum(month);
    
    // Chu kỳ 2 = Rút gọn Ngày sinh
    const cycle2 = reduceSum(day);
    
    // Chu kỳ 3 = Rút gọn Năm sinh
    let yearSum = 0;
    String(year).split('').forEach(char => yearSum += parseInt(char));
    const cycle3 = reduceSum(yearSum);

    // 2. Tính mốc thời gian (Tuổi & Năm)
    // Tuổi kết thúc chu kỳ 1 = 36 - Số chủ đạo (Rút gọn về 1 chữ số)
    let lpBase = lifePath;
    while (lpBase > 9) {
        lpBase = String(lpBase).split('').reduce((a, b) => parseInt(a) + parseInt(b), 0);
    }
    
    const ageEnd1 = 36 - lpBase;
    const ageEnd2 = ageEnd1 + 27; // Chu kỳ 2 kéo dài 27 năm (9 năm x 3)

    return {
        c1: {
            number: cycle1,
            text: "Giai đoạn Trẻ (Gieo hạt)",
            ageRange: `0 - ${ageEnd1} tuổi`,
            yearRange: `${year} - ${year + ageEnd1}`
        },
        c2: {
            number: cycle2,
            text: "Giai đoạn Trưởng thành (Chín)",
            ageRange: `${ageEnd1 + 1} - ${ageEnd2} tuổi`,
            yearRange: `${year + ageEnd1 + 1} - ${year + ageEnd2}`
        },
        c3: {
            number: cycle3,
            text: "Giai đoạn Viên mãn (Thu hoạch)",
            ageRange: `${ageEnd2 + 1} tuổi trở đi`,
            yearRange: `${year + ageEnd2 + 1} trở đi`
        }
    };
}

// Helper: Kiểm tra số có phải là Nợ nghiệp không
function isKarmic(num) {
    return [13, 14, 16, 19].includes(num);
}

// Helper: Tính tổng karmic từ chuỗi (cho ngày sinh, tên)
// Trả về mảng các số nợ nghiệp tìm thấy
function findKarmicNumbersInString(str) {
    let sum = 0;
    for (let char of str) {
        if (/[a-zA-Z0-9]/.test(char)) {
            const val = parseInt(char) || getCharValue(char); // Xử lý cả số và chữ
            sum += val;
        }
    }
    // Kiểm tra tổng (VD: tên "AN" = 1+5=6, không nợ. Nhưng nếu tên dài hơn...)
    // Lưu ý: Logic chuẩn của Karmic Debt thường phức tạp hơn (cộng từng nguyên âm/phụ âm).
    // Ở đây ta sẽ mô phỏng logic tìm kiếm trong các chỉ số chính.
    return []; 
}

// HÀM CHÍNH: TÍNH TOÁN NỢ NGHIỆP TỪ TOÀN BỘ DỮ LIỆU
export function calculateKarmicDebt(day, month, year, fullName) {
    const debtSet = new Set(); // Dùng Set để lưu các số nợ (không trùng lặp)

    // 1. Kiểm tra Ngày sinh (Day of Birth)
    // Ví dụ: sinh ngày 13, 14, 16, 19
    if (isKarmic(day)) debtSet.add(day);

    // 2. Kiểm tra Đường đời (Life Path) - Cần xem quá trình cộng
    // Cách tính: Cộng tổng dồn ngày + tháng + năm
    // Ví dụ: 1983-12-27 -> sum = 33 (không nợ). 
    // Ví dụ khác: 2002-04-12 -> 2+0+0+2 + 0+4 + 1+2 = 11.
    // Logic chuẩn để bắt 13, 14, 16, 19 trong Life Path:
    // Cộng rút gọn từng phần (d, m, y) rồi cộng lại.
    const dSum = reduceSum(day); // 11, 22, 33 giữ nguyên, còn lại 1 chữ số
    const mSum = reduceSum(month);
    const ySum = reduceSum(year);
    const lpRawSum = dSum + mSum + ySum; // Tổng 3 số này có thể là 13, 14, 16, 19
    if (isKarmic(lpRawSum)) debtSet.add(lpRawSum);

    // 3. Kiểm tra các chỉ số Tên (Destiny, Soul, Personality)
    const cleanName = removeAccents(fullName).trim();
    
    // a. Expression / Destiny (Tổng tên)
    let destinyRaw = 0;
    for (let char of cleanName) if (/[a-zA-Z]/.test(char)) destinyRaw += getCharValue(char);
    // Lưu ý: Destiny thường cộng dồn giá trị từng chữ cái. Nếu tổng là 13, 14, 16, 19 -> Nợ.
    // Tuy nhiên, thường thì số sẽ rất lớn (vd: 58). Ta cần rút gọn từ từ.
    // Quy tắc: Nếu số > 0, cộng các chữ số lại. Nếu trong quá trình rút gọn gặp 13,14,16,19 thì lấy.
    let tempDestiny = destinyRaw;
    while (tempDestiny > 9) {
        if (isKarmic(tempDestiny)) {
            debtSet.add(tempDestiny);
            break; 
        }
        tempDestiny = String(tempDestiny).split('').reduce((a,b)=>parseInt(a)+parseInt(b), 0);
    }

    // b. Soul Urge (Nguyên âm)
    let soulRaw = 0;
    for (let char of cleanName) if (vowels.includes(char.toLowerCase())) soulRaw += getCharValue(char);
    let tempSoul = soulRaw;
    while (tempSoul > 9) {
        if (isKarmic(tempSoul)) {
            debtSet.add(tempSoul);
            break;
        }
        tempSoul = String(tempSoul).split('').reduce((a,b)=>parseInt(a)+parseInt(b), 0);
    }

    // c. Personality (Phụ âm)
    let perRaw = 0;
    for (let char of cleanName) {
        const lower = char.toLowerCase();
        if (/[a-z]/.test(lower) && !vowels.includes(lower)) perRaw += getCharValue(char);
    }
    let tempPer = perRaw;
    while (tempPer > 9) {
        if (isKarmic(tempPer)) {
            debtSet.add(tempPer);
            break;
        }
        tempPer = String(tempPer).split('').reduce((a,b)=>parseInt(a)+parseInt(b), 0);
    }

    // 4. Kiểm tra Maturity (Life Path + Destiny)
    // Life Path (đã rút gọn) + Destiny (đã rút gọn)
    // Lưu ý: Life Path và Destiny ở đây là số cuối cùng (1-9, 11, 22, 33).
    // Ta lấy hàm calculateLifePath và calculateDestiny đã có để lấy số cuối.
    // Tuy nhiên hàm calculateDestiny của ta đang trả về kết quả đã reduceSumName.
    // Để chính xác, ta nên tính lại hoặc dùng kết quả đã tính ở ngoài truyền vào (nhưng ở đây ta tính lại cho độc lập).
    
    // Giả sử ta lấy số cuối cùng:
    const lpFinal = calculateLifePath(day, month, year);
    const destFinal = calculateDestiny(fullName);
    const maturityRaw = lpFinal + destFinal;
    if (isKarmic(maturityRaw)) debtSet.add(maturityRaw);

    return Array.from(debtSet).sort((a, b) => a - b);
}

export function calculateKarmicLessons(fullName) {
    const cleanName = removeAccents(fullName);
    const presenceMap = Array(10).fill(false); // Index 1-9 dùng để đánh dấu

    // Bước 1 & 2: Quét toàn bộ tên và đánh dấu các số xuất hiện
    for (let char of cleanName) {
        if (/[a-zA-Z]/.test(char)) {
            const val = getCharValue(char);
            if (val >= 1 && val <= 9) {
                presenceMap[val] = true;
            }
        }
    }

    // Bước 3: Tìm những số KHÔNG xuất hiện (false)
    const missingNumbers = [];
    for (let i = 1; i <= 9; i++) {
        if (!presenceMap[i]) {
            missingNumbers.push(i);
        }
    }

    return missingNumbers; // Trả về mảng các số thiếu (VD: [4, 6])
}

// === LOGIC TÍNH PHẦN TRĂM TÍNH CÁCH & NGHỀ NGHIỆP ===

// Helper: Tính điểm cho một số cụ thể dựa trên hồ sơ
function calculateScoreForNumber(targetNumber, strengthCounts, nameCounts, lifePath, destiny, soul, personality) {
    let score = 0;
    // 1. Điểm từ biểu đồ (Sức mạnh + Tên)
    score += (strengthCounts[targetNumber - 1] || 0) * 2; // Số trong ngày sinh nhân hệ số 2
    score += (nameCounts[targetNumber - 1] || 0) * 1;    // Số trong tên nhân hệ số 1
    
    // 2. Điểm từ các chỉ số lõi (Quan trọng)
    if (reduceToSingle(lifePath) === targetNumber) score += 15;
    if (reduceToSingle(destiny) === targetNumber) score += 10;
    if (reduceToSingle(soul) === targetNumber) score += 8;
    if (reduceToSingle(personality) === targetNumber) score += 5;

    return score;
}

export function calculatePersonalityPercentages(strengthCounts, nameCounts, lifePath, destiny, soul, personality) {
    // Định nghĩa 9 nhóm tính cách theo số 1-9
    const traits = [
        { num: 1, name: "Mạnh mẽ - Độc lập - Tự tin" },
        { num: 2, name: "Lắng nghe - Khéo léo - Nhạy cảm" },
        { num: 3, name: "Sáng tạo - Hoạt bát - Lạc quan" },
        { num: 4, name: "Cẩn thận - Cầu toàn - Thực tế" },
        { num: 5, name: "Năng động - Linh hoạt - Tò mò" },
        { num: 6, name: "Quan tâm - Yêu thương - Trách nhiệm" },
        { num: 7, name: "Thông thái - Khám phá - Tri thức" },
        { num: 8, name: "Công bằng - Tập trung - Kỷ luật" },
        { num: 9, name: "Bao dung - Rộng lượng - Hào phóng" }
    ];

    let totalScore = 0;
    const results = traits.map(trait => {
        // Tính điểm raw
        let score = calculateScoreForNumber(trait.num, strengthCounts, nameCounts, lifePath, destiny, soul, personality);
        
        // Thêm điểm "cơ bản" để không ai bị 0% (mỗi người đều có tiềm năng ẩn)
        score += 2; 
        
        totalScore += score;
        return { ...trait, rawScore: score };
    });

    // Quy đổi ra phần trăm
    return results.map(item => ({
        id: item.num,
        label: `${item.num}. ${item.name}`,
        percent: parseFloat(((item.rawScore / totalScore) * 100).toFixed(2))
    }));
}

export function calculateCareerPercentages(day, month, year, fullName, nickname, lifePath, destiny, soul) {
    // 1. Khởi tạo bộ đếm tần suất cho các số từ 1-9
    const frequencyMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };

    // Hàm hỗ trợ tăng đếm (chỉ nhận 1-9, nếu số master thì tách ra hoặc rút gọn)
    const addCount = (num, weight = 1) => {
        // Luôn rút gọn về 1 chữ số để đếm vào các nhóm 1-9
        let single = num;
        while (single > 9) {
            single = String(single).split('').reduce((a, b) => parseInt(a) + parseInt(b), 0);
        }
        if (frequencyMap[single] !== undefined) {
            frequencyMap[single] += weight;
        }
    };

    // 2. Quét dữ liệu từ NGÀY SINH (Day, Month, Year)
    // Tách từng chữ số ra để đếm (VD: 1996 -> 1, 9, 9, 6)
    const dobStr = `${day}${month}${year}`;
    for (let char of dobStr) {
        if (!isNaN(parseInt(char))) addCount(parseInt(char), 1);
    }

    // 3. Quét dữ liệu từ HỌ TÊN & NICKNAME
    const fullText = (fullName + (nickname || "")).toLowerCase();
    const cleanText = removeAccents(fullText); // Hàm removeAccents đã có trong file của bạn
    for (let char of cleanText) {
        if (/[a-z]/.test(char)) {
            const val = getCharValue(char); // Hàm getCharValue đã có trong file của bạn
            if (val > 0) addCount(val, 1);
        }
    }

    // 4. Quét dữ liệu từ CHỈ SỐ LÕI (Life Path, Destiny, Soul)
    // Quan trọng: Gán trọng số cao (Weight = 10) để định hướng nghề nghiệp bám sát số chủ đạo
    // Nếu không nhân trọng số, các chữ cái trong tên (quá nhiều) sẽ làm loãng số chủ đạo.
    addCount(lifePath, 10);
    addCount(destiny, 10);
    addCount(soul, 10);

    // 5. Định nghĩa nhóm ngành (Mapping số)
    const careerGroups = [
        { id: "management", name: "Nhóm Quản lý (Enterprising)", numbers: [1, 8] },       // Lãnh đạo, Kinh doanh
        { id: "business", name: "Nhóm Nghiệp vụ (Conventional)", numbers: [4, 2, 6] },    // Quy trình, Chi tiết
        { id: "technical", name: "Nhóm Kỹ thuật (Realistic)", numbers: [7, 5, 4] },       // Công cụ, Logic (4 ở đây là kỹ thuật thực hành)
        { id: "research", name: "Nhóm Nghiên cứu (Investigative)", numbers: [7, 9] },     // Học thuật, Khám phá
        { id: "social", name: "Nhóm Xã hội (Social)", numbers: [2, 6, 9, 3] },            // Con người, Cộng đồng
        { id: "artistic", name: "Nhóm Nghệ thuật (Artistic)", numbers: [3, 5] }           // Sáng tạo, Tự do
    ];

    // 6. Tính điểm cho từng nhóm dựa trên Frequency Map
    let totalScore = 0;
    const results = careerGroups.map(group => {
        let score = 0;
        group.numbers.forEach(num => {
            score += (frequencyMap[num] || 0);
        });
        
        // Cộng một chút điểm cơ bản để biểu đồ không bị rỗng
        score += 2; 
        totalScore += score;
        return { ...group, rawScore: score };
    });

    // 7. Quy đổi ra phần trăm
    return results.map(item => ({
        id: item.id,
        label: item.name,
        percent: parseFloat(((item.rawScore / totalScore) * 100).toFixed(2))
    })).sort((a, b) => b.percent - a.percent);
}

export function calculatePersonalYear(day, month, targetYear) {
    // Công thức: Ngày sinh + Tháng sinh + Năm hiện tại (Rút gọn từng thành phần)
    const d = reduceSum(day);
    const m = reduceSum(month);
    
    // Tính tổng các chữ số của năm (VD: 2025 -> 2+0+2+5 = 9)
    let ySum = 0;
    String(targetYear).split('').forEach(char => ySum += parseInt(char));
    const y = reduceSum(ySum);
    
    return reduceSum(d + m + y);
}

export function calculatePersonalMonth(personalYear, targetMonth) {
    // Công thức: Năm cá nhân + Tháng hiện tại
    return reduceSum(personalYear + targetMonth);
}

export function calculateForecast(day, month) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // JS month từ 0-11

    // 1. Tính 3 Năm liên tiếp (Năm nay + 2 năm tới)
    const years = [];
    for (let i = 0; i < 3; i++) {
        const y = currentYear + i;
        const num = calculatePersonalYear(day, month, y);
        years.push({ year: y, number: num });
    }

    // 2. Tính 3 Tháng liên tiếp (Tháng này + 2 tháng tới)
    const months = [];
    let m = currentMonth;
    let y = currentYear;
    
    for (let i = 0; i < 3; i++) {
        // Lưu ý: Năm cá nhân có thể đổi nếu tháng chuyển sang năm mới
        const pYear = calculatePersonalYear(day, month, y); 
        const num = calculatePersonalMonth(pYear, m);
        
        months.push({ month: m, year: y, number: num });
        
        // Tăng tháng
        m++;
        if (m > 12) {
            m = 1;
            y++;
        }
    }

    return { years, months };
}

// === LOGIC KIM TỰ THÁP ===
export function calculatePyramid(day, month, year, lifePath) {
    const mBase = reduceToSingle(month);
    const dBase = reduceToSingle(day);
    const yBase = reduceToSingle(String(year).split('').reduce((a,b)=>parseInt(a)+parseInt(b),0));

    const p1 = reduceSum(mBase + dBase);
    const p2 = reduceSum(dBase + yBase);
    const p3 = reduceSum(p1 + p2);
    const p4 = reduceSum(mBase + yBase);

    const c1 = Math.abs(mBase - dBase);
    const c2 = Math.abs(dBase - yBase);
    const c3 = Math.abs(c1 - c2);
    const c4 = Math.abs(mBase - yBase);

    let lpForAge = lifePath;
    if (lpForAge === 11) lpForAge = 2;
    if (lpForAge === 22) lpForAge = 4;
    if (lpForAge === 33) lpForAge = 6;
    while (lpForAge > 9) {
        lpForAge = reduceToSingle(lpForAge);
    }

    const ageEnd1 = 36 - lpForAge;
    const ageEnd2 = ageEnd1 + 9;
    const ageEnd3 = ageEnd2 + 9;
    const ageEnd4 = ageEnd3 + 9;

    const range1 = `${ageEnd1 - 8}-${ageEnd1} tuổi`;
    const year1 = year + ageEnd1;
    const range2 = `${ageEnd1 + 1}-${ageEnd2} tuổi`;
    const year2 = year + ageEnd2;
    const range3 = `${ageEnd2 + 1}-${ageEnd3} tuổi`;
    const year3 = year + ageEnd3;
    const range4 = `${ageEnd3 + 1}-${ageEnd4} tuổi`;
    const year4 = year + ageEnd4;

    return {
        base: { m: mBase, d: dBase, y: yBase },
        peaks: { p1, p2, p3, p4 },
        challenges: { c1, c2, c3, c4 },
        ages: {
            p1_text: range1, p1_year: year1,
            p2_text: range2, p2_year: year2,
            p3_text: range3, p3_year: year3,
            p4_text: range4, p4_year: year4
        }
    };
}

// === TÍNH TOÁN DỮ LIỆU BIỂU ĐỒ ===
export function calculateChartData(day, month, year, fullName, nickname) {
    const strengthCounts = Array(9).fill(0);
    const nameCounts = Array(9).fill(0);
    const synthesisCounts = Array(9).fill(0);
    const labels = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

    // 1. Biểu đồ Sức mạnh
    const dobString = `${day}${month}${year}`;
    for (let char of dobString) {
        const num = parseInt(char);
        if (num >= 1 && num <= 9) strengthCounts[num - 1]++;
    }

    // 2. Biểu đồ Tên
    let nameSource = "";
    if (nickname && nickname.trim().length > 0) {
        nameSource = nickname.trim();
    } else {
        if (fullName && fullName.trim().length > 0) {
            const parts = fullName.trim().split(/\s+/); 
            nameSource = parts[parts.length - 1]; 
        }
    }
    const cleanName = removeAccents(nameSource);
    for (let char of cleanName) {
        if (/[a-zA-Z]/.test(char)) {
            const num = getCharValue(char);
            if (num >= 1 && num <= 9) nameCounts[num - 1]++;
        }
    }

    // 3. Biểu đồ Tổng hợp
    for (let i = 0; i < 9; i++) {
        synthesisCounts[i] = strengthCounts[i] + nameCounts[i];
    }

    // === LOGIC TRỤC (ARROWS) & SỐ THIẾU (TÁCH BIỆT) ===
    const axesDefinition = [
        // 3 TRỤC CHÍNH (Core Axes)
        { id: "1-4-7", name: "Trục Thể Chất", indices: [1, 4, 7] },
        { id: "2-5-8", name: "Trục Tinh Thần", indices: [2, 5, 8] },
        { id: "3-6-9", name: "Trục Trí Não", indices: [3, 6, 9] },
        
        // 2 ĐƯỜNG PHỤ (Secondary Lines)
        { id: "4-5-6", name: "Đường Thực Tế", indices: [4, 5, 6] },
        { id: "7-8-9", name: "Đường Trưởng Thành", indices: [7, 8, 9] }
    ];

    const checkArrows = (counts) => {
        const result = [];
        axesDefinition.forEach(axis => {
            const [n1, n2, n3] = axis.indices;
            if (counts[n1-1] > 0 && counts[n2-1] > 0 && counts[n3-1] > 0) {
                result.push({ id: axis.id, type: "present", name: axis.name });
            } else if (counts[n1-1] === 0 && counts[n2-1] === 0 && counts[n3-1] === 0) {
                result.push({ id: axis.id, type: "missing", name: `Thiếu ${axis.name}` });
            }
        });
        return result;
    };

    const checkMissingNumbers = (counts) => {
        const missing = [];
        for (let i = 1; i <= 9; i++) {
            if (counts[i - 1] === 0) missing.push(i);
        }
        return missing;
    };

    const strengthArrows = checkArrows(strengthCounts);
    const strengthMissingNums = checkMissingNumbers(strengthCounts); 

    const synthesisArrows = checkArrows(synthesisCounts);
    const synthesisMissingNums = checkMissingNumbers(synthesisCounts);

    return {
        labels,
        strengthData: strengthCounts,
        nameData: nameCounts,
        synthesisData: synthesisCounts,
        usedName: nameSource,
        strengthArrows, 
        strengthMissingNums, 
        synthesisArrows, 
        synthesisMissingNums 
    };
}