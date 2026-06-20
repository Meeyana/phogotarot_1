import os

blog_dir = 'd:/Tuan/phogotarot/src/content/blog/'
for filename in os.listdir(blog_dir):
    if filename.endswith('.md'):
        filepath = os.path.join(blog_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace image: "/images/uploads/..." with "https://phogotarot.com/images/uploads/..."
        if 'image: "/images/uploads/' in content or "image: '/images/uploads/" in content:
            new_content = content.replace('image: "/images/uploads/', 'image: "https://phogotarot.com/images/uploads/')
            new_content = new_content.replace("image: '/images/uploads/", "image: 'https://phogotarot.com/images/uploads/")
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'Fixed {filename}')
