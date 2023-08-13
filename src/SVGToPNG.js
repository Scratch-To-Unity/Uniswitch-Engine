async function convertSvgToPng(svgString) {
    // Set the SVG data as the Image source
    const img = new Image();
    img.src = 'data:image/svg+xml,' + encodeURIComponent(svgString);

    // Wait for the Image to load
    await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = () => {
            throw new Error("Failed to load the SVG image.");
        };
    });

    // Create an in-memory canvas element
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match the image
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw the SVG image onto the canvas
    context.drawImage(img, 0, 0);

    // Convert canvas to Blob using createImageBitmap
    const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png');
    });

    return blob;
}