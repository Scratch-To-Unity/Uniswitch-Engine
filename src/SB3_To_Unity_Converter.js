let scratchProjectJSON = "";
let unityGameScene =  null;
let scratchProject =  null;
let blockList;
let blockDic;
let globalVariables = [];
let globalLists =     [];
let localVariables =  [];
let localLists =      [];
let usedIdentifiers = [];
let workspace =       [];

let warp = false;
let loopIdx = 0;
let currentFunctionName;
let projectName = "project";

let progress = 0;
let estimatedWork = 0;

//////////////////////////////////////////////////////////////////////////////////
//paths
const templatePath = "Templates/Template Scratch v13.zip";
const blockLibPath = "blockList.json";

//HTML linking
const sb3Doc = document.getElementById('fileInput');
//const fact = document.getElementById('fact');

//conversion parameter
const playerUsername = "player";
const maxListLenght = 1000;
const useCommunityBlocks = false;
const customTranslations = [];
const formatCode = true;

//utilities
const delay = "yield return new WaitForEndOfFrame();";
const reservedKeywords = ["int", "float", "for", "ITERATION", "string", "double", "var", "default", "event", "operator", "false", "true", "class", "return", "timer", "TIMES"];
//////////////////////////////////////////////////////////////////////////////////


//https://www.notion.so/563bff1d0df54d9194eafd756b1ea68d?v=69b39a8c83e0455ab946972e61ad28a1


//TO DO:
//next template : v14
//the stage's renderer is causing scene errors sometimes                                                Whyy
//if standardized name is null, replace it by a random name stored in a linked-list
//create a function getKey that returns a boolean, and one that returns 0 or 1                          Bruh
//Numéros dans les noms de variable                                                                     Doing
//Add screen edge detection (relative to screen size) :/
//don't write int, only floats in the code plss
//clones don't spawn with the isClone flag set to true :O    -> Instantiate the GameObject in a parent for clones
//touching so sloow ;(

//Teamplate :
//change penwidth en float
//add penup and pendown



//----------------------------------------------------MAIN--------------------------------------------------------

async function convert() {
    status("Started Converting...");

    usedIdentifiers = [];

    progress = 0;
    estimatedWork = 0;
    estimatedWork += 1; //for the getJSONData
    estimatedWork += 1; //for the JSON.Parse()
    estimatedWork += 1; //for the zipping
    estimatedWork += 100; //for the zipping

    let fileInput = document.getElementById('fileInput').files[0];
    let projectID = document.getElementById('URLInput').value;
    if (projectID != "" && projectID.length > 5) {

        //API from https://github.com/forkphorus/sb-downloader

        const options = {
            // May be called periodically with progress updates.
            onProgress: (type, loaded, total) => {
                // type is 'metadata', 'project', 'assets', or 'compress'
                console.log(type, loaded / total);
            }
        };
        const project = await SBDL.downloadProjectFromID(projectID, options);

        const type = project.type;
        // arrayBuffer is an ArrayBuffer of the compressed project data in the format given by type.
        const arrayBuffer = project.arrayBuffer;

        const title = project.title;

        if (type != "sb3") {
            throw new Error("Not a sb3 project. Consider converting this project into sb3.");
        }

        const projectBlob = new Blob([arrayBuffer]);
        fileInput = projectBlob;
        projectName = title;
    }
    console.log(fileInput);

    //Importing template
    try {
        status("Importing template...");
        const fileArray = await unzipFromURL(templatePath);  //Action 1
        workspace = fileArray;


    } catch (error) {
        console.error(error);
    }
    const url = blockLibPath;
    //Get BlockLib
    getJSONData(url)  //Action 2
        .then(async jsonData => {
            addProgress();
            blockDic = jsonData;
            console.log(jsonData);
            document.getElementById('fact').innerHTML = "We currently support " + Object.keys(blockDic.blocks).length + " scratch blocks !";
            status("Extracting images...");
            //Get images, sounds, and project's JSON
            await extractImagesFromZippedFile(fileInput, function (images) { //Action 3
                scratchProject = JSON.parse(scratchProjectJSON); //Action 4
                addProgress();
                workspace = workspace.concat(images);

                unityGameScene = arrayBufferToString(workspace.find(obj => obj.name === "Template Scratch/Assets/Scenes/game.unity").data);

                status("Generating unity scene...");
                
                handleSprites(scratchProject);  //Action 5
                workspace.find(obj => obj.name === "Template Scratch/Assets/Scenes/game.unity").data = stringToArrayBuffer(unityGameScene);

                status("Zipping unity folder...");
                console.log("progress until here : " + progress);
                console.log(workspace);
                estimatedWork += workspace.length;
                zipAndDownloadFiles(workspace);  //Action 6

            });
        });
}

