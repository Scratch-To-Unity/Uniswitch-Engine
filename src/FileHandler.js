let workspace = [];

function getFileExtension(filename) {
    return filename.split('.').pop();
}

function arrayBufferToString(arrayBuffer) {
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(arrayBuffer);
}

function stringToArrayBuffer(string) {
    const encoder = new TextEncoder();
    return encoder.encode(string).buffer;
}

function blobToArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result);
        };

        reader.onerror = () => {
            reject(new Error('Error reading the Blob as ArrayBuffer'));
        };

        reader.readAsArrayBuffer(blob);
    });
}

function getFileNameWithoutExtension(filename) {
    const parts = filename.split(".");
    if (parts.length > 1) {
        parts.pop(); // Remove the last part (extension)
    }
    return parts.join(".");
}

function zipAndDownloadFiles(fileArray) {
    // Create a new instance of JSZip
    var zip = new JSZip();

    // Iterate over the fileArray
    fileArray.forEach(function (file) {
        // Add each file to the zip
        zip.file(file.name, file.data);
        addProgress();
    });
    let previousPercent = 0;
    // Generate the zip file asynchronously
    zip.generateAsync({ type: 'blob' }, function updateCallback(metadata) {
        //progress = metadata.percent / 100 * estimatedWork;
        addProgress((metadata.percent - previousPercent) * 2);
        previousPercent = metadata.percent;
    })
        .then(function (content) {
            addProgress();
            // Create a download link element
            var link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'converted project.zip';

            // Simulate a click event to trigger the download
            link.click();

            // Clean up the URL object
            URL.revokeObjectURL(link.href);

            endTime = performance.now();
            const timeTaken = (endTime - startTime) / 1000;
            console.log("File size : " + estimatedProjectSize / 1024 + "Kb.");
            console.log("Time taken : " + timeTaken + "s.");

            document.getElementById("time").innerHTML = "Time taken : " + timeTaken.toFixed(1) + "s.";
        });
}

function unzipFromURL(url) {
    return new Promise(function (resolve, reject) {
        fetch(url)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Failed to fetch the zip file');
                }
                return response.blob();
            })
            .then(function (blob) {
                var zip = new JSZip();
                return zip.loadAsync(blob);
            })
            .then(function (zip) {
                var fileArray = [];
                var fileCount = Object.keys(zip.files).length;
                var processedCount = 0;

                estimatedWork += fileCount; //number of template files

                Object.keys(zip.files).forEach(function (filename) {
                    addProgress();
                    zip.files[filename].async('arraybuffer')
                        .then(function (data) {
                            var file = {
                                name: filename,
                                data: data
                            };
                            fileArray.push(file);
                            processedCount++;

                            if (processedCount === fileCount) {
                                resolve(fileArray);
                            }
                        });
                });
            })
            .catch(function (error) {
                reject(error);
            });
    });
}

function toBinary(string) {
    const codeUnits = new Uint16Array(string.length);
    for (let i = 0; i < codeUnits.length; i++) {
        codeUnits[i] = string.charCodeAt(i);
    }
    return btoa(String.fromCharCode(...new Uint8Array(codeUnits.buffer)));
}

