
import cv2
import numpy as np
from deskew import determine_skew
from skimage.transform import rotate
import time

curr_t = int(time.time())

def deskew_image(image_path: str, output_path: str, gray_path:str):
    # 1. Load the image using OpenCV
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Could not open or find the image: {image_path}")

    # 2. Convert to grayscale
    grayscale = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    cv2.imwrite(gray_path,grayscale)
    print(f"Successfully saved grayscale image to: {gray_path}")
    # 3. Determine the skew angle
    # The background_color determines what color the library assumes the canvas is
    angle = determine_skew(grayscale)
    print(f"Detected skew angle: {angle:.2f} degrees")

    # 4. Rotate the image to deskew it
    # We use scikit-image's rotate function as it handles the deskew output natively
    # cval=255 fills the newly exposed edges with white (use 0 for black)
    rotated = rotate(image, angle, resize=True, cval=1.0)

    # 5. Convert back to 8-bit unsigned integer for OpenCV to save
    # scikit-image output is a float between 0.0 and 1.0
    final_image = (rotated * 255).astype(np.uint8)

    # 6. Save the corrected image
    cv2.imwrite(output_path, final_image)
    print(f"Successfully saved deskewed image to: {output_path}")


# Example usage:
if __name__ == "__main__":
    input_img = "ai-service/test_img.jpg"  # Replace with your image path
    output_img = f"ai-service/deskew_trial/deskewed_document-{curr_t}.png"
    gray_img = f'ai-service/deskew_trial/graysacle_document-{curr_t}.png'
    
    try:
        deskew_image(input_img, output_img, gray_img)
    except Exception as e:
        print(f"Error: {e}")
