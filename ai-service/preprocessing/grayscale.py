import cv2
import numpy as np


def to_grayscale(image: np.ndarray) -> np.ndarray:
    """
    Convert BGR/RGB image to grayscale.

    Args:
        image: OpenCV image.

    Returns:
        Grayscale image.
    """

    if image is None:
        raise ValueError("Input image is None")

    if len(image.shape) == 2:
        # Already grayscale
        return image

    return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)