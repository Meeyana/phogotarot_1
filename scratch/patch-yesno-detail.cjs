const fs = require('fs');
let p = 'd:/Tuan/phogotarot/src/pages/history/yesno/[id].astro';
let c = fs.readFileSync(p, 'utf8');

const targetAstro = `let conversation: any = null;
let reading: any = null;
let messages: any[] = [];
const allCards = await getCollection('cards');

if (db && id) {
  try {
    // 1. Kiểm tra conversation có tồn tại và thuộc về user không
    const convData = await db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?').bind(id, Astro.locals.user.id).first();
    
    if (convData) {
      conversation = convData;

      // 2. Lấy thông tin trải bài (tarot_readings)
      const readingData = await db.prepare('SELECT * FROM tarot_readings WHERE conversation_id = ?').bind(id).first();
      if (readingData) {
        reading = readingData;
        if (reading.cards_payload) {
            try {
                reading.cards = JSON.parse(reading.cards_payload);
                
                reading.cards = reading.cards.map((card: any) => {
                    const contentCard = allCards.find(c => c.data.title.toLowerCase().includes(card.name.toLowerCase()));
                    if (contentCard && contentCard.data.image) {
                        card.image = contentCard.data.image.src || contentCard.data.image;
                    } else {
                        card.image = \`/cards/\${card.name.toLowerCase().replace(/ /g, '-')}.jpg\`;
                    }
                    return card;
                });
            } catch(e) {
                reading.cards = [];
            }
        }
      }

      // 3. Lấy tin nhắn (message_logs)
      const msgsData = await db.prepare('SELECT * FROM message_logs WHERE conversation_id = ? ORDER BY id ASC').bind(id).all();
      if (msgsData && msgsData.results) {
        messages = msgsData.results;
      }
    }
  } catch (error) {
    console.error("Lỗi lấy chi tiết lịch sử:", error);
  }
}

if (!conversation) {
  return Astro.redirect('/history');
}

const pageTitle = \`\${conversation.title} | Lịch Sử Tarot\`;`;

const newAstro = `let reading: any = null;
const allCards = await getCollection('cards');

if (db && id) {
  try {
    const data = await db.prepare('SELECT * FROM yes_no_readings WHERE id = ? AND user_id = ?').bind(id, Astro.locals.user.id).first();
    
    if (data) {
      reading = data;
      if (reading.cards_payload) {
          try {
              reading.cards = JSON.parse(reading.cards_payload);
              
              reading.cards = reading.cards.map((card: any) => {
                  const contentCard = allCards.find(c => c.data.title.toLowerCase().includes(card.name.toLowerCase()));
                  if (contentCard && contentCard.data.image) {
                      card.image = contentCard.data.image.src || contentCard.data.image;
                  } else {
                      card.image = \`/cards/\${card.name.toLowerCase().replace(/ /g, '-')}.jpg\`;
                  }
                  return card;
              });
          } catch(e) {
              reading.cards = [];
          }
      } else {
          reading.cards = [];
      }
    }
  } catch (error) {
    console.error("Lỗi lấy chi tiết lịch sử Yes/No:", error);
  }
}

if (!reading) {
  return Astro.redirect('/history');
}

const pageTitle = \`\${reading.question} | Lịch Sử Tarot Yes/No\`;`;

c = c.replace(targetAstro, newAstro);

const targetHtmlButtons = `<div class="action-buttons">
                <button id="continue-chat-btn" class="continue-btn" data-id={id} data-messages={JSON.stringify(messages)} data-reading={JSON.stringify(reading)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    Tiếp tục trò chuyện
                </button>
                <button id="delete-conversation-btn" class="delete-btn" data-id={id}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    Xóa
                </button>
            </div>`;

const newHtmlButtons = `<div class="action-buttons">
                <!-- Không có nút tiếp tục trò chuyện cho Yes/No -->
            </div>`;

c = c.replace(targetHtmlButtons, newHtmlButtons);

const targetHeader = `<div class="reading-header">
            <h1 class="title">{conversation.title}</h1>
            <p class="date">{new Date(conversation.created_at.replace(' ', 'T') + 'Z').toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
        </div>`;

