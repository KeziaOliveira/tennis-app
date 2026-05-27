import os

path = r'c:\Users\kezia\OneDrive\Documentos\347-bttv\src\types\supabase.ts'
if os.path.exists(path):
    print("Reading file...")
    try:
        # Try reading as UTF-16
        with open(path, 'r', encoding='utf-16') as f:
            content = f.read()
        print("Writing file in UTF-8...")
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Success!")
    except Exception as e:
        print("Error:", e)
else:
    print("File not found at", path)