function getJSONData(url) {
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error("Error: Could not retrieve JSON data from the URL.");
            }
            return response.json();
        })
        .catch(error => {
            console.error(error);
        });
}

function status(string) {
    document.getElementById('status').innerHTML = string;
    console.log(string);
}

//----------------------------------------------------UNITY OBJECTS PART-----------------------------------------------

function handleSprites(scratchProject) {
    var sprites = scratchProject.targets;
    estimatedWork += Object.keys(sprites).length;
    sprites.forEach(sprite => handleSprite(sprite));
}

function handleSprite(sprite) {
    addProgress();
    console.log("Handling sprite : " + sprite.name)
    //fileID : 21300000 for bitmap
    //fileID : 3286163911610860551 for SVG
    var fileID = "21300000";
    if (sprite.costumes[sprite.currentCostume].dataFormat == "svg") {
        fileID = "3286163911610860551";
    }
    addGameObject(sprite.name, stringToGUID(sprite.costumes[sprite.currentCostume].assetId), sprite.x, sprite.y, (sprite.visible * 1).toString(), stringToGUID(sprite.name + "Scr"), sprite.layerOrder, sprite.size, sprite.direction, fileID, sprite.costumes);
    addScript(sprite);
}

function addGameObject(spriteName, costumeGUID, px, py, isShown, scriptGUID, layerOrder, scale, direction, fileID, costumes) {
    if (usedIdentifiers.includes(stringToNumber(spriteName))) {
        status("Duplicate identifiers : " + stringToNumber(spriteName) + ". Please change the sprite name.")
        throw new Error("Duplicate identifiers : " + stringToNumber(spriteName) + ". Please change the sprite name.");
    }
    var sortingLayer = "0";
    console.log("Adding GameObject : " + spriteName)
    if (spriteName == "Stage") {
        px = 0;
        py = 0;
        isShown = "1";
        sortingLayer = "-3";
        scale = 100;
        direction = 90;
        
    }

    direction -= 90;

    //adding GameObject
    unityGameScene += "\n--- !u!1 &" + stringToNumber(spriteName) + "\nGameObject:\n  m_ObjectHideFlags: 0\n  m_CorrespondingSourceObject: {fileID: 0}\n  m_PrefabInstance: {fileID: 0}\n  m_PrefabAsset: {fileID: 0}\n  serializedVersion: 6\n  m_Component:\n  - component: {fileID: " + stringToNumber(spriteName + "Script") + "}\n  - component: {fileID: " + stringToNumber(spriteName + "SR") + "}\n  - component: {fileID: " + stringToNumber(spriteName + "Tr") + "}\n  m_Layer: 0\n  m_Name: " + spriteName + "\n  m_TagString: Untagged\n  m_Icon: {fileID: 0}\n  m_NavMeshLayer: 0\n  m_StaticEditorFlags: 0\n  m_IsActive: 1";
    //adding Transform
    unityGameScene += "\n--- !u!4 &" + stringToNumber(spriteName + "Tr") + "\nTransform:\n  m_ObjectHideFlags: 0\n  m_CorrespondingSourceObject: { fileID: 0 }\n  m_PrefabInstance: { fileID: 0 }\n  m_PrefabAsset: { fileID: 0 }\n  m_GameObject: { fileID: " + stringToNumber(spriteName) + " }\n  m_LocalRotation: { x: 0, y: 0, z: " + direction + ", w: 1 }\n  m_LocalPosition: { x: " + px + ", y: " + py + ", z: 0 }\n  m_LocalScale: { x: " + scale + ", y: " + scale + ", z: " + scale + " }\n  m_ConstrainProportionsScale: 0\n  m_Children: []\n  m_Father: { fileID: 0 }\n  m_RootOrder: 0\n  m_LocalEulerAnglesHint: { x: 0, y: 0, z: 0 }";
    //adding SpriteRenderer
    unityGameScene += "\n--- !u!212 &" + stringToNumber(spriteName + "SR") + "\nSpriteRenderer:\n  m_ObjectHideFlags: 0\n  m_CorrespondingSourceObject: {fileID: 0}\n  m_PrefabInstance: {fileID: 0}\n  m_PrefabAsset: {fileID: 0}\n  m_GameObject: {fileID: " + stringToNumber(spriteName) + "}\n  m_Enabled: " + isShown + "\n  m_CastShadows: 0\n  m_ReceiveShadows: 0\n  m_DynamicOccludee: 1\n  m_StaticShadowCaster: 0\n  m_MotionVectors: 1\n  m_LightProbeUsage: 1\n  m_ReflectionProbeUsage: 1\n  m_RayTracingMode: 0\n  m_RayTraceProcedural: 0\n  m_RenderingLayerMask: 1\n  m_RendererPriority: 0\n  m_Materials:\n  - {fileID: 10754, guid: 0000000000000000f000000000000000, type: 0}\n  m_StaticBatchInfo:\n    firstSubMesh: 0\n    subMeshCount: 0\n  m_StaticBatchRoot: {fileID: 0}\n  m_ProbeAnchor: {fileID: 0}\n  m_LightProbeVolumeOverride: {fileID: 0}\n  m_ScaleInLightmap: 1\n  m_ReceiveGI: 1\n  m_PreserveUVs: 0\n  m_IgnoreNormalsForChartDetection: 0\n  m_ImportantGI: 0\n  m_StitchLightmapSeams: 1\n  m_SelectedEditorRenderState: 0\n  m_MinimumChartSize: 4\n  m_AutoUVMaxDistance: 0.5\n  m_AutoUVMaxAngle: 89\n  m_LightmapParameters: {fileID: 0}\n  m_SortingLayerID: 0\n  m_SortingLayer: " + sortingLayer + "\n  m_SortingOrder: " + layerOrder + "\n  m_Sprite: {fileID: " + fileID + ", guid: " + costumeGUID + ", type: 3}\n  m_Color: {r: 1, g: 1, b: 1, a: 1}\n  m_FlipX: 0\n  m_FlipY: 0\n  m_DrawMode: 0\n  m_Size: {x: 1.26, y: 1.5}\n  m_AdaptiveModeThreshold: 0.5\n  m_SpriteTileMode: 0\n  m_WasSpriteAssigned: 1\n  m_MaskInteraction: 0\n  m_SpriteSortPoint: 0";
    //adding Script
    unityGameScene += "\n--- !u!114 &" + stringToNumber(spriteName + "Script") + "\nMonoBehaviour:\n  m_ObjectHideFlags: 0\n  m_CorrespondingSourceObject: {fileID: 0}\n  m_PrefabInstance: {fileID: 0}\n  m_PrefabAsset: {fileID: 0}\n  m_GameObject: {fileID: " + stringToNumber(spriteName) + "}\n  m_Enabled: 1\n  m_EditorHideFlags: 0\n  m_Script: {fileID: 11500000, guid: " + scriptGUID + ", type: 3}\n  m_Name: \n  m_EditorClassIdentifier:\n";
    //adding costume list
    unityGameScene += "  costumes:";
    costumes.forEach((costume, index) => {
        unityGameScene += "\n  - name: " + costume.name;
        var fileID = "21300000";
        if (costume.dataFormat == "svg") {
            fileID = "3286163911610860551";
        }
        unityGameScene += "\n    sprite: {fileID: " + fileID + ", guid: " + stringToGUID(costume.assetId) + ", type: 3}";
        unityGameScene += "\n    index: " + index;
    });
    usedIdentifiers.push(stringToNumber(spriteName));
}

