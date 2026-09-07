import cv2
import numpy as np


def denoise(image: np.ndarray) -> np.ndarray:
    """
    Remove small noise while preserving text.
    """

    return cv2.fastNlMeansDenoising(
        image,
        None,
        h=10,
        templateWindowSize=7,
        searchWindowSize=21
    )


def enhance_contrast(image: np.ndarray) -> np.ndarray:
    """
    Improve local contrast using CLAHE.
    """

    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    return clahe.apply(image)


def adaptive_threshold(image: np.ndarray) -> np.ndarray:
    """
    Create a binary document image.

    Useful for documents with uneven lighting.
    """

    return cv2.adaptiveThreshold(
        image,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        10
    )


def preprocess_for_ocr(
    image: np.ndarray,
    use_threshold: bool = False
) -> np.ndarray:
    """
    Complete OpenCV preprocessing pipeline.

    Args:
        image: grayscale image
        use_threshold: whether to use adaptive thresholding

    Returns:
        OCR-ready image
    """

    if image is None:
        raise ValueError("Input image is None")

    processed = image.copy()

    # 1. Denoise
    processed = denoise(processed)

    # 2. Improve contrast
    processed = enhance_contrast(processed)

    # 3. Optional binarization
    if use_threshold:
        processed = adaptive_threshold(processed)

    return processed