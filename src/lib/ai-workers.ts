// Thư viện AI Workers (Staging Toggle) thay thế n8n

import type { SystemConfig } from './config';

async function callOpenAI(messages: any[], temperature: number, env: any, config: SystemConfig, passedModel: string = "n8n2") {
    let useFallback = false;
    let customErrorMsg = "";

    if (config.AI_API_URL) {
        // Thử gọi Custom API trước
        const apiUrl = config.AI_API_URL;
        const apiKey = config.DEFAULT_API_KEY || "";
        let actualModel = passedModel;
        
        if (passedModel === 'n8n') actualModel = config.MODEL_1 || 'n8n';
        if (passedModel === 'n8n2') actualModel = config.MODEL_2 || 'n8n2';

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: actualModel,
                    messages: messages,
                    temperature: temperature
                })
            });

            if (response.ok) {
                return await response.json();
            } else {
                const errText = await response.text();
                customErrorMsg = `HTTP ${response.status} - ${errText}`;
                console.warn(`[AI API] Custom endpoint failed (${customErrorMsg}). Chuyển sang Fallback OpenAI...`);
                useFallback = true;
            }
        } catch (err: any) {
            customErrorMsg = `Fetch error: ${err.message}`;
            console.warn(`[AI API] Custom endpoint fetch error (${customErrorMsg}). Chuyển sang Fallback OpenAI...`);
            useFallback = true;
        }
    } else {
        customErrorMsg = "AI_API_URL is empty";
        useFallback = true;
    }

    if (useFallback) {
        // Fallback OpenAI
        const fallbackUrl = "https://api.openai.com/v1/chat/completions";
        const fallbackKey = env.OPENAI_API_KEY || "";
        let fallbackModel = passedModel;
        
        if (passedModel === 'n8n') fallbackModel = "gpt-4o";
        if (passedModel === 'n8n2') fallbackModel = "gpt-4o-mini";

        const fbResponse = await fetch(fallbackUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${fallbackKey}`
            },
            body: JSON.stringify({
                model: fallbackModel,
                messages: messages,
                temperature: temperature
            })
        });

        if (!fbResponse.ok) {
            throw new Error(`9router Error: ${customErrorMsg} | Fallback Error: ${fbResponse.status} ${await fbResponse.text()}`);
        }

        return await fbResponse.json();
    }
}

// 1. Logic Validation & Conversational
export async function runTarotValidateWorker(body: any, env: any, config: SystemConfig) {
    console.log("\n=======================================================");
    console.log("🟢 [NODE: Check câu hỏi] (Webhook Tarot Validate)");
    console.log("👇 COPY KHỐI NÀY DÁN VÀO N8N (PIN DATA HOẶC MOCK DATA) 👇");
    const webhookOutput = { body: body }; 
    console.log(JSON.stringify([webhookOutput], null, 2));
    console.log("=======================================================\n");

    const question = (body.question || body.message || "").trim();
    const q = question.toLowerCase();

    // 1.1 Keyword Filter
    console.log("🟢 [NODE: Keyword Filter] Đang xử lý...");
    const selfHarmKeywords = ['tự tử', 'tự sát', 'muốn chết', 'muốn tự tử', 'chán sống', 'không muốn sống', 'mệt sống', 'cắt tay', 'nhảy cầu', 'treo cổ', 'uống thuốc ngủ', 'uống thuốc chết', 'kết thúc cuộc đời', 'toi mun chet', 'minh mun chet', 'tu tu', 'tu sat'];
    const blockedKeywords = ['địt', 'đụ', 'lồn', 'cặc', 'buồi', 'đmm', 'đkm', 'đm ', 'vãi lồn', 'vãi cặc', 'con cặc', 'đồ chó', 'chó chết', 'thằng chó', 'đéo mày', 'đết mày', 'đồ đần', 'thằng ngốc', 'con điếm', 'chửi bữa', 'vãi đái', 'đéo hiểu', 'đéo biết', 'đéo cần', 'dit', 'cac', 'lon', 'buoi', 'dcm', 'dmm', 'dkm', 'vl ', 'tao giết', 'tôi giết', 'mày chết đi', 'tao chém', 'chém chết', 'đánh chết', 'giết người', 'đánh bom', 'tấn công', 'khiêu dâm', 'phim sex', 'làm tình', 'quan hệ tình dục', 'xxx'];

    let isBlocked = false;
    let blockedReason = '';

    for (const kw of selfHarmKeywords) {
        if (q.includes(kw)) {
            isBlocked = true;
            blockedReason = 'Mình nhận ra bạn đang trải qua giai đoạn rất khó khăn 💙 Tarot không thể hỗ trợ vấn đề này, nhưng bạn không cô đơn. Hãy gọi **đường dây hỗ trợ tâm lý miễn phí: 1800 599 920** (24/7) để được lắng nghe nhé. Khi bạn cảm thấy sẵn sàng hơn, mình luôn ở đây đồng hành cùng bạn.';
            break;
        }
    }

    if (!isBlocked) {
        for (const kw of blockedKeywords) {
            if (q.includes(kw)) {
                isBlocked = true;
                blockedReason = 'Nội dung này không phù hợp với không gian Tarot. Bạn có muốn thử đặt câu hỏi khác về Tình cảm, Sự nghiệp, Tiền bạc hoặc Hành trình nội tâm không? Mình luôn sẵn sàng lắng nghe bạn 🌟';
                break;
            }
        }
    }

    const keywordFilterOutput = { ...webhookOutput, isBlocked, blockedReason };
    console.log("👇 OUTPUT NODE: Keyword Filter 👇");
    console.log(JSON.stringify([keywordFilterOutput], null, 2));

    console.log("\n🟢 [NODE: check keyword blocked] Rẽ nhánh...");
    if (isBlocked) {
        console.log("🟢 [NODE: Respond blocked]");
        const respondBlockedOutput = {
            isValid: false,
            pick_card: false,
            reason: blockedReason,
            usage: null,
            model: null
        };
        console.log("👇 OUTPUT TRẢ VỀ FRONTEND 👇");
        console.log(JSON.stringify(respondBlockedOutput, null, 2));
        return respondBlockedOutput;
    }

    // 1.2 Call AI to Check Question
    console.log("🟢 [NODE: build check question prompt]");
    const mySystemPrompt = `## ROLE: Tarot Question Linter & Moderator\n## TASK: Đánh giá [CÂU HẢI] của người dùng có phù hợp để trải bài Tarot hay không và phân loại xem đó là câu hỏi bốc bài hay giao tiếp thông thường.\n\n## QUY TẮC ĐÁNH GIÁ:\n1. isValid = true, pick_card = true:\n- Người dùng đặt câu hỏi RÕ RÀNG, CÓ BỐI CẢNH hoặc CHI TIẾT CỤ THỂ và cần bốc bài Tarot (ví dụ: "Tình cảm sắp tới của tôi và người yêu cũ ra sao?", "Tôi đang phân vân có nên đổi việc sang công ty A không?").\n- BẮT BUỘC quyết định số lượng lá bài (numbercard) phù hợp (chỉ được chọn 1, 3 hoặc 5):\n  + 1 lá: câu hỏi ngắn, check nhanh (yes/no), cần thông tin tức thì, tình trạng cảm xúc hiện tại.\n  + 3 lá: câu hỏi phổ biến (60-70%), cần cái nhìn tổng quan, dự đoán hướng đi, quá khứ-hiện-tại-tương lai.\n  + 5 lá: chuyên sâu, chia tay, phản bội, bước ngoặt sự nghiệp lớn, khủng hoảng tinh thần.\n- reason có thể là "ok".\n\n2. isValid = true, pick_card = false:\n- (a) Người dùng chỉ đang chào hỏi, cảm ơn, hoặc hỏi thêm về trải bài hiện tại (ví dụ: "Chào bạn", "Cảm ơn", "Giải thích thêm lá 2 đi", "Ý nghĩa lá này là gì?").\n- (b) [QUAN TRỌNG] Người dùng đặt câu hỏi QUÁ CHUNG CHUNG, thiếu bối cảnh (ví dụ: "Xem tình duyên", "Hôm nay sao", "Công việc sắp tới?"). Hệ thống sẽ chuyển sang chế độ trò chuyện để hỏi thăm thêm chi tiết trước khi quyết định bốc bài.\n- reason phải là "conversational" (hệ thống sẽ tự gọi LLM riêng để trả lời).\n\n3. isValid = false, pick_card = false:\n- Câu hỏi quá ngắn, vô nghĩa, linh tinh (ví dụ: "hi", "asdasd", "oke").\n- [QUAN TRỌNG] Câu hỏi HOÀN TOÀN NGOÀI PHẠM VI Tarot và đời sống tinh thần: kiến thức bách khoa, lịch sử, địa lý, khoa học, toán học, kỹ thuật, lập trình, thông tin thực tế khách quan (ví dụ: "nước biển có màu gì?", "Hồ Chí Minh là ai?", "thủ đô Nhật Bản là gì?", "Python là gì?", "thời tiết hôm nay", "1+1 bằng mấy?").\n- Nội dung vi phạm, chửi thề, tục tĩu.\n- [QUAN TRỌNG NHẤT] reason BẮT BUỘC phải là một thông báo gồm 2 phần:\n  Phần 1: Giải thích nhẹ nhàng vì sao câu hỏi nằm ngoài phạm vi hỗ trợ của Tarot.\n  Phần 2: NGAY SAU ĐÓ, chủ động mời khách đặt một câu hỏi khác về Tình cảm, Sự nghiệp, hoặc Hành trình nội tâm (VD: "Bạn có muốn thử đặt một câu hỏi khác về tình cảm hay sự nghiệp không?"). KHÔNG ĐƯỢC THIẾU PHẦN NÀY.\n\n4. ĐÁNH GIÁ INTENT CHỦ ĐỀ (topic):\n- Phân loại câu hỏi thuộc chủ đề nào: "love" (tình cảm, người yêu, hôn nhân), "career" (công việc, học tập), "finances" (tiền bạc, đầu tư). Nếu không thuộc 3 chủ đề này, gán "topic": "general".\n\n5. ĐÁNH GIÁ INTENT HÌNH ẢNH (needs_image):\n- Nếu người dùng trong tin nhắn mới nhất HỎI CỤ THỂ về "hình ảnh", "minh họa", "vẽ gì", "nhìn như thế nào", "ẩn dụ thị giác" của lá bài, hãy set "needs_image": true. Ngược lại set "needs_image": false.\n\n## OUTPUT FORMAT (JSON ONLY - KHÔNG bọc block code):\n{"isValid": true, "pick_card": true, "numbercard": 3, "topic": "love", "needs_image": false, "reason": "ok"}`;

    const cards = body.cards || [];
    const history = body.history || [];
    let historyContext = "";
    if (history && history.length > 0) {
        const userQs = history.filter((h: any) => h.role === 'user').map((h: any) => h.content);
        if (userQs.length > 0) {
            historyContext = "\n\n### [LỊCH SỬ CÂU HỎI TRƯỚC ĐÓ CỦA KHÁCH]\n- " + userQs.join("\n- ");
        }
    }

    let cardsContext = "";
    if (cards && cards.length > 0) {
        cardsContext = "\n\n### [BỐI CẢNH TRẢI BÀI HIỆN TẠI]\nKhách hàng đã bốc các lá bài: " + cards.map((c: any) => `${c.name} (${c.orientation || (c.isReversed ? 'Ngược' : 'Xuôi')})`).join(', ');
    }

    const myUserPrompt = `### [CÂU HỎI ĐẦU VÀO CỦA KHÁCH HÀNG]\n"${question}"${cardsContext}${historyContext}\n\nHãy phân tích và trả về đối tượng JSON đúng định dạng.`;

    const bodyPayload = {
        model: "n8n2",
        messages: [
            { role: "system", content: mySystemPrompt },
            { role: "user", content: myUserPrompt }
        ],
        temperature: 0
    };
    
    const buildPromptOutput = { ...keywordFilterOutput, bodyPayload };
    console.log("👇 OUTPUT NODE: build check question prompt 👇");
    console.log(JSON.stringify([buildPromptOutput], null, 2));

    console.log("\n🟢 [NODE: Check câu hỏi AI API]");
    const aiResponse = await callOpenAI(bodyPayload.messages, bodyPayload.temperature, env, config, bodyPayload.model);
    console.log("👇 OUTPUT NODE: Check câu hỏi AI API 👇");
    console.log(JSON.stringify([aiResponse], null, 2));

    console.log("\n🟢 [NODE: Code in JavaScript] (Parse JSON)");
    let rawText = aiResponse.choices[0].message.content || "";
    let isValid = false, pick_card = false, numbercard = 3, needs_image = false, topic = "general", reason = "ok";
    
    try {
        if (rawText.includes('```')) {
            rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        }
        const parsed = JSON.parse(rawText);
        isValid = Boolean(parsed.isValid);
        pick_card = Boolean(parsed.pick_card);
        if (parsed.numbercard !== undefined) numbercard = parseInt(parsed.numbercard) || 3;
        if (parsed.needs_image !== undefined) needs_image = Boolean(parsed.needs_image);
        if (parsed.topic) topic = parsed.topic;
        reason = parsed.reason || "ok";
    } catch (e) {
        const lowerText = rawText.toLowerCase();
        if (lowerText.includes('"isvalid": true') || lowerText.includes('isvalid: true')) isValid = true;
        if (lowerText.includes('"pick_card": true') || lowerText.includes('pick_card: true')) pick_card = true;
    }

    if (isValid && pick_card) {
        reason = "ok";
    } else if (!isValid && (!reason || reason === "ok" || reason === "undefined")) {
        reason = "Câu hỏi không phù hợp. Vui lòng đặt câu hỏi liên quan đến chủ đề Tarot.";
    }

    const codeInJsOutput = {
        output: { isValid, pick_card, numbercard, needs_image, topic, reason, usage: aiResponse.usage || null, model: aiResponse.model || null }
    };
    console.log("👇 OUTPUT NODE: Code in JavaScript 👇");
    console.log(JSON.stringify([codeInJsOutput], null, 2));

    console.log("\n🟢 [NODE: check pick_card] Rẽ nhánh...");
    const usage1 = aiResponse.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    if (isValid && !pick_card) {
        console.log("🟢 [NODE: build conversational prompt]");
        const userProfile = body.userProfile || { name: 'lữ khách', gender: 'bạn', user_persona: '' };
        const userName = userProfile.name;
        const userGender = userProfile.gender;
        const recentEvents = userProfile.user_persona;
        const readerPrompt = body.reader_prompt || '';
        const selfPronoun = body.reader_self_pronoun || 'mình';
        const userPronoun = body.reader_user_pronoun || 'bạn';

        let historyText = 'Chưa có lịch sử. Đây là tin nhắn đầu tiên.';
        if (history.length > 0) {
            let turnCount = 1;
            let historyLines = [];
            for (let i = 0; i < history.length; i++) {
                const msg = history[i];
                if (msg.role === 'user') {
                    historyLines.push(`[Turn ${turnCount}] - Khách hàng: "${msg.content}"`);
                } else {
                    let content = msg.content || '';
                    if (content.length > 500) content = '...' + content.substring(content.length - 500);
                    historyLines.push(`[Turn ${turnCount}] - Tarot Reader: "${content}"`);
                    turnCount++; 
                }
            }
            historyText = historyLines.join('\n');
        }

        let personaSection = '';
        if (recentEvents && recentEvents.trim() !== '') {
            personaSection = `\n\n### [HỒ SƠ VÀ BỐI CẢNH KHÁCH HÀNG]\n${recentEvents}`;
        }

        let cardsSection = '';
        if (cards && cards.length > 0) {
            cardsSection = `\n\n### [LÁ BÀI GẦN NHẤT ĐÃ BỐC]\n` + 
            cards.map((c: any, idx: number) => {
                let info = `- Lá ${idx + 1}: ${c.name} (${c.orientation || (c.isReversed ? 'Ngược' : 'Xuôi')})`;
                if (c.meanings && c.meanings[topic]) info += `: ${c.meanings[topic]}`;
                else if (c.meanings && c.meanings.general) info += `: ${c.meanings.general}`;
                else if (c.meaning) info += `: ${c.meaning}`;
                if (c.keyword && c.keyword[topic]) info += ` (Từ khóa ${topic}: ${c.keyword[topic]})`;
                else if (c.keyword && c.keyword.general) info += ` (Từ khóa chung: ${c.keyword.general})`;
                if (needs_image && c.description) info += ` (Hình ảnh: ${c.description})`;
                return info;
            }).join('\n') + `\n(Lưu ý: Khách có thể hỏi xoay vòng về ý nghĩa, hình ảnh của các lá bài trên ở bất kỳ turn nào)`;
        }

        const defaultSystemPrompt = `## ROLE: Master Tarot Reader thấu cảm và sâu sắc\n## TASK: Khách hàng đang trò chuyện hoặc hỏi thêm. Hãy trả lời sâu sắc, giữ đúng vai Tarot Reader.`;
        const narrativeBase = readerPrompt || defaultSystemPrompt;
        const systemPrompt2 = narrativeBase + `\n\n## USER INFO: Tên: ${userName}, Giới tính: ${userGender}. Quy tắc xưng hô: BẠN BẮT BUỘC PHẢI tự xưng là "${selfPronoun}" và gọi khách hàng là "${userPronoun}" (có thể kết hợp gọi tên ${userName}) một cách nhất quán trong mọi câu trả lời.` + personaSection + cardsSection + `\n\n## QUY TẮC:\n1. Lời khuyên cần thực tế, hướng thiện và tích cực.\n2. Nếu có lịch sử, hãy tham chiếu để hiểu bối cảnh, nhưng TẬP TRUNG vào tin nhắn mới nhất.\n3. KHÔNG nhắc đến AI hay thuật toán.\n4. CHỦ ĐỘNG ĐÀO SÂU: Nếu khách hàng hỏi một câu về Tarot nhưng quá chung chung, ngắn gọn (ví dụ: "xem tình duyên", "công việc thế nào"), TUYỆT ĐỐI KHÔNG tự ý bịa ra trải bài. Hãy chủ động đặt 1-2 câu hỏi gợi mở, tinh tế để họ chia sẻ thêm bối cảnh hiện tại của họ trước khi tiến hành trải bài.\n5. KHÔNG HALLUCINATE HÌNH ẢNH: TUYỆT ĐỐI KHÔNG tự bịa ra chi tiết hình ảnh minh họa của lá bài. CHỈ miêu tả hình ảnh nếu có dữ liệu (Hình ảnh: ...) được cung cấp trong [LÁ BÀI GẦN NHẤT ĐÃ BỐC]. Nếu client không truyền dữ liệu hình ảnh, hãy giải nghĩa dựa trên tính biểu tượng chung và tuyệt đối KHÔNG tự vẽ ra các chi tiết thị giác (người, vật, cảnh) không có trong prompt.`;

        const userPrompt2 = `### 🗣️ TIN NHẮN MỚI NHẤT CỦA KHÁCH HÀNG:\n"${question}"\n\n---\n\n### 📜 LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ (Sắp xếp từ cũ đến mới):\n${historyText}\n\n---\n\n-> Dựa vào bối cảnh trên, hãy trả lời tin nhắn mới nhất của khách hàng.`;

        const conversationalPayload = {
            model: 'n8n2',
            messages: [
                { role: 'system', content: systemPrompt2 },
                { role: 'user', content: userPrompt2 }
            ],
            temperature: 0.8
        };
        const buildConvOutput = { ...keywordFilterOutput, conversationalPayload };
        console.log("👇 OUTPUT NODE: build conversational prompt 👇");
        console.log(JSON.stringify([buildConvOutput], null, 2));

        console.log("\n🟢 [NODE: Conversational AI API]");
        const convResponse = await callOpenAI(conversationalPayload.messages, conversationalPayload.temperature, env, config, conversationalPayload.model);
        console.log("👇 OUTPUT NODE: Conversational AI API 👇");
        console.log(JSON.stringify([convResponse], null, 2));

        const usage2 = convResponse.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

        console.log("\n🟢 [NODE: Respond conversational]");
        const respondConvOutput = {
            isValid: true,
            pick_card: false,
            reason: convResponse.choices[0].message.content || 'Mình luôn sẵn sàng lắng nghe!',
            usage: {
                prompt_tokens: usage1.prompt_tokens + usage2.prompt_tokens,
                completion_tokens: usage1.completion_tokens + usage2.completion_tokens,
                total_tokens: usage1.total_tokens + usage2.total_tokens
            },
            model: convResponse.model
        };
        console.log("👇 OUTPUT TRẢ VỀ FRONTEND 👇");
        console.log(JSON.stringify(respondConvOutput, null, 2));
        return respondConvOutput;
    }

    console.log("🟢 [NODE: check isValid] Rẽ nhánh...");
    if (!isValid) {
        console.log("🟢 [NODE: Respond out-of-scope]");
        const respondOutOfScope = {
            isValid: false,
            pick_card: false,
            reason: reason || "Câu hỏi không phù hợp. Vui lòng đặt câu hỏi khác.",
            usage: usage1,
            model: aiResponse.model
        };
        console.log("👇 OUTPUT TRẢ VỀ FRONTEND 👇");
        console.log(JSON.stringify(respondOutOfScope, null, 2));
        return respondOutOfScope;
    }

    console.log("🟢 [NODE: Respond to Webhook] Hoàn tất!");
    const respondWebhookOutput = {
        isValid: true,
        pick_card: true,
        numbercard: numbercard,
        needs_image: needs_image,
        topic: topic,
        reason: reason,
        usage: usage1,
        model: aiResponse.model
    };
    console.log("👇 OUTPUT TRẢ VỀ FRONTEND 👇");
    console.log(JSON.stringify(respondWebhookOutput, null, 2));
    return respondWebhookOutput;
}


// 2. Logic Interpret
export async function runTarotInterpretWorker(body: any, env: any, config: SystemConfig) {
    console.log("\n=======================================================");
    console.log("🟢 [NODE: Luận giải tarot] (Webhook Tarot Interpret)");
    console.log("👇 COPY KHỐI NÀY DÁN VÀO N8N (PIN DATA HOẶC MOCK DATA) 👇");
    const webhookOutput = { body: body };
    console.log(JSON.stringify([webhookOutput], null, 2));
    console.log("=======================================================\n");

    const question = body.question || "";
    const cards = body.cards || [];
    const topic = body.topic || 'general';
    const userProfile = body.userProfile || { name: 'lữ khách', gender: 'bạn', user_persona: '' };
    
    console.log("🟢 [NODE: build interpretation prompt]");
    const userName = userProfile.name;
    const userGender = userProfile.gender;
    const recentEvents = userProfile.user_persona;
    const readerPrompt = body.reader_prompt || '';

    const selfPronoun = body.reader_self_pronoun || 'mình';
    const userPronoun = body.reader_user_pronoun || 'bạn';

    const history = body.history || [];
    let historyText = 'Chưa có câu hỏi nào trước đó trong phiên này.';
    if (history.length > 0) {
        let historyLines = [];
        let turnCount = 1;
        for (let i = 0; i < history.length; i++) {
            const msg = history[i];
            if (msg.role === 'user') {
                historyLines.push(`[${turnCount}] "${msg.content}"`);
                turnCount++;
            }
        }
        if (historyLines.length > 0) historyText = historyLines.join('\n');
    }

    let personaSection = '';
    if (recentEvents && recentEvents.trim() !== '') {
        personaSection = `\n\n### [HỒ SƠ VÀ BỐI CẢNH KHÁCH HÀNG]\n${recentEvents}`;
    }

    const defaultSystemPrompt = `## ROLE: Master Tarot Reader thấu cảm và sâu sắc\n## TASK: Khách hàng vừa bốc bài Tarot. Hãy LUẬN GIẢI các lá bài một cách liên kết với câu hỏi của khách hàng.`;
    const narrativeBase = readerPrompt || defaultSystemPrompt;
    
    const systemPrompt = narrativeBase + `\n\n## USER INFO: Tên: ${userName}, Giới tính: ${userGender}. Quy tắc xưng hô: BẠN BẮT BUỘC PHẢI tự xưng là "${selfPronoun}" và gọi khách hàng là "${userPronoun}" (có thể kết hợp gọi tên ${userName}) một cách nhất quán trong mọi câu trả lời.` + personaSection + `\n\n## QUY TẮC:\n1. Không giải thích từng lá rời rạc kiểu "Lá A nghĩa là... Lá B nghĩa là...". Thay vào đó, hãy tổng hợp thông điệp thành một câu chuyện liền mạch.\n2. Lời khuyên cần thực tế, hướng thiện và tích cực.\n3. Hãy tham chiếu các câu hỏi trước đó để hiểu mạch bối cảnh, nhưng TẬP TRUNG vào trả lời câu hỏi hiện tại lần bốc bài này.\n4. KHÔNG nhắc đến AI hay thuật toán.`;

    const cardsText = cards.map((c: any) => {
        let activeMeaning = c.meaning || 'Chưa có dữ liệu ý nghĩa';
        if (c.meanings && c.meanings[topic]) activeMeaning = c.meanings[topic];
        else if (c.meanings && c.meanings.general) activeMeaning = c.meanings.general;
        
        let info = `- ${c.name} (${c.orientation || (c.isReversed ? 'Ngược' : 'Xuôi')}): ${activeMeaning}`;
        if (c.keyword && c.keyword[topic]) {
            info += ` (Từ khóa ${topic}: ${c.keyword[topic]})`;
        } else if (c.keyword && c.keyword.general) {
            info += ` (Từ khóa chung: ${c.keyword.general})`;
        }
        return info;
    }).join('\n');

    const userPrompt = `### 🗣️ CÂU HỎI TRỌNG TÂM HIỆN TẠI:\n"${question}"\n\n---\n\n### 🃏 LÁ BÀI VỪA BỐC VÀ Ý NGHĨA GỐC (Dùng làm cơ sở luận giải):\n${cardsText}\n\n---\n\n### 📜 CÁC CÂU HỎI TRƯỚC ĐÓ TRONG PHIÊN NÀY:\n${historyText}\n\n---\n\n-> Dựa vào bối cảnh trên, hãy tiến hành luận giải trải bài này.`;

    const bodyPayload = {
        model: 'n8n2',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        temperature: 0.8
    };

    const buildPromptOutput = { ...webhookOutput, bodyPayload };
    console.log("👇 OUTPUT NODE: build interpretation prompt 👇");
    console.log(JSON.stringify([buildPromptOutput], null, 2));

    console.log("\n🟢 [NODE: Luận giải AI API]");
    const aiResponse = await callOpenAI(bodyPayload.messages, bodyPayload.temperature, env, config, bodyPayload.model);
    console.log("👇 OUTPUT NODE: Luận giải AI API 👇");
    console.log(JSON.stringify([aiResponse], null, 2));

    console.log("\n🟢 [NODE: Respond to Webhook1]");
    const respondOutput = {
        interpretation: aiResponse.choices[0].message.content,
        usage: aiResponse.usage || null,
        model: aiResponse.model || null
    };
    console.log("👇 OUTPUT TRẢ VỀ FRONTEND 👇");
    console.log(JSON.stringify(respondOutput, null, 2));
    
    return respondOutput;
}

// 3. Logic Summarize
export async function runTarotSummarizeWorker(body: any, env: any, config: SystemConfig) {
    console.log("\n=======================================================");
    console.log("🟢 [NODE: Webhook Summarize] (Webhook Tarot Summarize)");
    console.log("👇 COPY KHỐI NÀY DÁN VÀO N8N (PIN DATA HOẶC MOCK DATA) 👇");
    const webhookOutput = { body: body };
    console.log(JSON.stringify([webhookOutput], null, 2));
    console.log("=======================================================\n");

    const history = body.history || [];
    const currentPersona = body.currentPersona || '';
    const userProfile = body.userProfile || { name: 'lữ khách', gender: 'Khác' };

    console.log("🟢 [NODE: build summarize prompt]");
    let historyText = 'Chưa có lịch sử';
    if (history.length > 0) {
        historyText = history.map((h: any) => `- ${h.role === 'assistant' ? 'Tarot Reader' : 'Khách'}: "${h.content}"`).join('\n');
    }

    const systemPrompt = `Bạn là một AI phân tích tâm lý xuất sắc. Nhiệm vụ của bạn là đọc lịch sử cuộc trò chuyện Tarot và viết MỘT ĐOẠN VĂN DUY NHẤT (khoảng 100 - 150 chữ) tóm tắt lại:\n1. Tình trạng cảm xúc hiện tại của khách hàng.\n2. Câu chuyện/biến cố mà họ đang gặp phải.\n\nTHÔNG TIN KHÁCH HÀNG:\n- Tên gọi: ${userProfile.name}\n- Giới tính: ${userProfile.gender}\n\nTUYỆT ĐỐI KHÔNG gạch đầu dòng. Viết dưới dạng một đoạn văn liền mạch để lưu làm "chân dung khách hàng" cho lần trò chuyện sau.\n\nNăng lượng cũ của khách (nếu có):\n${currentPersona}`;

    const bodyPayload = {
        model: "n8n2",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Lịch sử hội thoại mới nhất:\n${historyText}` }
        ],
        temperature: 0.5
    };

    const buildPromptOutput = { ...webhookOutput, bodyPayload };
    console.log("👇 OUTPUT NODE: build summarize prompt 👇");
    console.log(JSON.stringify([buildPromptOutput], null, 2));

    console.log("\n🟢 [NODE: Summarize AI API]");
    const aiResponse = await callOpenAI(bodyPayload.messages, bodyPayload.temperature, env, config, bodyPayload.model);
    console.log("👇 OUTPUT NODE: Summarize AI API 👇");
    console.log(JSON.stringify([aiResponse], null, 2));

    console.log("\n🟢 [NODE: Respond summarize]");
    const respondOutput = {
        summary: aiResponse.choices[0].message.content
    };
    console.log("👇 OUTPUT TRẢ VỀ FRONTEND 👇");
    console.log(JSON.stringify(respondOutput, null, 2));
    
    return respondOutput;
}


// 4. Logic Yes/No Validate
export async function runYesNoValidateWorker(body: any, env: any, config: SystemConfig) {
    console.log("\n=======================================================");
    console.log("🟢 [NODE: Check câu hỏi Yes/No] (Webhook Yes/No Validate)");
    console.log("👇 COPY KHỐI NÀY DÁN VÀO N8N (PIN DATA HOẶC MOCK DATA) 👇");
    const webhookOutput = { body: body };
    console.log(JSON.stringify([webhookOutput], null, 2));
    console.log("=======================================================\n");

    const questionRaw = body.question || "";
    const question = questionRaw.toLowerCase().trim();

    // ======= ⚙️ Hàm bỏ dấu tiếng Việt =======
    function removeDiacritics(str: string) {
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D");
    }

    const questionNormalized = removeDiacritics(question);

    const keywords = [
        "tinh cam","moi quan he","hop nhau","loi khuyen","nen lam gi","nghi gi ve",
        "tim hieu","de y den","an tuong","xuat hien","quay lai","nguoi thu ba",
        "qua khu","tuong lai","sap toi","ngoai tinh","gia dinh","lua doi","mqh",
        "suc khoe","cong viec","du hoc","vuot qua","nguoi yeu cu","crush","yeu minh",
        "thich minh","co ai khac","dinh menh","duyen phan","co hoi","thanh cong",
        "doi viec","thi cu","dinh huong","muc tieu","so phan","vu tru","stress",
        "chua lanh","thang tien","tai chinh","phong van","kinh doanh","may man",
        "vo","chong"
    ];

    const banned = [
        "chet","tu tu","giet","ma","bua","yem","ngai","phap su","hai nguoi","danh de","trung so"
    ];

    const tooShort = questionNormalized.length < 15;
    const hasBanned = banned.some(b => questionNormalized.includes(b));
    const hasKeyword = keywords.some(k => questionNormalized.includes(k));

    console.log("🟢 [NODE: check keyword]");
    let isTarot = false;
    if (!tooShort && !hasBanned && hasKeyword) {
        isTarot = true;
    }
    
    console.log("🟢 [NODE: If] Rẽ nhánh...");
    if (isTarot) {
        console.log("🟢 [NODE: Respond to Webhook2]");
        const respondWebhook2 = {
            isValid: true,
            reason: "ok"
        };
        console.log("👇 OUTPUT TRẢ VỀ FRONTEND 👇");
        console.log(JSON.stringify(respondWebhook2, null, 2));
        return respondWebhook2;
    }

    console.log("🟢 [NODE: build check question prompt]");
    const userProfile = body.userProfile || { name: 'lữ khách', gender: 'bạn', user_persona: '' };
    const userName = userProfile.name;
    const userGender = userProfile.gender;
    const recentEvents = userProfile.user_persona;

    let personaSection = '';
    if (recentEvents && recentEvents.trim() !== '') {
        personaSection = `\n\n### [HỒ SƠ VÀ BỐI CẢNH KHÁCH HÀNG]\n${recentEvents}`;
    }

    const mySystemPrompt = `## ROLE: Tarot Question Linter & Moderator\n## USER INFO: Tên: ${userName}, Giới tính: ${userGender}. Quy tắc xưng hô: BẠN BẮT BUỘC PHẢI tự xưng là "mình" và gọi khách hàng là "bạn" (có thể kết hợp gọi tên ${userName}) một cách tự nhiên.\n\n${personaSection}\n\n## TASK: Đánh giá [CÂU HỎI] của người dùng có phù hợp để trải bài Tarot CÓ/KHÔNG (Yes/No Question) hay không.\n\n## QUY TẮC ĐÁNH GIÁ:\n1. isValid = true:\n- Câu hỏi CÓ DẠNG YES/NO (Có/Không) hoặc mang tính lựa chọn, quyết định.\n- Chủ đề rõ ràng liên quan đến đời sống, công việc, tình cảm, định hướng cá nhân.\n- Khi isValid = true, trường reason BẮT BUỘC phải là "ok".\n\n2. isValid = false:\n- Câu hỏi KHÔNG PHẢI dạng Yes/No (ví dụ: câu hỏi mở như "Tôi phải làm gì", "Tương lai của tôi thế nào").\n- Câu hỏi quá ngắn, trống rỗng, vô nghĩa, spam (ví dụ: "hi", "asdasd").\n- Chủ đề không phù hợp (hỏi bài tập, nấu ăn, code, chính trị, thô tục).\n- Khi isValid = false, reason phải là một câu giải thích lịch sự, ngắn gọn bằng tiếng Việt lý do không phù hợp.\n\n## OUTPUT FORMAT (JSON ONLY - KHÔNG bọc block code):\n{"isValid": true, "reason": "ok"}`;

    const myUserPrompt = `### [CÂU HỎI ĐẦU VÀO CỦA KHÁCH HÀNG]\n"${questionRaw}"\n\nHãy phân tích và trả về đối tượng JSON đúng định dạng.`;

    const bodyPayload = {
        model: "n8n2",
        messages: [
            { role: "system", content: mySystemPrompt },
            { role: "user", content: myUserPrompt }
        ],
        temperature: 0
    };

    const buildPromptOutput = { ...webhookOutput, bodyPayload };
    console.log("👇 OUTPUT NODE: build check question prompt 👇");
    console.log(JSON.stringify([buildPromptOutput], null, 2));

    console.log("\n🟢 [NODE: Check câu hỏi AI API]");
    const aiResponse = await callOpenAI(bodyPayload.messages, bodyPayload.temperature, env, config, bodyPayload.model);
    console.log("👇 OUTPUT NODE: Check câu hỏi AI API 👇");
    console.log(JSON.stringify([aiResponse], null, 2));

    console.log("\n🟢 [NODE: Code in JavaScript] (Parse JSON)");
    let rawText = aiResponse.choices[0].message.content || "";
    if (rawText.includes('```')) {
        rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    }
    
    let isValid = false;
    let reason = "Câu hỏi chưa rõ ràng hoặc không liên quan đến Tarot.";

    try {
        const parsed = JSON.parse(rawText);
        isValid = parsed.isValid;
        reason = parsed.reason || "ok";
    } catch (e) {
        const lowerText = rawText.toLowerCase();
        if (lowerText.includes('"isvalid": true') || lowerText.includes('isvalid: true') || lowerText.includes('true')) {
            isValid = true;
            reason = "ok";
        } else {
            isValid = false;
            const match = rawText.match(/"reason"\s*:\s*"([^"]+)"/i);
            if (match && match[1]) {
                reason = match[1];
            }
        }
    }

    if (typeof isValid === 'string') {
        isValid = ((isValid as string).toLowerCase() === 'true');
    } else {
        isValid = Boolean(isValid);
    }

    if (isValid) {
        reason = "ok";
    } else if (!reason || reason === "ok" || reason === "undefined") {
        reason = "Câu hỏi không phù hợp. Vui lòng đặt câu hỏi liên quan đến chủ đề Tarot.";
    }

    console.log("\n🟢 [NODE: Respond to Webhook] Hoàn tất!");
    const respondOutput = {
        isValid: isValid,
        reason: reason
    };
    console.log("👇 OUTPUT TRẢ VỀ FRONTEND 👇");
    console.log(JSON.stringify(respondOutput, null, 2));
    
    return respondOutput;
}