//----------------------------------------------------SCRIPTING PART-----------------------------------------------

function addScript(sprite) {
    status("Adding script for : " + sprite.name);

    blockList = sprite.blocks;
    warp = false;

    var code = "";
    var scriptName = "Template Scratch/Assets/Scripts/" + standardizeName(sprite.name) + "Script.cs";

    code += "using System;";
    code += "using System.Collections;";
    code += "using System.Collections.Generic;";
    code += "using UnityEngine;";
    code += "\n";
    code += "public class ";
    code += standardizeName(sprite.name) + "Script";
    code += " : ScratchLib ";
    code += "{";
    code += "//Created automatically by Scratch to Unity Converter;"
    code += "//Made by @scratchtomv;"
    code += "//Contact me here : https://scratch.mit.edu/users/scratchtomv/#comments;"
    code += "//You are free to fix errors;"

    //adding variables at top for sprites, variable types for the Stage
    if (!sprite.isStage) {
        code += addVariables(sprite);
    } else {
        var variables = Object.entries(sprite.variables);
        variables.forEach(([property, value]) => {
            var name = standardizeName(value[0]);
            var content = value[1];
            var type = typeof (content)

            if (sprite.isStage) {
                globalVariables.push({ name, type });
            }

        });
        var lists = Object.entries(sprite.lists);
        lists.forEach(([property, value]) => {
            var name = standardizeName(value[0]);
            var content = value[1];
            var type = "list";

            if (sprite.isStage) {
                globalLists.push(name);
            }

        });
    }

    if (sprite.isStage) {
        code += 'private void Awake(){spriteRenderer.sortingLayerName = "Stage";}';
    }

    
    //adding all the "when flag cliked" in start
    var startBlocks = [];
    code += "private void Start(){if(isClone){";
    for (let block in blockList) {
        if (blockList[block].topLevel == true) {
            if (blockList[block].opcode == "control_start_as_clone") {
                startBlocks.push(block);
                var functionName = "Start" + removeNonLetters(block);
                code += "StartCoroutine(" + functionName + "());"
            }

        }
    }
    code += "} else {";
    for (let block in blockList) {
        if (blockList[block].topLevel == true) {
            if (blockList[block].opcode == "event_whenflagclicked") {
                startBlocks.push(block);
                var functionName = "Start" + removeNonLetters(block);
                code += "StartCoroutine(" + functionName + "());"
            }

        }
    }
    code += "}}";

    //adding all the start coroutines
    startBlocks.forEach(blockID => {
        var functionName = "Start" + removeNonLetters(blockID);
        currentFunctionName = functionName;
        code += "IEnumerator " + functionName + "(){yield return null;";
        code += addBlock(blockList[blockID].next);
        code += "}";
    });

    //adding custom blocks and events receivers
    for (let blockID in blockList) {
        var block = blockList[blockID]
        if (block.topLevel == true) {
            if (block.opcode == "procedures_definition") {
                var prototypeID = block.inputs.custom_block[1];
                var definitionName = blockList[prototypeID].mutation.proccode;

                warp = blockList[prototypeID].mutation.warp == "true";
                if (warp) {
                    code += "void Function";
                } else {
                    code += "IEnumerator Function";
                }

                var proceduresDefinition = standardizeName(definitionName.replace(/ %[sb]/g, ""));
                currentFunctionName = proceduresDefinition;
                proceduresDefinition += "(";
                var arguments = JSON.parse(blockList[prototypeID].mutation.argumentnames);
                for (var arg = 0; arg < arguments.length; arg++) {
                    proceduresDefinition += "object " + standardizeName(arguments[arg]);
                    if (arg != arguments.length - 1) {
                        proceduresDefinition += ", ";
                    }
                }
                proceduresDefinition += ")";

                code += proceduresDefinition;

                //Add arguments
                code += " {";
                if (!warp) {
                    code += "yield return null;";
                }
                code += addBlock(block.next);
                code += "}";
            }
            if (block.opcode == "event_whenbroadcastreceived") {

                code += addBlock(blockID);
            }
        }
    }

    //adding update function
    code += "private void Update() {";
    if (sprite.isStage) {
        code += "GlobalVariables.timer += Time.deltaTime;";
    }
    code += "}"

    //closing sprite's script class
    code += "}";

    //adding static class for global variables
    if (sprite.isStage) {
        code += "public static class GlobalVariables {";
        code += addVariables(sprite, "static ");
        code += "public static float timer;"
        code += 'public static string username = "' + playerUsername + '";';
        code += "public static void ResetTimer(){timer = 0;}"
        code += "}";
    }

    //formating and cleaning the code
    if (formatCode) {
        code = addNewlines(code);
    }

    //adding code to the file and metadata
    var file = {
        name: scriptName,
        data: stringToArrayBuffer(code)
    };
    var meta = {
        name: scriptName + ".meta",
        data: stringToArrayBuffer("fileFormatVersion: 2\nguid: " + stringToGUID(sprite.name + "Scr") + "\nMonoImporter:\n  externalObjects: {}\n  serializedVersion: 2\n  defaultReferences: []\n  executionOrder: 0\n  icon: {instanceID: 0}\n  userData: \n  assetBundleName: \n  assetBundleVariant:\n")
    };

    workspace.push(file);
    workspace.push(meta);

    console.log(code);
}

