document.addEventListener('DOMContentLoaded', () => {
    // 1. TÍNH NĂNG THU GỌN NỘI DUNG (READ MORE)
    const setupReadMore = () => {
        const contentBodies = document.querySelectorAll('.interpretation-content-body');
        contentBodies.forEach(body => {
            if (body.dataset.readMoreInit) return;
            
            if (body.scrollHeight > 300) {
                body.classList.add('expandable-content', 'collapsed');
                body.dataset.readMoreInit = "true";

                const btnWrapper = document.createElement('div');
                btnWrapper.className = 'text-center mt-4 pt-2 border-t border-white/5 relative z-10';

                const btn = document.createElement('button');
                btn.className = 'read-more-btn inline-flex items-center gap-2 px-6 py-2 rounded-full border border-gold/50 text-gold transition-all text-sm font-bold uppercase tracking-wider';
                btn.innerHTML = 'Xem chi tiết <i class="fas fa-chevron-down"></i>';
                
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const isCollapsed = body.classList.contains('collapsed');
                    
                    if (isCollapsed) {
                        body.classList.remove('collapsed');
                        btn.innerHTML = 'Thu gọn <i class="fas fa-chevron-up"></i>';
                    } else {
                        body.classList.add('collapsed');
                        btn.innerHTML = 'Xem chi tiết <i class="fas fa-chevron-down"></i>';
                        body.parentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });

                btnWrapper.appendChild(btn);
                body.parentNode.insertBefore(btnWrapper, body.nextSibling);
            }
        });
    };

    // 2. TÍNH NĂNG MỤC LỤC (TOC)
    const initTOC = () => {
        const tocList = document.getElementById('toc-list');
        const tocToggle = document.getElementById('toc-toggle');
        const tocContent = document.getElementById('toc-content');
        
        if (!tocList || !tocToggle) return;
        
        tocList.innerHTML = '';
        const headings = document.querySelectorAll('h2.head-outline, h3.section-subtitle');

        headings.forEach((heading, index) => {
            const text = heading.innerText.replace(/\n/g, ' ').trim();
            if (!text) return;

            if (!heading.id) {
                heading.id = `section-toc-${index}`;
            }

            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${heading.id}`;
            a.textContent = text;
            
            if (heading.tagName === 'H2') {
                li.className = 'toc-h2';
            } else {
                li.className = 'toc-h3';
            }
            
            a.addEventListener('click', (e) => {
                e.preventDefault();
                tocContent.classList.remove('active');
                
                const icon = tocToggle.querySelector('i');
                if(icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-list-ol');
                }

                const target = document.getElementById(heading.id);
                if (target) {
                    const headerOffset = 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                    });
                }
            });

            li.appendChild(a);
            tocList.appendChild(li);
        });

        tocToggle.onclick = () => {
            tocContent.classList.toggle('active');
            const icon = tocToggle.querySelector('i');
            if(icon) {
                if (tocContent.classList.contains('active')) {
                    icon.classList.remove('fa-list-ol');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-list-ol');
                }
            }
        };

        document.onclick = (e) => {
            if (!tocContent.contains(e.target) && !tocToggle.contains(e.target)) {
                tocContent.classList.remove('active');
                const icon = tocToggle.querySelector('i');
                if(icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-list-ol');
                }
            }
        };
    };

    // 3. VẼ BIỂU ĐỒ TÍNH CÁCH VÀ NGHỀ NGHIỆP
    const drawCharts = () => {
        const pDataObj = window.__NUMEROLOGY_DATA__?.personalityStats;
        const cDataObj = window.__NUMEROLOGY_DATA__?.careerStats;

        if (pDataObj) {
            const ctx = document.getElementById('personalityChart');
            if (ctx && typeof Chart !== 'undefined') {
                const labels = pDataObj.map(p => p.label);
                const data = pDataObj.map(p => p.percent);
                const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: colors,
                            borderRadius: 4,
                            barPercentage: 0.6
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            datalabels: {
                                color: '#fff',
                                anchor: 'end',
                                align: 'end',
                                formatter: (value) => value + '%',
                                font: { weight: 'bold' }
                            }
                        },
                        scales: {
                            x: { display: false, max: 40 },
                            y: { ticks: { color: '#e5e7eb', font: { size: 10 } }, grid: { display: false } }
                        }
                    },
                    plugins: [ChartDataLabels]
                });
            }
        }

        if (cDataObj) {
            const ctx = document.getElementById('careerChart');
            if (ctx && typeof Chart !== 'undefined') {
                const labels = cDataObj.map(c => c.label);
                const data = cDataObj.map(c => c.percent);
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: '#0066cc',
                            borderRadius: 4,
                            barPercentage: 0.6
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            datalabels: {
                                color: '#fff',
                                anchor: 'center',
                                align: 'center',
                                formatter: (value) => value + '%',
                                font: { weight: 'bold' }
                            }
                        },
                        scales: {
                            x: { display: false, max: 40 },
                            y: { ticks: { color: '#e5e7eb', font: { size: 11 } }, grid: { display: false } }
                        }
                    },
                    plugins: [ChartDataLabels]
                });
            }
        }

        // Vẽ biểu đồ sóng nếu có data
        if (typeof drawWaveChart === 'function' && window.__NUMEROLOGY_DATA__?.day) {
            drawWaveChart('personalYearChart', window.__NUMEROLOGY_DATA__.day, window.__NUMEROLOGY_DATA__.month);
        }
    };

    // Chạy các function
    setTimeout(() => {
        setupReadMore();
        initTOC();
    }, 500);

    // Chờ ChartJS load xong rồi vẽ biểu đồ (do ChartJS load qua CDN)
    window.addEventListener('load', drawCharts);
});