const newHeader = `<div class="reading-header">
            <h1 class="title">{reading.question}</h1>
            <p class="date">{new Date(reading.created_at.replace(' ', 'T') + 'Z').toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
        </div>`;
c = c.replace(targetHeader, newHeader);

const targetMessages = `<div class="chat-history">
            <div class="messages-container">
                {messages.map((msg, index) => {
                    let cards = [];
                    let cleanContent = msg.content;
                    const match = cleanContent.match(/<!-- CARDS_PAYLOAD: (.*?) -->/);
                    if (match) {
                        try {
                            cards = JSON.parse(match[1]);
                            cleanContent = cleanContent.replace(match[0], '').trim();
                        } catch(e) {}
                    }
                    
                    // Fallback cho dữ liệu cũ: Nếu là câu trả lời bot đầu tiên và có reading.cards
                    const isFirstBotMessage = msg.role === 'assistant' && messages.findIndex(m => m.role === 'assistant') === index;
                    if (cards.length === 0 && isFirstBotMessage && reading && reading.cards) {
                        cards = reading.cards;
                    }

                    // Gắn URL ảnh cho lá bài
                    if (cards.length > 0) {
                        cards = cards.map((card: any) => {
                            if (!card.image) {
                                // Tìm trong bộ sưu tập thẻ bài
                                const contentCard = allCards ? allCards.find(c => c.data.title.toLowerCase().includes(card.name.toLowerCase())) : null;
                                if (contentCard && contentCard.data.image) {
                                    card.image = contentCard.data.image.src || contentCard.data.image;
                                } else {
                                    card.image = \`/cards/\${card.name.toLowerCase().replace(/ /g, '-')}.jpg\`;
                                }
                            }
                            return card;
                        });
                    }
                    
                    return (
                        <div class={\`message \${msg.role === 'user' ? 'user-message' : 'bot-message'}\`}>
                            {msg.role !== 'user' && (
                                <div class="avatar">
                                    <img src="/images/witcher-bot.jpg" alt="Pho Go Avatar" />
                                </div>
                            )}
                            <div class="message-content">
                                {cards.length > 0 && (
                                    <div class="chat-drawn-cards">
                                        {cards.map((card: any) => (
                                            <div class="chat-card-item">
                                                <img src={card.image} alt={card.name} class={card.orientation === 'reversed' || card.isReversed ? 'reversed' : ''} onerror="this.src='/card-back.jpg'" />
                                                <div class="chat-card-name">{card.name}</div>
                                                <div class="chat-card-orientation">({card.orientation === 'reversed' || card.isReversed ? 'Ngược' : 'Xuôi'})</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div class="markdown-body" set:html={cleanContent}></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>`;

const newMessages = `<div class="chat-history">
            <div class="messages-container">
                <!-- User Question -->
                <div class="message user-message">
                    <div class="message-content">
                        <div class="markdown-body" set:html={reading.question}></div>
                    </div>
                </div>

                <!-- Bot Interpretation -->
                <div class="message bot-message">
                    <div class="avatar">
                        <img src="/images/witcher-bot.jpg" alt="Pho Go Avatar" />
                    </div>
                    <div class="message-content">
                        {reading.cards && reading.cards.length > 0 && (
                            <div class="chat-drawn-cards">
                                {reading.cards.map((card: any) => (
                                    <div class="chat-card-item">
                                        <img src={card.image} alt={card.name} class={card.orientation === 'reversed' || card.isReversed ? 'reversed' : ''} onerror="this.src='/card-back.jpg'" />
                                        <div class="chat-card-name">{card.name}</div>
                                        <div class="chat-card-orientation">({card.orientation === 'reversed' || card.isReversed ? 'Ngược' : 'Xuôi'})</div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div class="markdown-body" set:html={reading.interpretation}></div>
                    </div>
                </div>
            </div>
        </div>`;

c = c.replace(targetMessages, newMessages);

const targetScript = `// Tiếp tục trò chuyện
            const continueBtn = document.getElementById('continue-chat-btn');`;
const newScript = `// Tiếp tục trò chuyện
            const continueBtn = null;`;

c = c.replace(targetScript, newScript);

fs.writeFileSync(p, c);
console.log('Patched yes/no history detail page');
