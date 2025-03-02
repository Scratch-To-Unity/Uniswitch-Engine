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

    x = 240;
    y = 240;

    

    // Create an in-memory canvas element
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    

    // Set canvas dimensions to match the image
    const multiplier = 1;
    // canvas.width = img.width * multiplier;
    // canvas.height = img.height * multiplier;

     canvas.width = 480 * multiplier;
     canvas.height = 360 * multiplier;

    // Fill the canvas with white color
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the SVG image onto the canvas
    // context.drawImage(img, x * multiplier, y * multiplier, img.width * multiplier, img.height * multiplier);
    context.drawImage(img, x * multiplier, y * multiplier, img.width * multiplier, img.height * multiplier);

    // Convert canvas to Blob using createImageBitmap
    const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png');
    });

    return blob;
}