function addVariables(sprite, static = "") {
    var l = "\n";
    localVariables = [];
    //localLists = [];
    var variables = Object.entries(sprite.variables);
    variables.forEach(([property, value]) => {
        // property = variable ID
        // value [0] = variable name
        // value [1] = variable content
        if (!localVariables.find(variable => variable.name === standardizeName(value[0]))) {
            var name = standardizeName(value[0]);
            var content = value[1];
            var type = typeof (content)
            if (!sprite.isStage) {
                localVariables.push({ name, type });
            }
            l += "    public ";
            l += static;
            l += "object ";
            l += name;
            l += " = ";
            switch (type) {
                case "boolean":
                    l += content;
                    break;
                case "number":
                    l += content + "f";
                    break;
                case "string":
                    l += '"' + content + '"';
                    break;
            }
            l += ";";
        }
    });
    l += "\n";
    var lists = Object.entries(sprite.lists);
    lists.forEach(([property, value]) => {
        // property = list ID
        // value [0] = list name
        // value [1] = list content

        var name = standardizeName(value[0]);
        var content = value[1];
        if (sprite.isStage) {
            //globalVariables.push({ name, type });
        } else {
            //localLists.push({ name, type });
        }
        l += "\n    public ";
        l += static;
        l += "List<object> ";
        l += name;

        l += " = new List<object> ";
        if (value[1].length > maxListLenght) {
            status("List " + value[0] + " is longer than " + maxListLenght + " elements. The data wasn't imported.");
            l += "{}";
        } else {
            l += `{ ${content.map(item => typeof item === 'number' ? (Number.isInteger(item) ? item : item.toFixed(2) + 'f') : `"${item}"`).join(', ')}      }`;
        }
            l += ";";

    });
    return l;
}

