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
            link.download = `"Zipped ${projectName}.zip"`

            // Simulate a click event to trigger the download
            link.click();

            // Clean up the URL object
            URL.revokeObjectURL(link.href);

            endTime = performance.now();
            const timeTaken = (endTime - startTime) / 1000;
            console.log("File size : " + estimatedProjectSize / 1024 + "Kb.");
            console.log("Time taken : " + timeTaken + "s.");

            document.getElementById("time").innerHTML = "Time taken : " + timeTaken.toFixed(1) + "s.";
            window.dispatchEvent(new CustomEvent("conversion_completed"));
        });
}

window.addEventListener('conversion_completed', event => {
    SetStatus("Conversion successfully completed !");
});

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

async function extractFilesFromScratchProject(fileInput) {
    var files = [];

    var zipFile = fileInput;

    var reader = new FileReader();

    return new Promise((resolve, reject) => {
    reader.onload = async function (e) {
        var zipData = e.target.result;

        const unzippedData = await JSZip.loadAsync(zipData);

        estimatedWork += Object.keys(unzippedData.files).length;

        for (const [relativePath, file] of Object.entries(unzippedData.files)) {
            addProgress();
            if(file.dir){break;}
            const extension = getFileExtension(relativePath);
            switch (extension) {
                case "png":
                    file.async('base64').then(function (base64) {
                        var image = {
                            name: "Template Scratch/Assets/Costumes/" + relativePath,
                            data: b64toBlob(base64),
                        };
                        files.push(image);
                        let costumeInfo = getCostumeInfo(getFileNameWithoutExtension(relativePath));
                        let alignment = 0; //9 for custom; 0 for center

                        //PNG meta
                        var imageMeta = {
                            name: "Template Scratch/Assets/Costumes/" + relativePath + ".meta",
                            data: stringToArrayBuffer("fileFormatVersion: 2\nguid: " + stringToGUID(getFileNameWithoutExtension(relativePath)) + "\nTextureImporter:\n  internalIDToNameTable: []\n  externalObjects: {}\n  serializedVersion: 12\n  mipmaps:\n    mipMapMode: 0\n    enableMipMap: 0\n    sRGBTexture: 1\n    linearTexture: 0\n    fadeOut: 0\n    borderMipMap: 0\n    mipMapsPreserveCoverage: 0\n    alphaTestReferenceValue: 0.5\n    mipMapFadeDistanceStart: 1\n    mipMapFadeDistanceEnd: 3\n  bumpmap:\n    convertToNormalMap: 0\n    externalNormalMap: 0\n    heightScale: 0.25\n    normalMapFilter: 0\n    flipGreenChannel: 0\n  isReadable: 0\n  streamingMipmaps: 0\n  streamingMipmapsPriority: 0\n  vTOnly: 0\n  ignoreMipmapLimit: 0\n  grayScaleToAlpha: 0\n  generateCubemap: 6\n  cubemapConvolution: 0\n  seamlessCubemap: 0\n  textureFormat: 1\n  maxTextureSize: 2048\n  textureSettings:\n    serializedVersion: 2\n    filterMode: 1\n    aniso: 1\n    mipBias: 0\n    wrapU: 1\n    wrapV: 1\n    wrapW: 1\n  nPOTScale: 0\n  lightmap: 0\n  compressionQuality: 50\n  spriteMode: 1\n  spriteExtrude: 1\n  spriteMeshType: 1\n  alignment: " + alignment + "\n  spritePivot: {x: " + costumeInfo[0] + ", y: " + costumeInfo[1] + "}\n  spritePixelsToUnits: " + costumeInfo[2] + "\n  spriteBorder: {x: 0, y: 0, z: 0, w: 0}\n  spriteGenerateFallbackPhysicsShape: 1\n  alphaUsage: 1\n  alphaIsTransparency: 1\n  spriteTessellationDetail: -1\n  textureType: 8\n  textureShape: 1\n  singleChannelComponent: 0\n  flipbookRows: 1\n  flipbookColumns: 1\n  maxTextureSizeSet: 0\n  compressionQualitySet: 0\n  textureFormatSet: 0\n  ignorePngGamma: 0\n  applyGammaDecoding: 0\n  swizzle: 50462976\n  cookieLightType: 0\n  platformSettings:\n  - serializedVersion: 3\n    buildTarget: DefaultTexturePlatform\n    maxTextureSize: 2048\n    resizeAlgorithm: 0\n    textureFormat: -1\n    textureCompression: 1\n    compressionQuality: 50\n    crunchedCompression: 0\n    allowsAlphaSplitting: 0\n    overridden: 0\n    androidETC2FallbackOverride: 0\n    forceMaximumCompressionQuality_BC6H_BC7: 0\n  - serializedVersion: 3\n    buildTarget: Standalone\n    maxTextureSize: 2048\n    resizeAlgorithm: 0\n    textureFormat: -1\n    textureCompression: 1\n    compressionQuality: 50\n    crunchedCompression: 0\n    allowsAlphaSplitting: 0\n    overridden: 0\n    androidETC2FallbackOverride: 0\n    forceMaximumCompressionQuality_BC6H_BC7: 0\n  - serializedVersion: 3\n    buildTarget: Server\n    maxTextureSize: 2048\n    resizeAlgorithm: 0\n    textureFormat: -1\n    textureCompression: 1\n    compressionQuality: 50\n    crunchedCompression: 0\n    allowsAlphaSplitting: 0\n    overridden: 0\n    androidETC2FallbackOverride: 0\n    forceMaximumCompressionQuality_BC6H_BC7: 0\n  - serializedVersion: 3\n    buildTarget: Android\n    maxTextureSize: 2048\n    resizeAlgorithm: 0\n    textureFormat: -1\n    textureCompression: 1\n    compressionQuality: 50\n    crunchedCompression: 0\n    allowsAlphaSplitting: 0\n    overridden: 0\n    androidETC2FallbackOverride: 0\n    forceMaximumCompressionQuality_BC6H_BC7: 0\n  - serializedVersion: 3\n    buildTarget: WebGL\n    maxTextureSize: 2048\n    resizeAlgorithm: 0\n    textureFormat: -1\n    textureCompression: 1\n    compressionQuality: 50\n    crunchedCompression: 0\n    allowsAlphaSplitting: 0\n    overridden: 0\n    androidETC2FallbackOverride: 0\n    forceMaximumCompressionQuality_BC6H_BC7: 0\n  spriteSheet:\n    serializedVersion: 2\n    sprites: []\n    outline: []\n    physicsShape: []\n    bones: []\n    spriteID: 5e97eb03825dee720800000000000000\n    internalID: 0\n    vertices: []\n    indices: \n    edges: []\n    weights: []\n    secondaryTextures: []\n    nameFileIdTable: {}\n  mipmapLimitGroupName: \n  pSDRemoveMatte: 0\n  userData: \n  assetBundleName: \n  assetBundleVariant:\n"),
                        };
                        files.push(imageMeta);
                    })
                    break;
                /*case "wav":
                    file.async('base64').then(function (base64) {
                        var sound = {
                            name: "Template Scratch/Assets/Sounds/" + relativePath,
                            data: b64toBlob(base64),
                        };
                        files.push(sound);
                        //PNG meta
                        var soundMeta = {
                            name: "Template Scratch/Assets/Costumes/" + relativePath + ".meta",
                            data: stringToArrayBuffer("fileFormatVersion: 2\nguid: " + stringToGUID(getFileNameWithoutExtension(relativePath)) + "\nTextureImporter:\n  internalIDToNameTable: []\n  externalObjects: {}\n  serializedVersion: 12\n  mipmaps:\n    mipMapMode: 0\n    enableMipMap: 0\n    sRGBTexture: 1\n    linearTexture: 0\n    fadeOut: 0\n    borderMipMap: 0\n    mipMapsPreserveCoverage: 0\n    alphaTestReferenceValue: 0.5\n    mipMapFadeDistanceStart: 1\n    mipMapFadeDistanceEnd: 3\n  bumpmap:\n    convertToNormalMap: 0\n    externalNormalMap: 0\n    heightScale: 0.25\n    normalMapFilter: 0\n    flipGreenChannel: 0\n  isReadable: 0\n  streamingMipmaps: 0\n  streamingMipmapsPriority: 0\n  vTOnly: 0\n  ignoreMipmapLimit: 0\n  grayScaleToAlpha: 0\n  generateCubemap: 6\n  cubemapConvolution: 0\n  seamlessCubemap: 0\n  textureFormat: 1\n  maxTextureSize: 2048\n  textureSettings:\n    serializedVersion: 2\n    filterMode: 1\n    aniso: 1\n    mipBias: 0\n    wrapU: 1\n    wrapV: 1\n    wrapW: 1\n  nPOTScale: 0\n  lightmap: 0\n  compressionQuality: 50\n  spriteMode: 1\n  spriteExtrude: 1\n  spriteMeshType: 1\n  alignment: " + alignment + "\n  spritePivot: {x: " + costumeInfo[0] + ", y: " + costumeInfo[1] + "}\n  spritePixelsToUnits: " + costumeInfo[2] + "\n  spriteBorder: {x: 0, y: 0, z: 0, w: 0}\n  spriteGenerateFallbackPhysicsShape: 1\n  alphaUsage: 1\n  alphaIsTransparency: 1\n  spriteTessellationDetail: -1\n  textureType: 8\n  textureShape: 1\n  singleChannelComponent: 0\n  flipbookRows: 1\n  flipbookColumns: 1\n  maxTextureSizeSet: 0\n  compressionQualitySet: 0\n  textureFormatSet: 0\n  ignorePngGamma: 0\n  applyGammaDecoding: 0\n  swizzle: 50462976\n  cookieLightType: 0\n  platformSettings:\n  - serializedVersion: 3\n    buildTarget: DefaultTexturePlatform\n    maxTextureSize: 2048\n    resizeAlgorithm: 0\n    textureFormat: -1\n    textureCompression: 1\n    compressionQuality: 50\n    crunchedCompression: 0\n    allowsAlphaSplitting: 0\n    overridden: 0\n    androidETC2FallbackOverride: 0\n    forceMaximumCompressionQuality_BC6H_BC7: 0\n  - serializedVersion: 3\n    buildTarget: Standalone\n    maxTextureSize: 2048\n    resizeAlgorithm: 0\n    textureFormat: -1\n    textureCompression: 1\n    compressionQuality: 50\n    crunchedCompression: 0\n    allowsAlphaSplitting: 0\n    overridden: 0\n    androidETC2FallbackOverride: 0\n    forceMaximumCompressionQuality_BC6H_BC7: 0\n  - serializedVersion: 3\n    buildTarget: Server\n    maxTextureSize: 2048\n    resizeAlgorithm: 0\n    textureFormat: -1\n    textureCompression: 1\n    compressionQuality: 50\n    crunchedCompression: 0\n    allowsAlphaSplitting: 0\n    overridden: 0\n    androidETC2FallbackOverride: 0\n    forceMaximumCompressionQuality_BC6H_BC7: 0\n  - serializedVersion: 3\n    buildTarget: Android\n    maxTextureSize: 2048\n    resizeAlgorithm: 0\n    textureFormat: -1\n    textureCompression: 1\n    compressionQuality: 50\n    crunchedCompression: 0\n    allowsAlphaSplitting: 0\n    overridden: 0\n    androidETC2FallbackOverride: 0\n    forceMaximumCompressionQuality_BC6H_BC7: 0\n  - serializedVersion: 3\n    buildTarget: WebGL\n    maxTextureSize: 2048\n    resizeAlgorithm: 0\n    textureFormat: -1\n    textureCompression: 1\n    compressionQuality: 50\n    crunchedCompression: 0\n    allowsAlphaSplitting: 0\n    overridden: 0\n    androidETC2FallbackOverride: 0\n    forceMaximumCompressionQuality_BC6H_BC7: 0\n  spriteSheet:\n    serializedVersion: 2\n    sprites: []\n    outline: []\n    physicsShape: []\n    bones: []\n    spriteID: 5e97eb03825dee720800000000000000\n    internalID: 0\n    vertices: []\n    indices: \n    edges: []\n    weights: []\n    secondaryTextures: []\n    nameFileIdTable: {}\n  mipmapLimitGroupName: \n  pSDRemoveMatte: 0\n  userData: \n  assetBundleName: \n  assetBundleVariant:\n"),
                        };
                        files.push(soundMeta);
                    })
                    break;*/
                case "svg":
                    await file.async('text').then(async function(svgString){ 
                        const convertedImage = await convertSvgToPng(svgString);
                        var image = {
                            name: "Template Scratch/Assets/Costumes/" + getFileNameWithoutExtension(relativePath) + '.png',
                            data: convertedImage,
                        };
                        files.push(image);
                        let costumeInfo = getCostumeInfo(getFileNameWithoutExtension(relativePath));
                        let alignment = 0; //9 for custom; 0 for center

                        //PNG meta
                        var imageMeta = {
                            name: "Template Scratch/Assets/Costumes/" + getFileNameWithoutExtension(relativePath) + '.png' + ".meta",
                            data: stringToArrayBuffer("fileFormatVersion: 2\nguid: " + stringToGUID(getFileNameWithoutExtension(relativePath)) + "\nTextureImporter:\n  internalIDToNameTable: []\n  externalObjects: {}\n  serializedVersion: 12\n  mipmaps:\n    mipMapMode: 0\n    enableMipMap: 0\n    sRGBTexture: 1\n    linearTexture: 0\n    fadeOut: 0\n    borderMipMap: 0\n    mipMapsPreserveCoverage: 0\n    alphaTestReferenceValue: 0.5\n    mipMapFadeDistanceStart: 1\n    mipMapFadeDistanceEnd: 3\n  bumpmap:\n    convertToNormalMap: 0\n    externalNormalMap: 0\n    heightScale: 0.25\n    normalMapFilter: 0\n    flipGreenChannel: 0\n  isReadable: 0\n  streamingMipmaps: 0\n  streamingMipmapsPriority: 0\n  vTOnly: 0\n  ignoreMipmapLimit: 0\n  grayScaleToAlpha: 0\n  generateCubemap: 6\n  cubemapConvolution: 0\n  seamlessCubemap: 0\n  textureFormat: 1\n  maxTextureSize: 2048\n  textureSettings:\n    serializedVersion: 2\n    filterMode: 1\n    aniso: 1\n    mipBias: 0\n    wrapU: 1\n    wrapV: 1\n    wrapW: 1\n  nPOTScale: 0\n  lightmap: 0\n  compressionQuality: 50\n  spriteMode: 1\n  spriteExtrude: 1\n  spriteMeshType: 1\n  alignment: " + alignment + "\n  spritePivot: {x: " + costumeInfo[0] + ", y: " + costumeInfo[1] + "}\n  spritePixelsToUnits: " + costumeInfo[2] + "\n  spriteBorder: {x: 0, y: 0, z: 0, w: 0}\n  spriteGenerateFallbackPhysicsShape: 1\n  alphaUsage: 1\n  alphaIsTransparency: 1\n  spriteTessellationDetail: -1\n  textureType: 8\n  textureShape: 1\n  singleChannelComponent: 0\n  flipbookRows: 1\n  flipbookColumns: 1\n  maxTextureSizeSet: 0\n  compressionQualitySet: 0\n  textureFormatSet: 0\n  ignorePngGamma: 0\n  applyGammaDecoding: 0\n  swizzle: 50462976\n  cookieLightType: 0\n  platformSettings:\n  - serializedVersion: 3\n    buildTarget: DefaultTexturePlatform\n    maxTextureSize: 2048\n    resizeAlgorithm: 0\n    textureFormat: -1\n    textureCompression: 1\n    compressionQuality: 50\n    crunchedCompression: 0\n    allowsAlphaSplitting: 0\n    overridden: 0\n    androidETC2FallbackOverride: 0\n    forceMaximumCompressionQuality_BC6H_BC7: 0\n  - serializedVersion: 3\n    buildTarget: Standalone\n    maxTextureSize: 2048\n    resizeAlgorithm: 0\n    textureFormat: -1\n    textureCompression: 1\n    compressionQuality: 50\n    crunchedCompression: 0\n    allowsAlphaSplitting: 0\n    overridden: 0\n    androidETC2FallbackOverride: 0\n    forceMaximumCompressionQuality_BC6H_BC7: 0\n  - serializedVersion: 3\n    buildTarget: Server\n    maxTextureSize: 2048\n    resizeAlgorithm: 0\n    textureFormat: -1\n    textureCompression: 1\n    compressionQuality: 50\n    crunchedCompression: 0\n    allowsAlphaSplitting: 0\n    overridden: 0\n    androidETC2FallbackOverride: 0\n    forceMaximumCompressionQuality_BC6H_BC7: 0\n  - serializedVersion: 3\n    buildTarget: Android\n    maxTextureSize: 2048\n    resizeAlgorithm: 0\n    textureFormat: -1\n    textureCompression: 1\n    compressionQuality: 50\n    crunchedCompression: 0\n    allowsAlphaSplitting: 0\n    overridden: 0\n    androidETC2FallbackOverride: 0\n    forceMaximumCompressionQuality_BC6H_BC7: 0\n  - serializedVersion: 3\n    buildTarget: WebGL\n    maxTextureSize: 2048\n    resizeAlgorithm: 0\n    textureFormat: -1\n    textureCompression: 1\n    compressionQuality: 50\n    crunchedCompression: 0\n    allowsAlphaSplitting: 0\n    overridden: 0\n    androidETC2FallbackOverride: 0\n    forceMaximumCompressionQuality_BC6H_BC7: 0\n  spriteSheet:\n    serializedVersion: 2\n    sprites: []\n    outline: []\n    physicsShape: []\n    bones: []\n    spriteID: 5e97eb03825dee720800000000000000\n    internalID: 0\n    vertices: []\n    indices: \n    edges: []\n    weights: []\n    secondaryTextures: []\n    nameFileIdTable: {}\n  mipmapLimitGroupName: \n  pSDRemoveMatte: 0\n  userData: \n  assetBundleName: \n  assetBundleVariant:\n"),
                        };
                        files.push(imageMeta);
                    })
                    break;
                case "json":
                    await file.async('text').then(async function(data){
                        await parseScratchJSON(data);
                    });
                    break;
                default:
                    break;
            }
            //files.push(file);
        }

        resolve(files);
    }

    reader.readAsArrayBuffer(zipFile);
    });
}

async function parseScratchJSON(data){
    scratchProject = await JSON.parse(data);
    addProgress();
}

async function wait(second){
    return new Promise(resolve => {
        setTimeout(function() {
            console.log("Waited");
            resolve();
        }, second * 1000);
    });
}

function getCostumeInfo(costumeID){
    for (let spriteIdx = 0; spriteIdx < scratchProject.targets.length; spriteIdx++) {
        const sprite = scratchProject.targets[spriteIdx];
        if(!sprite.isStage){
            for (let costumeIdx = 0; costumeIdx < sprite.costumes.length; costumeIdx++) {
                const costume = sprite.costumes[costumeIdx];
                let assetID = costume.assetId;
                //console.error("assetID : " + assetID + ", costumeID : " + costumeID);
                if(assetID == costumeID){
                    let x = costume.rotationCenterX - 240 / 240;
                    let y = costume.rotationCenterY - 180 / 180;
                    let res = 400 / costume.bitmapResolution;
                    return [x, y, res];
                }
            }
        }
    }
    return [0.5, 0.5, 400];
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
