import json
file_path = 'd:/Tuan/phogotarot/content-plan/n8n-seo-content.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for node in data.get('nodes', []):
    if node['name'] == 'Outline Generator Agent':
        jscode = node['parameters']['jsonBody']
        jscode = jscode.replace(
            '- Outline dạng H1 – H2 – H3 có cấu trúc logic và dễ triển khai thành bài viết dài',
            '- Outline có cấu trúc logic và dễ triển khai thành bài viết dài\n- TUYỆT ĐỐI KHÔNG ghi chữ "H1:", "H2:", "H3:" vào đầu tiêu đề. Hãy viết trực tiếp nội dung tiêu đề.'
        )
        node['parameters']['jsonBody'] = jscode
        
    elif node['name'] == 'Combine Chapters':
        jscode = node['parameters']['jsCode']
        # We need to replace `ch.chapterTitle` with a cleaned version inside the mapping
        jscode = jscode.replace(
            'return `## ${ch.chapterTitle}\\n\\n${ch.chapterContent.trim()}`;',
            'const cleanTitle = ch.chapterTitle.replace(/^(H[1-6]:\\s*|H[1-6]\\s*-?\\s*|#+\\s*H[1-6]:?\\s*)/i, "").trim();\n    return `## ${cleanTitle}\\n\\n${ch.chapterContent.trim()}`;'
        )
        node['parameters']['jsCode'] = jscode

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Updated n8n prompts and logic to remove H2: prefix.")