function addBlock(blockID) {

    if (blockID == undefined || blockID == null || blockID == "") {
        return "";
    }

    console.log("Building block : " + blockID);

    var block = blockList[blockID];
    var l = "";

    var blockRef = blockDic.blocks[block.opcode];
    if (blockRef == null) {
        unknownBlock("block", "block");
        l += addBlock(block.next);
        return l;
    }

    if (block.opcode == "procedures_call") {
        var proceduresDefinition = standardizeName(block.mutation.proccode.replace(/ %[sb]/g, ""));
        if (block.mutation.warp == "true") {
            l += "Function";
            l += proceduresDefinition;
        } else {
            if (!warp) {
                l += "yield return ";
            }
            l += "StartCoroutine(Function";
            l += proceduresDefinition;
        }
    }
    if (block.opcode == "control_repeat" && block.inputs.SUBSTACK != undefined) {
        loopIdx++;
        var times = "TIMES" + loopIdx;
        var iteration = "ITERATION" + loopIdx;
        l += "int " + times + " = Mathf.RoundToInt(";
        //yes, I'm re-writing the input system :/
        if (block.inputs.TIMES[0] == 1) {
            l += block.inputs.TIMES[1][1];
        } else if (block.inputs.TIMES[0] == 2) {
            l += addBlock(block.inputs.TIMES[1]);
        } else {
            if (typeof (block.inputs.TIMES[1]) == "object") {
                if (block.inputs.TIMES[1][0] == 12) {
                    var name = standardizeName(block.inputs.TIMES[1][1]);
                    if (doesArrayContainName(globalVariables, name)) {
                        l += "GlobalVariables.";
                    }
                    l += name;
                }
            } else {

                l += addBlock(block.inputs.TIMES[1]);
            }
        }
        l += ");";
        l += "for (int " + iteration + " = 0; " + iteration + " < " + times + "; " + iteration + "++){"
        l += addBlock(block.inputs.SUBSTACK[1]);
        l += "}";
        l += addBlock(block.next);
        return l;
    }

    var fields = Object.entries(block.fields);
    fields.forEach(([property, value]) => {

        console.log("Adding block field " + property);
        switch (property) {
            case "VARIABLE":
                var name = standardizeName(value[0]);
                if (doesArrayContainName(globalVariables, name)) {
                    l += "GlobalVariables.";
                } else {
                    l += "this.";
                }
                l += name;
                if (block.opcode == "data_changevariableby") {
                    l += " = Convert.ToSingle(";
                    if (doesArrayContainName(globalVariables, name)) {
                        l += "GlobalVariables.";
                    } else {
                        l += "this.";
                    }
                    l += name;
                    l += ")";
                }
                break;
            case "OPERATOR":
                l += "Mathf.";
                switch (value[0]) {
                    case "sqrt":
                        l += "Sqrt(";
                        break;
                    case "abs":
                        l += "Abs(";
                        break;
                    case "floor":
                        l += "Floor(";
                        break;
                    case "ceiling":
                        l += "Ceil(";
                        break;
                    case "sin":
                        l += "Sin(";
                        break;
                    case "cos":
                        l += "Cos(";
                        break;
                    case "tan":
                        l += "Tan(";
                        break;
                    case "asin":
                        l += "Asin(";
                        break;
                    case "acos":
                        l += "Acos(";
                        break;
                    case "atan":
                        l += "Atan(";
                        break;
                    case "ln":
                        l += "Log(";
                        break;
                    case "log":
                        l += "Log10(";
                        break;
                    case "e ^":
                        l += "Exp(";
                        break;
                    case "10 ^":
                        l += "Pow(10.0f, ";
                        break;
                    default:
                        unknownBlock("math operator", "field");
                        break;
                }
                l += "(float)";
                break;
            case "TO":
                if (value[0][0] != "_") {
                    //it's a sprite name
                    l += '"sprite", ';
                    l += '"' + value[0] + '"';
                } else {
                    switch (value[0]) {
                        case "_random_":
                            l += '"random"';
                            break;
                        case "_mouse_":
                            l += '"mouse"';
                            break;
                        default:
                            unknownBlock("goto menu", "field");
                    }
                }
                return l;
                break;
            case "DISTANCETOMENU":
                if (value[0][0] != "_") {
                    //it's a sprite name
                    l += '"sprite", ';
                    l += '"' + value[0] + '"';
                } else {
                    switch (value[0]) {
                        case "_mouse_":
                            l += '"mouse"';
                            break;
                        default:
                            unknownBlock("distanceTo menu", "field");
                    }
                }
                return l;
                break;
            case "TOWARDS":
                if (value[0][0] != "_") {
                    //it's a sprite name
                    l += '"sprite", ';
                    l += '"' + value[0] + '"';
                } else {
                    switch (value[0]) {
                        case "_mouse_":
                            l += '"mouse"';
                            break;
                        default:
                            unknownBlock("towards menu", "field");
                    }
                }
                return l;
                break;
            case "FRONT_BACK":
                l += "SetLayer("
                l += '"' + value[0] + '"';
                break;
            case "FORWARD_BACKWARD":
                l += "ChangeLayer("
                l += '"' + value[0] + '"';
                l += ", ";
                break;
            case "STOP_OPTION":
                switch (value[0]) {
                    case "all":
                        l += 'Application.Quit();';
                        break;
                    case "this script":
                        if (warp) {
                            l += 'return;';
                        } else {
                            l += 'StopCoroutine(';
                            l += currentFunctionName;
                            l += '());';
                        }
                        break;
                    default:
                        unknownBlock("stop option", "field");
                }
                break;
            case "CURRENTMENU":
                l += "((int)System.DateTime.Now.";
                switch (value[0]) {
                    case "YEAR":
                        l += 'Year)';
                        break;
                    case "MONTH":
                        l += 'Month)';
                        break;
                    case "DATE":
                        l += 'Date)';
                        break;
                    case "DAYOFWEEK":
                        l += 'DayOfWeek + 1) % 7)';
                        break;
                    case "HOUR":
                        l += 'Hour)';
                        break;
                    case "MINUTE":
                        l += 'Minute)';
                        break;
                    case "SECOND":
                        l += 'Second)';
                        break;
                    default:
                        unknownBlock("time sensing", "field");
                }
                return l;
                break;
            case "BROADCAST_OPTION":
                l += "public IEnumerator Message"
                l += standardizeName(value[0]);
                l += "() {yield return null;";
                break;
            case "LIST":
                var name = standardizeName(value[0]);
                if (globalLists.includes(name))
                {
                    l += "GlobalVariables.";
                }
                l += name;
                break;
            case "KEY_OPTION":
                l += '"' + value[0] + '"'
                break;
            case "COSTUME":
                l += '"' + value[0] + '"'
                break;
            case "VALUE":
                l += standardizeName(value[0]);
                break;
            case "colorParam":
                l += "ColorParam." + value[0];
                break;
            case "TOUCHINGOBJECTMENU":
                if (value[0][0] != "_") {
                    //it's a sprite name
                    l += '"sprite", ';
                    l += '"' + value[0] + '"';
                } else {
                    switch (value[0]) {
                        case "_edge_":
                            l += '"_edge_"';
                            break;
                        case "_mouse_":
                            l += '"mouse"';
                            break;
                        default:
                            unknownBlock("touching object menu", "field");
                    }
                }
                return l;
                break;
            case "CLONE_OPTION":
                l += '"' + value[0] + '"'
                break;
            default:
                unknownBlock("field", "field");
        }
    });


    //adding function
    l += blockRef.function;


    //adding arguments and separators
    var entries = Object.entries(block.inputs);
    entries.forEach(([property, value], index) => {
        if (value[0] === 1) {
            //written argument
            console.log("Adding written argument " + property);
            //special data type can also be float for variable set, but is marked as string :/
            if (block.opcode == "data_setvariableto") {
                //get variable in local variables
                var variable = getTypeByName(localVariables,standardizeName(block.fields.VARIABLE[0]));
                if (variable == null) {
                    //get variable in global variable
                    variable = getTypeByName(globalVariables, standardizeName(block.fields.VARIABLE[0]));
                    if (variable == null) {
                        //didn't find in the 2 lists :(
                        return console.error("Unknown variable found : " + variable);
                    }
                }
                //I have to find the type of the input
                //we'll just check the first letter
                //I hope that's alright
                var inputValue = value[1][1];
                if (startsWithNumber(inputValue.toString())) {
                    l += value[1][1];
                    if (containsDot(inputValue)) {
                        l += "f";
                    }
                } else {
                    if (property == "BROADCAST_INPUT") {
                        l += '"Message' + standardizeName(value[1][1]) + '"';
                    } else {
                        l += '"' + value[1][1] + '"';
                    }
                }
                /*if (typeof inputValue == "number") {
                    l += value[1][1];
                    if (containsDot(inputValue)) {
                        l += "f";
                    }
                } else {
                    if (property == "BROADCAST_INPUT") {
                        l += '"Message' + standardizeName(value[1][1]) + '"';
                    } else {
                        l += '"' + value[1][1] + '"';
                    }
                }*/
            } else {
                if (value[1] == null) {
                    unknownBlock("block", "block");
                    l += addBlock(block.next);
                    return;
                }
                if (typeof (value[1]) == "object") {
                    /*switch (value[1][0]) {
                        case 4:
                            //float
                            l += value[1][1] + "f";
                            break;
                        case 5:
                            //float
                            l += value[1][1] + "f";
                            break;
                        case 6:
                            //int
                            l += value[1][1];
                            break;
                        case 7:
                            //int
                            l += value[1][1];
                            break;
                        case 8:
                            //angle
                            l += value[1][1];
                            break;
                        case 9:
                            //color
                            l += value[1][1];
                            break;
                        case 10:
                            l += '"' + value[1][1] + '"';
                            break;
                        default:
                            status("Unknown argument" + value[1] + " found in " + blockID);
                    }*/
                    
                    //I have to find the type of the input
                    //we'll just check the first letter
                    //I hope that's alright
                    var inputValue = value[1][1];
                    if (startsWithNumber(inputValue.toString())) {
                        l += inputValue;
                        if (containsDot(inputValue)) {
                            l += "f";
                        }
                    } else {
                        if (property == "BROADCAST_INPUT") {
                            l += '"Message' + standardizeName(value[1][1]) + '"';
                        } else {
                            if (inputValue == "") {
                                l += "";
                            } else {
                                l += '"' + value[1][1] + '"';
                            }
                        }
                    }
                    /*if (typeof inputValue == "number") {
                        l += value[1][1];
                        if (containsDot(inputValue)) {
                            l += "f";
                        }
                    } else {
                        if (property == "BROADCAST_INPUT") {
                            l += '"Message' + standardizeName(value[1][1]) + '"';
                        } else {
                            l += '"' + value[1][1] + '"';
                        }
                    }*/

                } else {
                    l += addBlock(value[1]);
                }
                
            }
            
        }
        if (value[0] === 2) {
            //block argument
            console.log("Adding block argument " + property);
            if (block.opcode != "control_repeat_until" && block.opcode != "control_if_else" && block.opcode != "control_if") {
                l += addBlock(value[1]);
            }
            
        }
        if (value[0] === 3) {
            //written argument replaced by a block
            console.log("Adding block argument on top of written argument (shadow block) " + property);
            if (typeof(value[1]) == "object") {
                if (value[1][0] == 12) {
                    var name = standardizeName(value[1][1]);
                    if (doesArrayContainName(globalVariables, name)) {
                        l += "GlobalVariables.";
                    }
                    //adding variable name as an argument
                    l += name;
                }
            } else {
                
                l += addBlock(value[1]);
            }
            
        }
        if (index != entries.length - 1) {
            l += blockRef.separator;
        }
    });

    if (block.opcode == "control_repeat_until") {
        l += addBlock(block.inputs.CONDITION[1]);
        l += ") {";
        l += addBlock(block.inputs.SUBSTACK[1]);
    }
    if (block.opcode == "control_if_else") {
        l += addBlock(block.inputs.CONDITION[1]);
        l += ") {";
        if (block.inputs.SUBSTACK != null) {
            l += addBlock(block.inputs.SUBSTACK[1]);
        }
        l += "} else {";
        if (block.inputs.SUBSTACK2 != null) {
            l += addBlock(block.inputs.SUBSTACK2[1]);
        }
    }
    if (block.opcode == "control_if") {
        l += addBlock(block.inputs.CONDITION[1]);
        l += ") {";
        if (block.inputs.SUBSTACK != null) {
            l += addBlock(block.inputs.SUBSTACK[1]);
        }
    }
    if (block.opcode == "procedures_call") {
        if (block.mutation.warp == "false") {
            l += ")";
        }
    }

    if (blockRef.delay && !warp) {
        l += delay;
    }
    l += blockRef.close;
    l += addBlock(block.next);
    l += blockRef.after;
    
    if (l == "" && block.next != null) {
        unknownBlock("block", "block");
        l += addBlock(block.next);
    }
    return l;
}

                                //------------------------------------------------------//
                                //                                                      //
                                //      Block List Structure                            //
                                //                                                      //
                                //      fields           (for dropdowns like variables) //
                                //      function         GoTo(                          //
                                //      argument 1       1                              //
                                //      separator        ,                              //
                                //      argument 2       2                              //
                                //      close            );                             //
                                //      delay            waitforendofframe();           //
                                //       -> nextBlock                                   //
                                //      after                                           //
                                //                                                      //
                                //------------------------------------------------------//


