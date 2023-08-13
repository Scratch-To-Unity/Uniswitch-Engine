async function convertSvgToPng(svgString, x, y) {
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
    const multiplier = 4;
    canvas.width = img.width * multiplier;
    canvas.height = img.height * multiplier;

    // canvas.width = 480 * multiplier;
    // canvas.height = 360 * multiplier;

    // Draw the SVG image onto the canvas
    //context.drawImage(img, x * multiplier, y * multiplier);
    context.drawImage(img, 0, 0, img.width * multiplier, img.height * multiplier);

    // Convert canvas to Blob using createImageBitmap
    const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png');
    });

    return blob;
}