async function extractImagesFromZippedFile(fileInput, callback) {
    var images = [];

    var zipFile = fileInput/*.files[0]*/;

    var reader = new FileReader();

    reader.onload = async function (e) {
        var zipData = e.target.result;

        JSZip.loadAsync(zipData)
            .then(async function (zip) {
                var imagePromises = [];
                estimatedWork += Object.keys(zip.files).length;
                console.log(zip);
                zip.forEach(async function (relativePath, file) {
                    addProgress();
                    if (file.dir) {
                        return; // Ignore directories
                    }

                    // Check if the file is an image
                    if (/\.(jpe?g|png|gif)$/i.test(relativePath)) {
                        imagePromises.push(
                            file.async('base64').then(function (base64) {
                                var image = {
                                    name: "Template Scratch/Assets/Costumes/" + relativePath,
                                    data: b64toBlob(base64),
                                };
                                images.push(image);
                                if (getFileExtension(relativePath) == "svg") {
                                    //SVG meta
                                    var imageMeta = {
                                        name: "Template Scratch/Assets/Costumes/" + relativePath + ".meta",
                                        data: stringToArrayBuffer("fileFormatVersion: 2\nguid: " + stringToGUID(getFileNameWithoutExtension(relativePath)) + "\nScriptedImporter:\n  internalIDToNameTable: []\n  externalObjects: {}\n  serializedVersion: 2\n  userData: \n  assetBundleName: \n  assetBundleVariant: \n  script: {fileID: 11500000, guid: a57477913897c46af95d590f580878bd, type: 3}\n  svgType: 1\n  texturedSpriteMeshType: 0\n  svgPixelsPerUnit: 100\n  gradientResolution: 64\n  alignment: 0\n  customPivot: {x: 0, y: 0}\n  generatePhysicsShape: 0\n  viewportOptions: 0\n  preserveViewport: 0\n  advancedMode: 0\n  predefinedResolutionIndex: 2\n  targetResolution: 720\n  resolutionMultiplier: 2\n  stepDistance: 10\n  samplingStepDistance: 100\n  maxCordDeviationEnabled: 0\n  maxCordDeviation: 1\n  maxTangentAngleEnabled: 0\n  maxTangentAngle: 5\n  keepTextureAspectRatio: 1\n  textureSize: 1024\n  textureWidth: 256\n  textureHeight: 256\n  wrapMode: 0\n  filterMode: 1\n  sampleCount: 2\n  preserveSVGImageAspect: 0\n  useSVGPixelsPerUnit: 1\n  spriteData:\n    TessellationDetail: 0\n    SpriteRect:\n      name: bcf454acf82e4504149f7ffe07081dbc\n      originalName: \n      pivot: {x: 5.1263156, y: 5.12}\n      alignment: 0\n      border: {x: 0, y: 0, z: 0, w: 0}\n      rect:\n        serializedVersion: 2\n        x: 0\n        y: 0\n        width: 95\n        height: 100\n      spriteID: d058db1872292fa4489e7f183a13187e\n    PhysicsOutlines: []\n"),
                                    };
                                } else {
                                    //PNG meta
                                    var imageMeta = {
                                        name: "Template Scratch/Assets/Costumes/" + relativePath + ".meta",
                                        data: stringToArrayBuffer("fileFormatVersion: 2\nguid: " + stringToGUID(getFileNameWithoutExtension(relativePath)) + "\nTextureImporter:\n  internalIDToNameTable: []\n  externalObjects: {}\n  serializedVersion: 12\n  mipmaps:\n    mipMapMode: 0\n    enableMipMap: 0\n    sRGBTexture: 1\n    linearTexture: 0\n    fadeOut: 0\n    borderMipMap: 0\n    mipMapsPreserveCoverage: 0\n    alphaTestReferenceValue: 0.5\n    mipMapFadeDistanceStart: 1\n    mipMapFadeDistanceEnd: 3\n  bumpmap:\n    convertToNormalMap: 0\n    externalNormalMap: 0\n    heightScale: 0.25\n    normalMapFilter: 0\n    flipGreenChannel: 0\n  isReadable: 0\n  streamingMipmaps: 0\n  streamingMipmapsPriority: 0\n  vTOnly: 0\n  ignoreMipmapLimit: 0\n  grayScaleToAlpha: 0\n  generateCubemap: 6\n  cubemapConvolution: 0\n  seamlessCubemap: 0\n  textureFormat: 1\n  maxTextureSize: 2048\n  textureSettings:\n    serializedVersion: 2\n    filterMode: 1\n    aniso: 1\n    mipBias: 0\n    wrapU: 1\n    wrapV: 1\n    wrapW: 1\n  nPOTScale: 0\n  lightmap: 0\n  compressionQuality: 50\n  spriteMode: 1\n  spriteExtrude: 1\n  spriteMeshType: 1\n  alignment: 0\n  spritePivot: {x: 0.5, y: 0.5}\n  spritePixelsToUnits: 200\n  spriteBorder: {x: 0, y: 0, z: 0, w: 0}\n  spriteGenerateFallbackPhysicsShape: 1\n  alphaUsage: 1\n  alphaIsTransparency: 1\n  spriteTessellationDetail: -1\n  textureType: 8\n  textureShape: 1\n  singleChannelComponent: 0\n  flipbookRows: 1\n  flipbookColumns: 1\n  maxTextureSizeSet: 0\n  compressionQualitySet: 0\n  textureFormatSet: 0\n  ignorePngGamma: 0\n  applyGammaDecoding: 0\n  swizzle: 50462976\n  cookieLightType: 0\n  platformSettings:\n  - serializedVersion: 3\n    buildTarget: DefaultTexturePlatform\n    maxTextureSize: 2048\n    resizeAlgorithm: 0\n    textureFormat: -1\n    textureCompression: 1\n    compressionQuality: 50\n    crunchedCompression: 0\n    allowsAlphaSplitting: 0\n    overridden: 0\n    androidETC2FallbackOverride: 0\n    forceMaximumCompressionQuality_BC6H_BC7: 0\n  - serializedVersion: 3\n    buildTarget: Standalone\n    maxTextureSize: 2048\n    resizeAlgorithm: 0\n    textureFormat: -1\n    textureCompression: 1\n    compressionQuality: 50\n    crunchedCompression: 0\n    allowsAlphaSplitting: 0\n    overridden: 0\n    androidETC2FallbackOverride: 0\n    forceMaximumCompressionQuality_BC6H_BC7: 0\n  - serializedVersion: 3\n    buildTarget: Server\n    maxTextureSize: 2048\n    resizeAlgorithm: 0\n    textureFormat: -1\n    textureCompression: 1\n    compressionQuality: 50\n    crunchedCompression: 0\n    allowsAlphaSplitting: 0\n    overridden: 0\n    androidETC2FallbackOverride: 0\n    forceMaximumCompressionQuality_BC6H_BC7: 0\n  - serializedVersion: 3\n    buildTarget: Android\n    maxTextureSize: 2048\n    resizeAlgorithm: 0\n    textureFormat: -1\n    textureCompression: 1\n    compressionQuality: 50\n    crunchedCompression: 0\n    allowsAlphaSplitting: 0\n    overridden: 0\n    androidETC2FallbackOverride: 0\n    forceMaximumCompressionQuality_BC6H_BC7: 0\n  - serializedVersion: 3\n    buildTarget: WebGL\n    maxTextureSize: 2048\n    resizeAlgorithm: 0\n    textureFormat: -1\n    textureCompression: 1\n    compressionQuality: 50\n    crunchedCompression: 0\n    allowsAlphaSplitting: 0\n    overridden: 0\n    androidETC2FallbackOverride: 0\n    forceMaximumCompressionQuality_BC6H_BC7: 0\n  spriteSheet:\n    serializedVersion: 2\n    sprites: []\n    outline: []\n    physicsShape: []\n    bones: []\n    spriteID: 5e97eb03825dee720800000000000000\n    internalID: 0\n    vertices: []\n    indices: \n    edges: []\n    weights: []\n    secondaryTextures: []\n    nameFileIdTable: {}\n  mipmapLimitGroupName: \n  pSDRemoveMatte: 0\n  userData: \n  assetBundleName: \n  assetBundleVariant:\n"),
                                    };
                                }

                                images.push(imageMeta);
                            })
                        );
                    } else {
                        if (getFileExtension(relativePath) == "json") {
                            imagePromises.push(
                                file.async('text').then(function (jsonData) {
                                    scratchProjectJSON = jsonData;
                                })
                            );
                        }
                        if (getFileExtension(relativePath) == "svg") {
                            imagePromises.push(
                                file.async('text').then(function (svgData) {
                                    var image = {
                                        name: "Template Scratch/Assets/Costumes/" + relativePath,
                                        data: stringToArrayBuffer(svgData),
                                    };
                                    images.push(image);
                                    //SVG meta
                                    var imageMeta = {
                                        name: "Template Scratch/Assets/Costumes/" + relativePath + ".meta",
                                        data: stringToArrayBuffer("fileFormatVersion: 2\nguid: " + stringToGUID(getFileNameWithoutExtension(relativePath)) + "\nScriptedImporter:\n  internalIDToNameTable: []\n  externalObjects: {}\n  serializedVersion: 2\n  userData: \n  assetBundleName: \n  assetBundleVariant: \n  script: {fileID: 11500000, guid: a57477913897c46af95d590f580878bd, type: 3}\n  svgType: 1\n  texturedSpriteMeshType: 0\n  svgPixelsPerUnit: 100\n  gradientResolution: 64\n  alignment: 0\n  customPivot: {x: 0, y: 0}\n  generatePhysicsShape: 0\n  viewportOptions: 0\n  preserveViewport: 0\n  advancedMode: 0\n  predefinedResolutionIndex: 2\n  targetResolution: 720\n  resolutionMultiplier: 2\n  stepDistance: 10\n  samplingStepDistance: 100\n  maxCordDeviationEnabled: 0\n  maxCordDeviation: 1\n  maxTangentAngleEnabled: 0\n  maxTangentAngle: 5\n  keepTextureAspectRatio: 1\n  textureSize: 1024\n  textureWidth: 256\n  textureHeight: 256\n  wrapMode: 0\n  filterMode: 1\n  sampleCount: 2\n  preserveSVGImageAspect: 0\n  useSVGPixelsPerUnit: 1\n  spriteData:\n    TessellationDetail: 0\n    SpriteRect:\n      name: bcf454acf82e4504149f7ffe07081dbc\n      originalName: \n      pivot: {x: 5.1263156, y: 5.12}\n      alignment: 0\n      border: {x: 0, y: 0, z: 0, w: 0}\n      rect:\n        serializedVersion: 2\n        x: 0\n        y: 0\n        width: 95\n        height: 100\n      spriteID: d058db1872292fa4489e7f183a13187e\n    PhysicsOutlines: []\n"),
                                    };
                                    images.push(imageMeta);
                                    /*imagePromises.push(
                                        convertSvgToPngV2(svgData, (error, pngBlob) => {
                                            if (error) {
                                                console.error('Error converting SVG to PNG:', error);
                                                //reject(error);
                                            } else {
                                                //pngBlob.type = "";
                                                console.log("png blob : " + pngBlob);
                                                //image.data = pngBlob;
                                                //fileData = pngBlob;
                                                //resolve(pngBlob);
                                                return pngBlob;
                                            }
                                        })
                                    );*/
                                })
                                /*.then(function (fileData) {
                                    console.log("file data : " + fileData);
                                    var image = {
                                        name: "Template Scratch/Assets/Costumes/" + getFileNameWithoutExtension(relativePath) + ".png",
                                        data: fileData,
                                    };
                                    console.log("image data : " + image.data);
                                    images.push(image);
                                    //PNG meta
                                    var imageMeta = {
                                        name: "Template Scratch/Assets/Costumes/" + getFileNameWithoutExtension(relativePath) + ".png" + ".meta",
                                        data: stringToArrayBuffer("fileFormatVersion: 2\nguid: " + stringToGUID(getFileNameWithoutExtension(relativePath)) + "\nTextureImporter:\n  internalIDToNameTable: []\n  externalObjects: {}\n  serializedVersion: 12\n  mipmaps:\n    mipMapMode: 0\n    enableMipMap: 0\n    sRGBTexture: 1\n    linearTexture: 0\n    fadeOut: 0\n    borderMipMap: 0\n    mipMapsPreserveCoverage: 0\n    alphaTestReferenceValue: 0.5\n    mipMapFadeDistanceStart: 1\n    mipMapFadeDistanceEnd: 3\n  bumpmap:\n    convertToNormalMap: 0\n    externalNormalMap: 0\n    heightScale: 0.25\n    normalMapFilter: 0\n    flipGreenChannel: 0\n  isReadable: 0\n  streamingMipmaps: 0\n  streamingMipmapsPriority: 0\n  vTOnly: 0\n  ignoreMipmapLimit: 0\n  grayScaleToAlpha: 0\n  generateCubemap: 6\n  cubemapConvolution: 0\n  seamlessCubemap: 0\n  textureFormat: 1\n  maxTextureSize: 2048\n  textureSettings:\n    serializedVersion: 2\n    filterMode: 1\n    aniso: 1\n    mipBias: 0\n    wrapU: 1\n    wrapV: 1\n    wrapW: 1\n  nPOTScale: 0\n  lightmap: 0\n  compressionQuality: 50\n  spriteMode: 1\n  spriteExtrude: 1\n  spriteMeshType: 1\n  alignment: 0\n  spritePivot: {x: 0.5, y: 0.5}\n  spritePixelsToUnits: 200\n  spriteBorder: {x: 0, y: 0, z: 0, w: 0}\n  spriteGenerateFallbackPhysicsShape: 1\n  alphaUsage: 1\n  alphaIsTransparency: 1\n  spriteTessellationDetail: -1\n  textureType: 8\n  textureShape: 1\n  singleChannelComponent: 0\n  flipbookRows: 1\n  flipbookColumns: 1\n  maxTextureSizeSet: 0\n  compressionQualitySet: 0\n  textureFormatSet: 0\n  ignorePngGamma: 0\n  applyGammaDecoding: 0\n  swizzle: 50462976\n  cookieLightType: 0\n  platformSettings:\n  - serializedVersion: 3\n    buildTarget: DefaultTexturePlatform\n    maxTextureSize: 2048\n    resizeAlgorithm: 0\n    textureFormat: -1\n    textureCompression: 1\n    compressionQuality: 50\n    crunchedCompression: 0\n    allowsAlphaSplitting: 0\n    overridden: 0\n    androidETC2FallbackOverride: 0\n    forceMaximumCompressionQuality_BC6H_BC7: 0\n  - serializedVersion: 3\n    buildTarget: Standalone\n    maxTextureSize: 2048\n    resizeAlgorithm: 0\n    textureFormat: -1\n    textureCompression: 1\n    compressionQuality: 50\n    crunchedCompression: 0\n    allowsAlphaSplitting: 0\n    overridden: 0\n    androidETC2FallbackOverride: 0\n    forceMaximumCompressionQuality_BC6H_BC7: 0\n  - serializedVersion: 3\n    buildTarget: Server\n    maxTextureSize: 2048\n    resizeAlgorithm: 0\n    textureFormat: -1\n    textureCompression: 1\n    compressionQuality: 50\n    crunchedCompression: 0\n    allowsAlphaSplitting: 0\n    overridden: 0\n    androidETC2FallbackOverride: 0\n    forceMaximumCompressionQuality_BC6H_BC7: 0\n  - serializedVersion: 3\n    buildTarget: Android\n    maxTextureSize: 2048\n    resizeAlgorithm: 0\n    textureFormat: -1\n    textureCompression: 1\n    compressionQuality: 50\n    crunchedCompression: 0\n    allowsAlphaSplitting: 0\n    overridden: 0\n    androidETC2FallbackOverride: 0\n    forceMaximumCompressionQuality_BC6H_BC7: 0\n  - serializedVersion: 3\n    buildTarget: WebGL\n    maxTextureSize: 2048\n    resizeAlgorithm: 0\n    textureFormat: -1\n    textureCompression: 1\n    compressionQuality: 50\n    crunchedCompression: 0\n    allowsAlphaSplitting: 0\n    overridden: 0\n    androidETC2FallbackOverride: 0\n    forceMaximumCompressionQuality_BC6H_BC7: 0\n  spriteSheet:\n    serializedVersion: 2\n    sprites: []\n    outline: []\n    physicsShape: []\n    bones: []\n    spriteID: 5e97eb03825dee720800000000000000\n    internalID: 0\n    vertices: []\n    indices: \n    edges: []\n    weights: []\n    secondaryTextures: []\n    nameFileIdTable: {}\n  mipmapLimitGroupName: \n  pSDRemoveMatte: 0\n  userData: \n  assetBundleName: \n  assetBundleVariant:\n"),
                                    };
                                    /*
                                    //SVG meta
                                    var imageMeta = {
                                        name: "Template Scratch/Assets/Costumes/" + relativePath + ".meta",
                                        data: stringToArrayBuffer("fileFormatVersion: 2\nguid: " + stringToGUID(getFileNameWithoutExtension(relativePath)) + "\nScriptedImporter:\n  internalIDToNameTable: []\n  externalObjects: {}\n  serializedVersion: 2\n  userData: \n  assetBundleName: \n  assetBundleVariant: \n  script: {fileID: 11500000, guid: a57477913897c46af95d590f580878bd, type: 3}\n  svgType: 1\n  texturedSpriteMeshType: 0\n  svgPixelsPerUnit: 100\n  gradientResolution: 64\n  alignment: 0\n  customPivot: {x: 0, y: 0}\n  generatePhysicsShape: 0\n  viewportOptions: 0\n  preserveViewport: 0\n  advancedMode: 0\n  predefinedResolutionIndex: 2\n  targetResolution: 720\n  resolutionMultiplier: 2\n  stepDistance: 10\n  samplingStepDistance: 100\n  maxCordDeviationEnabled: 0\n  maxCordDeviation: 1\n  maxTangentAngleEnabled: 0\n  maxTangentAngle: 5\n  keepTextureAspectRatio: 1\n  textureSize: 1024\n  textureWidth: 256\n  textureHeight: 256\n  wrapMode: 0\n  filterMode: 1\n  sampleCount: 2\n  preserveSVGImageAspect: 0\n  useSVGPixelsPerUnit: 1\n  spriteData:\n    TessellationDetail: 0\n    SpriteRect:\n      name: bcf454acf82e4504149f7ffe07081dbc\n      originalName: \n      pivot: {x: 5.1263156, y: 5.12}\n      alignment: 0\n      border: {x: 0, y: 0, z: 0, w: 0}\n      rect:\n        serializedVersion: 2\n        x: 0\n        y: 0\n        width: 95\n        height: 100\n      spriteID: d058db1872292fa4489e7f183a13187e\n    PhysicsOutlines: []\n"),
                                    };
                                    images.push(imageMeta);
                                })*/
                            );
                        }
                    }
                });

                Promise.all(imagePromises).then(function () {
                    callback(images);
                });
            })
            .catch(function (error) {
                console.error('Error extracting images from zip:', error);
            });
    };

    reader.readAsArrayBuffer(zipFile);
}