//Here are some little useful functions
function doesArrayContainName(arr, targetName) {
    return arr.some(obj => obj.name === targetName);
}

function standardizeName(name) {
    name = removeNonLetters(name.replace(/[^a-zA-Z0-9]/g, ""));
    if (reservedKeywords.find(keyword => keyword == name) == undefined) {
        return name;
    } else {
        return name[0] + name;
    }
}

function containsDot(str) {
    return /\./.test(str);
}

function startsWithNumber(str) {
    //return /*(/^\d/.test(str) || str[0] == "-") &&*/ !/[^0-9]/.test(str) || (str[0] == "-" && !/[^0-9]/.test(str[1])) && str.length < 20;
    return !/[^0-9,-.]/.test(str) && str.length < 20;
}

function unknownBlock(skipped, library) {
    status("Unknown " + skipped + " skipped. Please update " + library + " library, or remove hacked blocks.");
}

function getTypeByName(arr, targetName) {
    const foundObject = arr.find(obj => obj.name === targetName);
    return foundObject ? foundObject.type : null;
}

function stringToNumber(string) {
    let number = 0;
    for (let i = 0; i < string.length; i++) {
        const charCode = string.charCodeAt(i);
        number = number * 2 + (charCode);
    }
    return Math.ceil(number);
}

