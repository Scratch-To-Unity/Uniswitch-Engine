// Function to convert SVG to PNG
function convertSvgToPng(svgString, callback) {
    // Create an in-memory Image element
    const img = new Image();

    // Callback when the Image is loaded
    img.onload = function () {
        // Create an in-memory canvas element
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        // Set canvas dimensions to match the image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the SVG image onto the canvas
        context.drawImage(img, 0, 0);

        try {
            /*// Get the Data URL of the canvas (PNG format)
            const pngDataUrl = canvas.toDataURL('image/png');

            // Call the callback with the PNG Data URL
            callback(null, pngDataUrl);*/
            canvas.toBlob(function (blob) {
                // Call the callback with the Blob
                callback(null, blob);
            });
            /*canvas.toBlob(function (blob) {
                // Call the callback with the Blob
                return blob;
            });*/
        } catch (error) {
            // In case of errors during conversion, pass the error to the callback
            callback(error, null);
        }
    };

    // Set the SVG data as the Image source
    img.src = 'data:image/svg+xml,' + encodeURIComponent(svgString);
}

async function convertSvgToPngV2(svgString) {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = function () {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            canvas.width = img.width;
            canvas.height = img.height;

            context.drawImage(img, 0, 0);

            try {
                canvas.toBlob(function (blob) {
                    resolve(blob);
                });
            } catch (error) {
                reject(error);
            }
        };

        img.onerror = function (error) {
            reject(error);
        };

        img.src = 'data:image/svg+xml,' + encodeURIComponent(svgString);
    });
}

async function convertSvgToPngV3(svgString) {
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


// Example usage:
/*const svgString = `
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <rect width="100" height="100" fill="blue" />
</svg>
`;

convertSvgToPng(svgString, (error, pngDataUrl) => {
    if (error) {
        console.error('Error converting SVG to PNG:', error);
    } else {
        console.log('PNG Data URL:', pngDataUrl);
        // You can now use the PNG Data URL as the source for an image element or do whatever you want with it.
    }
});*/