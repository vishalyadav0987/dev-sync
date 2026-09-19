from PIL import Image, ImageDraw, ImageChops

def trim(im):
    # Convert to grayscale to find bright pixels
    gray = im.convert("L")
    # Threshold to find non-dark pixels (the glowing ring)
    # The background is dark navy, let's pick a threshold like 40
    mask = gray.point(lambda p: p > 40 and 255)
    bbox = mask.getbbox()
    if bbox:
        # Give it a tiny bit of padding (e.g. 10 pixels) so it doesn't cut the very edge of the glow
        x1, y1, x2, y2 = bbox
        pad = 15
        x1 = max(0, x1 - pad)
        y1 = max(0, y1 - pad)
        x2 = min(im.width, x2 + pad)
        y2 = min(im.height, y2 + pad)
        
        # Make sure the crop is a perfect square so we don't distort it
        w = x2 - x1
        h = y2 - y1
        size = max(w, h)
        
        # Center the square crop
        cx = (x1 + x2) // 2
        cy = (y1 + y2) // 2
        
        x1 = max(0, cx - size // 2)
        y1 = max(0, cy - size // 2)
        x2 = x1 + size
        y2 = y1 + size
        
        return im.crop((x1, y1, x2, y2))
    return im

def create_maximized_icons(img_path):
    img = Image.open(img_path).convert("RGBA")
    
    # Crop to tightly fit the glowing ring!
    cropped = trim(img)
    width, height = cropped.size
    
    # Create a high-res mask for the NEW cropped size
    mask = Image.new('L', (width, height), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, width, height), fill=255)
    
    # Apply the mask at high-res
    high_res_circle = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    high_res_circle.paste(cropped, (0, 0), mask=mask)
    
    outputs = [
        (16, "icons/icon16.png"),
        (48, "icons/icon48.png"),
        (128, "icons/icon128.png"),
        (128, "../client/public/favicon.png"),
        (32, "../client/public/favicon32.png")
    ]
    
    for size, out_path in outputs:
        resized = high_res_circle.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(out_path, format="PNG")

in_img = "/Users/vishalyadav/.gemini/antigravity-ide/brain/f4413a72-eaf1-413c-8093-a7e52f795769/devportfolio_icon_circle_1789824493176.jpg"

create_maximized_icons(in_img)
print("Maximized circle icons generated successfully!")
