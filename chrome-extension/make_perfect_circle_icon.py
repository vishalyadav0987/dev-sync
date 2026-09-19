from PIL import Image, ImageDraw

def create_perfect_icons(img_path):
    # Open the high-res original image
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    
    # Create a high-res mask
    mask = Image.new('L', (width, height), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, width, height), fill=255)
    
    # Apply the mask at high-res
    high_res_circle = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    high_res_circle.paste(img, (0, 0), mask=mask)
    
    # Define sizes and output paths
    outputs = [
        (16, "icons/icon16.png"),
        (48, "icons/icon48.png"),
        (128, "icons/icon128.png"),
        (128, "../client/public/favicon.png"),
        (32, "../client/public/favicon32.png")
    ]
    
    # Resize with Lanczos (which produces extremely smooth anti-aliased results)
    for size, out_path in outputs:
        resized = high_res_circle.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(out_path, format="PNG")

# Use the dark circular glowing icon
in_img = "/Users/vishalyadav/.gemini/antigravity-ide/brain/f4413a72-eaf1-413c-8093-a7e52f795769/devportfolio_icon_circle_1789824493176.jpg"

create_perfect_icons(in_img)
print("Perfect anti-aliased circle icons generated successfully!")
