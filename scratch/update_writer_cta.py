import json

file_path = r'd:\Tuan\phogotarot\content-plan\n8n-seo-content.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for n in data['nodes']:
    if n['name'] == 'Chapter Writer Agent':
        old_prompt = n['parameters'].get('jsonBody', '')
        if old_prompt:
            new_prompt = old_prompt.replace(
                '- Nếu tiêu đề chương là "Intro", viết MỘT đoạn mở 60–100 từ đánh vào nhu cầu của ${ $(\'Trigger Input\').item.json.body.audience }',
                '- Nếu tiêu đề chương là "Intro", viết MỘT đoạn mở 60–100 từ đánh vào nhu cầu của ${ $(\'Trigger Input\').item.json.body.audience }\n- ĐẶC BIỆT: Hãy khéo léo lồng ghép lời kêu gọi (Call to Action) khuyến khích độc giả đặt lịch trải bài Tarot cá nhân tại Phố Gỗ Tarot để giải quyết triệt để vấn đề của họ. Khuyến khích chèn vào phần kết luận hoặc nơi phù hợp nhất. Không PR lố lăng, hãy giữ giọng văn thấu cảm và chân thành.'
            )
            n['parameters']['jsonBody'] = new_prompt
            break

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Updated Chapter Writer Agent prompt with product CTA.")