function removeNonLetters(inputString) {
    return inputString.replace(/[^a-zA-Z]/g, '');
}

function addNewlines(str) {
    var specialChars = ['{', '}', ';'];
    var result = '';
    var spacing = "\n";

    for (var i = 0; i < str.length; i++) {
        var char = str.charAt(i);
        if (specialChars.includes(char)) {
            if (char == "{") {
                spacing += "    ";
            } else if (char == "}") {
                spacing = spacing.slice(0, -4);
                result = result.slice(0, -4);
            }
            result += char + spacing;
            
        } else {
            result += char;
        }
    }

    return result;
}

function cutStringIfLong(string) {
    if (string.length > 32) {
        string = string.substring(string.length - 32);
    }
    return string;
}


function stringToGUID(string) {
    return stringToHex(padStringTo16(string));
}

function stringToHex(string) {
    let hex = '';
    for (let i = 0; i < string.length; i++) {
        const charCode = string.charCodeAt(i).toString(16);
        hex += charCode.length === 1 ? '0' + charCode : charCode;
    }
    return hex.toString();
}

function padStringTo16(string) {
    if (string.length < 16) {
        const lastChar = string[string.length - 1];
        const padding = lastChar.repeat(16 - string.length);
        return string + padding;
    } else if (string.length > 16) {
        return string.slice(0, 16);
    } else {
        return string;
    }
}

