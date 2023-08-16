let scratchProject =  null;

let projectName = "untitled";

let progress = 0;
let estimatedWork = 0;
let estimatedProjectSize = 0;
let startTime = 0;
let endTime = 0;

//////////////////////////////////////////////////////////////////////////////////
//paths
const templatePath = "Templates/Template Scratch v15.zip";
const blockLibPath = "blockList.json";


//HTML linking
const sb3Doc = document.getElementById('fileInput');
//const fact = document.getElementById('fact');

//conversion parameter
const playerUsername = "player";
const maxListLenght = 1000;
const useCommunityBlocks = true;
const customTranslations = [];
const formatCode = true;

//utilities
const delay = "yield return new WaitForEndOfFrame();";
const reservedKeywords = ["int", "float", "for", "ITERATION", "string", "double", "var", "default", "event", "operator", "false", "true", "class", "return", "timer", "TIMES", "const", "static", "ScratchLib", "penWidth"];
//////////////////////////////////////////////////////////////////////////////////


//https://www.notion.so/563bff1d0df54d9194eafd756b1ea68d?v=69b39a8c83e0455ab946972e61ad28a1

//120Kb      => 2.5s
//19800Kb    => 121s
//210Kb      => 3.7s
//52Kb       => 2.6s
//1100Kb     => 7.5s
//269Kb      => 9.8s
//668Kb      => 5.1s
//885Kb      => 7.6s


//TO DO:
//next template : v16
//Add "stop other coroutines" in ScratchLib 

//1 - 1 = 0
//1 - 0 = 1
//0 - 1 = -1
//custom function I guess for boolean subtract

//----------------------------------------------------MAIN--------------------------------------------------------

async function convert() {
    startTime = performance.now();
    SetStatus("Started Converting...");

    usedIdentifiers = [];

    progress = 0;
    estimatedWork = 0;
    estimatedWork += 1; //for the getJSONData
    estimatedWork += 1; //for the JSON.Parse()
    estimatedWork += 1; //for the zipping
    estimatedWork += 200; //for the zipping

    let fileInput = document.getElementById('fileInput').files[0];

    if (fileInput != undefined) {
        estimatedProjectSize = fileInput.size;
    }

    let projectID = document.getElementById('URLInput').value;
    if (projectID != "" && projectID.length > 5) {
        fileInput = await getProjectFromID(projectID);
        estimatedProjectSize = fileInput.size;
    }

    //estimate conversion duration
    //let estimatedTime = estimatedProjectSize / 1000 / 160;
    let projectSizeMegaBytes = estimatedProjectSize / 1000 / 1000;
    let estimatedTime = 5.45 ** (0.156 * projectSizeMegaBytes);
    document.getElementById("time").innerHTML = "Estimated time : " + estimatedTime.toFixed(1) + "s";

    //Importing template
    SetStatus("Importing template...");
    try {
        const template = await unzipFromURL(templatePath);  //Action 1
        workspace = template;
    } catch (error) {
        console.error(error);
    }

    const url = blockLibPath;
    //Get the block translation dictionnary
    blockDic = await getBlockDictionnary(url);  //Action 2
    addProgress();

    document.getElementById('fact').innerHTML = "We currently support " + Object.keys(blockDic.blocks).length + " scratch blocks !";

    SetStatus("Extracting images...");
    //Get images, sounds, and project's JSON
    const scratchFiles = await extractFilesFromScratchProject(fileInput); //Action 3
    workspace = workspace.concat(scratchFiles);

    unityGameScene = arrayBufferToString(workspace.find(obj => obj.name === "Template Scratch/Assets/Scenes/game.unity").data);

    SetStatus("Generating unity scene...");
    
    handleSprites(scratchProject);  //Action 5
    workspace.find(obj => obj.name === "Template Scratch/Assets/Scenes/game.unity").data = stringToArrayBuffer(unityGameScene);

    SetStatus("Zipping unity folder...");
    console.log("progress until here : " + progress);
    console.log(workspace);
    estimatedWork += workspace.length;
    zipAndDownloadFiles(workspace);  //Action 6
}

