# import math
# from typing import Tuple, Union

# import cv2
# import numpy as np

# from deskew import determine_skew


# def rotate(
#         image: np.ndarray, angle: float, background: Union[int, Tuple[int, int, int]]
# ) -> np.ndarray:
#     old_width, old_height = image.shape[:2]
#     angle_radian = math.radians(angle)
#     width = abs(np.sin(angle_radian) * old_height) + abs(np.cos(angle_radian) * old_width)
#     height = abs(np.sin(angle_radian) * old_width) + abs(np.cos(angle_radian) * old_height)

#     image_center = tuple(np.array(image.shape[1::-1]) / 2)
#     rot_mat = cv2.getRotationMatrix2D(image_center, angle, 1.0)
#     rot_mat[1, 2] += (width - old_width) / 2
#     rot_mat[0, 2] += (height - old_height) / 2
#     return cv2.warpAffine(image, rot_mat, (int(round(height)), int(round(width))), borderValue=background)

# image = cv2.imread('test_img.jpg')
# grayscale = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
# angle = determine_skew(grayscale)
# rotated = rotate(image, angle, (0, 0, 0))
# cv2.imwrite('output.jpg', rotated)

import cv2
import numpy as np
from deskew import determine_skew
from skimage.transform import rotate


def deskew_image(image_path: str, output_path: str):
    # 1. Load the image using OpenCV
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Could not open or find the image: {image_path}")

    # 2. Convert to grayscale
    grayscale = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

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
    input_img = "test_outputs/1_original.png"  # Replace with your image path
    output_img = "ai-service/deskew_trial/deskewed_document.jpg"
    
    try:
        deskew_image(input_img, output_img)
    except Exception as e:
        print(f"Error: {e}")
