from PIL import Image

def resize_icon(img_path, out_path, size):
    # Open the image
    img = Image.open(img_path).convert("RGBA")
    # High-quality resize
    img = img.resize((size, size), Image.Resampling.LANCZOS)
    # Save the result
    img.save(out_path, format="PNG")

# Use the dark circular glowing icon
in_img = "/Users/vishalyadav/.gemini/antigravity-ide/brain/f4413a72-eaf1-413c-8093-a7e52f795769/devportfolio_icon_circle_1789824493176.jpg"

# Generate 3 sizes for Chrome extension
resize_icon(in_img, "icons/icon16.png", 16)
resize_icon(in_img, "icons/icon48.png", 48)
resize_icon(in_img, "icons/icon128.png", 128)

# Generate favicon for the web client
resize_icon(in_img, "../client/public/favicon.png", 128)
# Generate a 32x32 one for favicon standard as well just in case
resize_icon(in_img, "../client/public/favicon32.png", 32)

print("Icons generated successfully!")
