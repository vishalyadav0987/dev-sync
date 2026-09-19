from PIL import Image, ImageDraw

def create_perfect_center_icons(img_path):
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    
    margin = int(width * 0.14) 
    
    x1 = margin
    y1 = margin
    x2 = width - margin
    y2 = height - margin
    
    cropped = img.crop((x1, y1, x2, y2))
    
    c_width, c_height = cropped.size
    mask = Image.new('L', (c_width, c_height), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, c_width, c_height), fill=255)
    
    high_res_circle = Image.new('RGBA', (c_width, c_height), (0, 0, 0, 0))
    high_res_circle.paste(cropped, (0, 0), mask=mask)
    
    outputs = [
        (16, "icons/icon16.png"),
        (48, "icons/icon48.png"),
        (128, "icons/icon128.png"),
        (128, "../client/public/favicon.png"),
        (32, "../client/public/favicon32.png"),
        (16, "../client/public/favicon16.png")
    ]
    
    for size, out_path in outputs:
        resized = high_res_circle.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(out_path, format="PNG")

in_img = "/Users/vishalyadav/.gemini/antigravity-ide/brain/f4413a72-eaf1-413c-8093-a7e52f795769/devportfolio_icon_circle_1789824493176.jpg"

create_perfect_center_icons(in_img)
