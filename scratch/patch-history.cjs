const fs = require('fs');
let p = 'd:/Tuan/phogotarot/src/pages/history.astro';
let c = fs.readFileSync(p, 'utf8');

const targetHtml = `<div class="history-content">
            {historyList.length === 0 ? (`;

const newHtml = `<div class="tabs-container">
            <button class="tab-btn active" data-target="tab-tarot">Bói bài Tarot</button>
            <button class="tab-btn" data-target="tab-yesno">Tarot Yes/No</button>
        </div>

        <div class="history-content">
            <div id="tab-tarot" class="tab-content active">
            {historyList.length === 0 ? (`;

c = c.replace(targetHtml, newHtml);

const targetHtmlEnd = `)}
                </div>
            )}
        </div>
    </main>`;

const newHtmlEnd = `)}
                </div>
            )}
            </div>

            <div id="tab-yesno" class="tab-content">
            {yesnoList.length === 0 ? (
                <div class="empty-state">
                    <div class="empty-icon">🌙</div>
                    <h3>Chưa có ghi chép nào</h3>
                    <p>Bạn chưa thực hiện trải bài Yes/No nào. Hãy thử hỏi vũ trụ một câu hỏi dứt khoát.</p>
                    <a href="/yes-no-reading" class="btn-primary">Trải bài Yes/No ngay</a>
                </div>
            ) : (
                <div class="history-list">
                    {yesnoList.map(item => {
                        const dateStr = item.created_at.replace(' ', 'T') + 'Z'; 
                        const dateObj = new Date(dateStr);
                        const formattedDate = dateObj.toLocaleDateString('vi-VN', {
                            timeZone: 'Asia/Ho_Chi_Minh',
                            year: 'numeric', month: '2-digit', day: '2-digit',
                            hour: '2-digit', minute: '2-digit'
                        });
                        return (
                            <a href={\`/history/yesno/\${item.id}\`} class="history-card">
                                <div class="card-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                                </div>
                                <div class="card-info">
                                    <h3 class="card-title">{item.title}</h3>
                                    <div class="card-meta">
                                        <span class="date">{formattedDate}</span>
                                    </div>
                                </div>
                                <div class="card-arrow">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                                </div>
                            </a>
                        );
                    })}
                </div>
            )}
            </div>
        </div>
    </main>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const btns = document.querySelectorAll('.tab-btn');
            const contents = document.querySelectorAll('.tab-content');

            btns.forEach(btn => {
                btn.addEventListener('click', () => {
                    btns.forEach(b => b.classList.remove('active'));
                    contents.forEach(c => c.classList.remove('active'));

                    btn.classList.add('active');
                    const target = btn.getAttribute('data-target');
                    if(target) {
                        document.getElementById(target)?.classList.add('active');
                    }
                });
            });
        });
    </script>`;

c = c.replace(targetHtmlEnd, newHtmlEnd);

const targetCss = `.history-header {
            text-align: center;
            margin-bottom: 3rem;
        }`;

const newCss = `.history-header {
            text-align: center;
            margin-bottom: 2rem;
        }

        .tabs-container {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .tab-btn {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.7);
            padding: 10px 24px;
            border-radius: 30px;
            cursor: pointer;
            font-size: 1rem;
            font-family: var(--font-body);
            transition: all 0.3s;
        }

        .tab-btn:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .tab-btn.active {
            background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(242, 201, 76, 0.2) 100%);
            border-color: var(--gold-primary);
            color: var(--gold-primary);
            font-weight: bold;
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
            animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }`;

c = c.replace(targetCss, newCss);

fs.writeFileSync(p, c);
console.log('Patched history UI');
