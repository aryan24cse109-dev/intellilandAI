# app/services/preprocessing.py
import cv2
import numpy as np

class PreprocessingService:
    @staticmethod
    def deskew_image(image: np.ndarray) -> np.ndarray:
        if image is None or image.size == 0:
            return image

        (h, w) = image.shape[:2]
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # 1. Heavy blur to dissolve digital halftone/dither speckles
        blurred = cv2.GaussianBlur(gray, (11, 11), 0)

        # 2. Otsu threshold to separate the main document sheet from margins
        thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]

        # 3. Find external contours to lock onto the main printed border
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return image

        # Select the largest contour (the document border)
        largest_contour = max(contours, key=cv2.contourArea)
        
        # Ensure it covers at least 15% of the page area
        if cv2.contourArea(largest_contour) < (h * w * 0.15):
            return image

        # 4. Compute the minimum area bounding box
        rect = cv2.minAreaRect(largest_contour)
        angle = rect[-1]

        # Normalize angle to standard orientation
        # cv2.minAreaRect returns [-90, 0) or [0, 90) depending on OpenCV build
        if angle < -45:
            angle = -(90 + angle)
        elif angle > 45:
            angle = -(angle - 90)
        else:
            angle = -angle

        # If angle is near 0 or invalid, skip rotation
        if abs(angle) < 0.3 or abs(angle) > 30:
            return image

        # 5. Rotate image around center
        center = (w // 2, h // 2)
        rot_mat = cv2.getRotationMatrix2D(center, angle, 1.0)

        return cv2.warpAffine(
            image,
            rot_mat,
            (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_CONSTANT,
            borderValue=(255, 255, 255)
        )

    @staticmethod
    def enhance_contrast_and_binarize(image: np.ndarray) -> np.ndarray:
        if image is None or image.size == 0:
            return image

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # 1. Median blur removes salt-and-pepper dot noise completely
        denoised = cv2.medianBlur(gray, 3)

        # 2. Standard global Otsu thresholding
        _, binarized = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)

        # 3. Morphological open to wipe out any remaining isolated background speckles
        clean_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        clean_binary = cv2.morphologyEx(binarized, cv2.MORPH_OPEN, clean_kernel)

        return clean_binary