function addProgress(value = 1) {
    progress += value;
    let percentage = progress / estimatedWork * 100;
    //console.warn("progress : " + progress);
    //console.warn("progress percentage : " + percentage + "%.");
    //console.warn("estimated work : " + estimatedWork + ".");
    document.getElementById("progressBar").style.width = percentage + '%';
}

//----------------------------------------------------FILE HANDLING PART-----------------------------------------------

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
        addProgress(metadata.percent - previousPercent);
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
                    var pngData = imagePromises.push( await convertSvgToPngV3(svgData));
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

//----------------------------------------------------------SVG TO PNG--------------------------------------------------------

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


//---------------------------------------------------UNITY IMPORT SETTINGS TEMPLATES---------------------------------------------------


//SVG importer settings
/*fileFormatVersion: 2
guid: 283ae88d67f9f8540aee17f37ed9c388
ScriptedImporter:
  internalIDToNameTable: []
  externalObjects: {}
  serializedVersion: 2
  userData: 
  assetBundleName: 
  assetBundleVariant: 
  script: {fileID: 11500000, guid: a57477913897c46af95d590f580878bd, type: 3}
  svgType: 1
  texturedSpriteMeshType: 0
  svgPixelsPerUnit: 100
  gradientResolution: 64
  alignment: 0
  customPivot: {x: 0, y: 0}
  generatePhysicsShape: 0
  viewportOptions: 0
  preserveViewport: 0
  advancedMode: 0
  predefinedResolutionIndex: 2
  targetResolution: 720
  resolutionMultiplier: 2
  stepDistance: 10
  samplingStepDistance: 100
  maxCordDeviationEnabled: 0
  maxCordDeviation: 1
  maxTangentAngleEnabled: 0
  maxTangentAngle: 5
  keepTextureAspectRatio: 1
  textureSize: 1024
  textureWidth: 256
  textureHeight: 256
  wrapMode: 0
  filterMode: 1
  sampleCount: 2
  preserveSVGImageAspect: 0
  useSVGPixelsPerUnit: 1
  spriteData:
    TessellationDetail: 0
    SpriteRect:
      name: bcf454acf82e4504149f7ffe07081dbc
      originalName: 
      pivot: {x: 5.1263156, y: 5.12}
      alignment: 0
      border: {x: 0, y: 0, z: 0, w: 0}
      rect:
        serializedVersion: 2
        x: 0
        y: 0
        width: 95
        height: 100
      spriteID: d058db1872292fa4489e7f183a13187e
    PhysicsOutlines: []
*/