// 5. Logic Yes/No Interpret
export async function runYesNoInterpretWorker(body: any, env: any, config: SystemConfig) {
    console.log("\n=======================================================");
    console.log("🟢 [NODE: Luận giải tarot Yes/No] (Webhook Yes/No Interpret)");
    console.log("👇 COPY KHỐI NÀY DÁN VÀO N8N (PIN DATA HOẶC MOCK DATA) 👇");
    const webhookOutput = { body: body };
    console.log(JSON.stringify([webhookOutput], null, 2));
    console.log("=======================================================\n");

    const question = body.question || "";
    let cards = body.cards || [];
    
    console.log("🟢 [NODE: Tra cứu Ý Nghĩa Bài] (Local Database)");
    if (cards.length > 0 && env.DB) {
        for (let c of cards) {
            let cardName = c.name || c.card_name;
            try {
                const row = await env.DB.prepare('SELECT upright_meaning, reversed_meaning, yes_no_meaning FROM tarot_database WHERE card_name = ?').bind(cardName).first();
                if (row) {
                    const isReversed = c.orientation === 'Ngược' || c.isReversed === true;
                    c.card_name = cardName;
                    c.upright_meaning = row.upright_meaning;
                    c.reversed_meaning = row.reversed_meaning;
                    c.meaning = isReversed ? row.reversed_meaning : row.upright_meaning;
                    c.yes_no_meaning = row.yes_no_meaning;
                }
            } catch (e) {
                console.error("Lỗi lấy thông tin lá bài Yes/No:", e);
            }
        }
    }

    console.log("🟢 [NODE: build interpretation prompt]");
    let isFollowUp = false;
    let historyText = "Chưa có cuộc trò chuyện nào trước đó.";
    
    const userProfile = body.userProfile || { name: 'lữ khách', gender: 'bạn', user_persona: '' };
    const userName = userProfile.name;
    const userGender = userProfile.gender;
    const recentEvents = userProfile.user_persona;
    
    let personaSection = '';
    if (recentEvents && recentEvents.trim() !== '') {
        personaSection = '\n\n### [HỒ SƠ VÀ BỐI CẢNH KHÁCH HÀNG]\n' + recentEvents;
    }
    
    const userInfoPrompt = '\n\n## USER INFO: Tên: ' + userName + ', Giới tính: ' + userGender + '. Quy tắc xưng hô: BẠN BẮT BUỘC PHẢI tự xưng là "mình" và gọi khách hàng là "bạn" (có thể kết hợp gọi tên ' + userName + ') một cách tự nhiên.' + personaSection;

    let mySystemPrompt = "";
    if (!isFollowUp) {
        mySystemPrompt = `## ROLE: Master Tarot Reader\n## TASK: Hóa thân thành một Tarot Reader sâu sắc, ấm áp, thấu cảm và chuyên nghiệp sử dụng bộ bài Rider–Waite. Hãy giải đáp câu hỏi dạng CÓ/KHÔNG (Yes/No Question) của lữ khách dựa trên các lá bài đã bốc và ý nghĩa tương ứng được cung cấp.\n\n## HƯỚNG DẪN LUẬN GIẢI:\n1. Xác định năng lượng tổng quan thiên về "Có" (Yes), "Không" (No), hoặc "Có thể" (Maybe) dựa vào ý nghĩa của các lá bài.\n2. Với mỗi lá bài, hãy lồng ghép cả "mặt sáng" và "bài học cần học" để mang lại góc nhìn đa chiều, tuyệt đối không mang xu hướng mê tín dị đoan.\n3. Giọng văn con người trầm ổn, đồng cảm, chân thành, tựa như một người bạn tâm giao đang trò chuyện thật sự.\n4. TUYỆT ĐỐI KHÔNG nhắc đến các từ liên quan đến AI, hệ thống, thuật toán, máy tính, hoặc "Xuôi". (Luôn dùng các cách gọi khác như: Hướng thuận, mặt thuận lợi, v.v.).\n5. Trình bày đẹp mắt bằng Markdown. Giới hạn độ dài trong khoảng 800 tokens.\n\n## CẤU TRÚC BẮT BUỘC (GIỮ NGUYÊN FORMAT MARKDOWN):\n---\nLời chào mở đầu (1–2 câu)\n### 1. Tổng quan năng lượng của câu hỏi (Kết luận Yes/No/Maybe và lý do) (3-4 câu)\n### 2. Phân tích các lá bài đã bốc (3-4 câu cho mỗi lá)\n### 3. Lời khuyên từ trái tim (2-3 câu)\n→ Kết thúc bằng 1–2 câu hỏi tự vấn` + userInfoPrompt;
    } else {
        mySystemPrompt = `## ROLE: Master Tarot Reader\n## TASK: Hóa thân thành một Tarot Reader sâu sắc, ấm áp, thấu cảm. Lữ khách đang có thắc mắc tiếp nối về trải bài Tarot Yes/No trước đó. Hãy trực tiếp giải đáp thắc mắc mới này.\n\n## HƯỚNG DẪN LUẬN GIẢI:\n1. TRỰC TIẾP đi vào vấn đề giải đáp câu hỏi mới, KHÔNG CẦN lặp lại lời chào mở đầu sến súa.\n2. Trình bày nội dung một cách tự nhiên, linh hoạt, giống như một cuộc trò chuyện sâu sắc. KHÔNG tuân theo outline rập khuôn như lần đầu.\n3. Hãy ngắt đoạn linh hoạt cho đỡ nhàm chán, có thể dùng bullet points tự do nếu phù hợp.\n4. Liên kết câu trả lời với ý nghĩa các lá bài đã bốc ban đầu và các vấn đề lữ khách đã hỏi trước đó để tạo sự liền mạch. Tuân thủ tuyệt đối ý nghĩa gốc của các lá bài.\n5. Giọng văn trầm ổn, đồng cảm, chân thành và mang tính chữa lành. TUYỆT ĐỐI KHÔNG nhắc đến các từ liên quan đến AI, thuật toán.` + userInfoPrompt;
    }

    let cardsSection = "";
    if (cards.length > 0) {
        cardsSection = `### [CHI TIẾT TRẢI BÀI & Ý NGHĨA GỐC TỪ D1]\n`;
        cards.forEach((c: any, index: number) => {
            cardsSection += `- **Lá bài ${index + 1}**: ${c.name || c.card_name || "—"} (${c.orientation || "Xuôi"})\n  * Ý nghĩa cốt lõi: ${c.meaning || "—"}\n  * Dấu hiệu Yes/No: ${c.yes_no_meaning || "Không xác định"}\n\n`;
        });
    }

    const myUserPrompt = `### [CÂU HỎI MỚI CỦA LỮ KHÁCH]\n"${question}"\n\n${cardsSection}\n\n### [BỐI CẢNH LỊCH SỬ CÂU HỎI TRƯỚC ĐÓ]\n${historyText}\n\nHãy thấu cảm và giải đáp câu hỏi mới của lữ khách.`;

    const bodyPayload = {
        model: "n8n2",
        messages: [
            { role: "system", content: mySystemPrompt },
            { role: "user", content: myUserPrompt }
        ],
        temperature: 0.7
    };

    const buildPromptOutput = { cards: cards, bodyPayload: bodyPayload };
    console.log("👇 OUTPUT NODE: build interpretation prompt 👇");
    console.log(JSON.stringify([buildPromptOutput], null, 2));

    console.log("\n🟢 [NODE: Luận giải AI API]");
    const aiResponse = await callOpenAI(bodyPayload.messages, bodyPayload.temperature, env, config, bodyPayload.model);
    console.log("👇 OUTPUT NODE: Luận giải AI API 👇");
    console.log(JSON.stringify([aiResponse], null, 2));

    console.log("\n🟢 [NODE: Respond to Webhook1]");
    const respondOutput = {
        interpretation: aiResponse.choices[0].message.content,
        usage: aiResponse.usage,
        model: aiResponse.model
    };
    console.log("👇 OUTPUT TRẢ VỀ FRONTEND 👇");
    console.log(JSON.stringify(respondOutput, null, 2));
    
    return respondOutput;
}
