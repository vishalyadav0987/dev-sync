from PIL import Image, ImageDraw

def mask_circle(img_path, out_path, size):
    # Open the image and resize it
    img = Image.open(img_path).convert("RGBA")
    img = img.resize((size, size), Image.Resampling.LANCZOS)
    
    # Create a circular mask
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size, size), fill=255)
    
    # Apply the mask
    result = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    result.paste(img, (0, 0), mask=mask)
    
    # Save the result
    result.save(out_path, format="PNG")

# Input image path
in_img = "/Users/vishalyadav/.gemini/antigravity-ide/brain/f4413a72-eaf1-413c-8093-a7e52f795769/devportfolio_icon_bold_1789824798414.jpg"

# Generate 3 sizes for Chrome extension
mask_circle(in_img, "icons/icon16.png", 16)
mask_circle(in_img, "icons/icon48.png", 48)
mask_circle(in_img, "icons/icon128.png", 128)

# Generate favicon for the web client
mask_circle(in_img, "../client/public/favicon.png", 128)

print("Icons generated successfully!")