async function getProjectFromID(ID){
    SetStatus("Getting sb3 file from scratch's website.");
    estimatedWork += 100;
    //API from https://github.com/forkphorus/sb-downloader
    let previousPercent = 0;
    let previousType = "";
    const options = {
        // May be called periodically with progress updates.
        onProgress: (type, loaded, total) => {
            // type is 'metadata', 'project', 'assets', or 'compress'
            //console.log(type, loaded / total);
            if (previousType != type) {
                previousType = type;
                previousPercent = 0;
            }
            let percent = loaded / total * 100;
            addProgress((percent - previousPercent) / 4); //there are 4 steps I guess
            previousPercent = percent;
        }
    };
    const project = await SBDL.downloadProjectFromID(ID, options);

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
    estimatedProjectSize = arrayBuffer.byteLength;
    return fileInput;
}

async function getBlockDictionnary(url) {
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

function SetStatus(string) {
    document.getElementById('status').innerHTML = string;
    console.log(string);
}



//Here are some little useful functions
function doesArrayContainName(arr, targetName) {
    return arr.some(obj => obj.name === targetName);
}

function standardizeName(name) {
    //name = removeNonLetters(name.replace(/[^a-zA-Z0-9]/g, ""));
    name = removeNonLetters(scratchNameToUnityName(name));
    if (reservedKeywords.find(keyword => keyword == name) == undefined) {
        return name;
    } else {
        return name[0] + name;
    }
}

function scratchNameToUnityName(name){
    
    let result = "";
    for (var i = 0; i < name.length; i++) {
        let char = letterMap[name[i]];
        if (char == undefined) {
            result += name[i];
        } else {
            result += char;
        }
    }
    return result;
}

function containsDot(str) {
    return /\./.test(str);
}

function startsWithNumber(str) {
    //return /*(/^\d/.test(str) || str[0] == "-") &&*/ !/[^0-9]/.test(str) || (str[0] == "-" && !/[^0-9]/.test(str[1])) && str.length < 20;
    return !/[^0-9,-.]/.test(str) && str.length < 20 && str[0] != ',';
}

function unknownBlock(skipped, library) {
    SetStatus("Unknown " + skipped + " skipped. Please update " + library + " library, or remove hacked blocks.");
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
    document.getElementById("progressBar").innerHTML = percentage.toFixed(1) + "%";
    document.getElementById("progressBar").style.width = percentage.toFixed(2) + '%';
}

const letterMap = {
    '0': 'A',
    '1': 'B',
    '2': 'C',
    '3': 'D',
    '4': 'E',
    '5': 'F',
    '6': 'G',
    '7': 'H',
    '8': 'I',
    '9': 'J',
    '!': 'K',
    '@': 'L',
    '#': 'M',
    '$': 'N',
    '%': 'O',
    '^': 'P',
    '&': 'Q',
    '*': 'R',
    '(': 'S',
    ')': 'T',
    '_': 'U',
    '-': 'V',
    '+': 'W',
    '=': 'X',
    '[': 'Y',
    ']': 'Z',
    '{': 'a',
    '}': 'b',
    '|': 'c',
    ';': 'd',
    ':': 'e',
    '\'': 'f',
    '"': 'g',
    '<': 'h',
    '>': 'i',
    ',': 'j',
    '.': 'k',
    '/': 'l',
    '?': 'm',
    '`': 'n',
    '~': 'o',
    '¡': 'p',
    '¢': 'q',
    '£': 'r',
    '¤': 's',
    '¥': 't',
    '¦': 'u',
    '§': 'v',
    '¨': 'w',
    '©': 'x',
    'ª': 'y',
    '«': 'z',
    '¬': ' ',
};