async function extractImagesFromZippedFileV2(fileInput, callback) {
    var images = [];

    var zipFile = fileInput.files[0];

    var reader = new FileReader();

    reader.onload = async function (e) {
        var zipData = e.target.result;

        try {
            var zip = await JSZip.loadAsync(zipData);

            var imagePromises = [];

            zip.forEach(async function (relativePath, file) {
                // ... (rest of the code remains unchanged)
                if (getFileExtension(relativePath) == "json") {
                    await file.async('text').then(function (jsonData) {
                        scratchProjectJSON = jsonData;
                    })
                }
                if (getFileExtension(relativePath) == "svg") {
                    var svgData = await file.async('text');
                    var pngData = imagePromises.push(await convertSvgToPngV3(svgData));
                    /*var image = {
                        name: "Template Scratch/Assets/Costumes/" + getFileNameWithoutExtension(relativePath) + ".png",
                        data: pngData,
                    };
                    console.warn("hey wtf");
                    images.push(image);*/
                    //console.warn("svg data : " + svgData);
                    /*try {
                        var pngBlob = await convertSvgToPngV2(svgData);
                        console.warn("png blob : " + pngBlob);
                        var image = {
                            name: "Template Scratch/Assets/Costumes/" + getFileNameWithoutExtension(relativePath) + ".png",
                            data: pngBlob,
                        };
                        images.push(image);


                        // ... (rest of the code remains unchanged)
                    } catch (error) {
                        console.error('Error converting SVG to PNG:', error);
                    }*/
                    /*var pngBlobPromise = new Promise((resolve, reject) => {
                        convertSvgToPngV2(svgData, (error, pngBlob) => {
                            if (error) {
                                console.error('Error converting SVG to PNG:', error);
                                reject(error);
                            } else {
                                console.warn("png blob : " + pngBlob);
                                var image = {
                                    name: "Template Scratch/Assets/Costumes/" + getFileNameWithoutExtension(relativePath) + ".png",
                                    data: pngBlob,
                                };
                                images.push(image);
                                resolve(pngBlob);
                            }
                        });
                    });
                    imagePromises.push(pngBlobPromise);*/
                }
            });
            /*console.log(imagePromises);
            await Promise.all(imagePromises);
            console.log(imagePromises);
            console.warn("Callback sent !");*/
            var pngBlobs = await Promise.all(imagePromises);
            console.warn(imagePromises);
            // Now all image conversions are complete, add the images to the images array
            zip.forEach(function (relativePath, file) {
                // ... (rest of the code remains unchanged)

                if (getFileExtension(relativePath) == "svg") {
                    var pngBlob = pngBlobs[0];
                    pngBlobs.shift();
                    console.warn(pngBlob);
                    var image = {
                        name: "Template Scratch/Assets/Costumes/" + getFileNameWithoutExtension(relativePath) + ".png",
                        data: pngBlob,
                    };
                    images.push(image);

                    // ... (rest of the code remains unchanged)
                }
            });
            callback(images);
        } catch (error) {
            console.error('Error extracting images from zip:', error);
        }
    };

    reader.readAsArrayBuffer(zipFile);
}


const b64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
}
