let blockList;
let blockDic;
let emojilib;
let globalVariables = [];
let globalLists = [];
let localVariables = [];
let localLists = [];
let hatBlockIDs = [];

let currentSprite;
let warp = false;
let loopIdx = 0;
let currentFunctionName;

function addScript(sprite) {
    SetStatus("Adding script for : " + sprite.name);

    currentSprite = sprite;

    blockList = sprite.blocks;
    warp = false;

    var code = "";
    var scriptName = "Template Scratch/Assets/Scripts/" + standardizeName(sprite.name) + "Script.cs";

    code += "using System;";
    code += "using System.Collections;";
    code += "using System.Collections.Generic;";
    code += "using UnityEngine;";
    code += "using Scratch;";
    code += "\n";
    code += "public class ";
    code += standardizeName(sprite.name) + "Script";
    code += " : ScratchSprite ";
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
            var name = standardizeName(value[0]) + 'List';
            var content = value[1];
            var type = "list";

            if (sprite.isStage) {
                globalLists.push(name);
            }
        });
    }

    //adding all the "when flag cliked" in start
    var startBlocks = [];
    code += "private void Start(){";
    if (sprite.isStage) {
        code += 'spriteRenderer.sortingLayerName = "Stage";';
        code += `Application.targetFrameRate = ${graphicsFPS};`;
    }
    code += 'if(isClone){';
    for (let block in blockList) {
        if (blockList[block].topLevel == true) {
            if (blockList[block].opcode == "control_start_as_clone") {
                startBlocks.push(block);
                var functionName = "Start" + GetStartNumber(block);
                code += "StartCoroutine(" + functionName + "());"
            }

        }
    }
    code += "} else {";
    for (let block in blockList) {
        if (blockList[block].topLevel == true) {
            if (blockList[block].opcode == "event_whenflagclicked") {
                startBlocks.push(block);
                var functionName = "Start" + GetStartNumber(block);
                code += "StartCoroutine(" + functionName + "());"
            }

        }
    }
    code += "}}";

    code += "private void Update(){";
    if (sprite.isStage) {
        code += "GlobalVariables.timer += Time.deltaTime;";
    }
    for (let blockID in blockList) {
        let currentBlock = blockList[blockID];
        if (currentBlock.topLevel == true) {
            if (currentBlock.opcode == "event_whenkeypressed") {
                code += 'if(GetKey("';
                code += currentBlock.fields.KEY_OPTION[0]
                code += '")){'
                startBlocks.push(blockID);
                var functionName = "Start" + GetStartNumber(blockID);
                code += "StartCoroutine(" + functionName + "());"
                code += "}";
            }
        }
    }
    code += '}';

    code += "private void OnMouseDown() {"
    for (let blockID in blockList) {
        let currentBlock = blockList[blockID];
        if (currentBlock.topLevel == true) {
            if (currentBlock.opcode == "event_whenthisspriteclicked") {
                startBlocks.push(blockID);
                var functionName = "Start" + GetStartNumber(blockID);
                code += "StartCoroutine(" + functionName + "());"
            }
        }
    }
    code += '}';

    //adding all the start coroutines
    startBlocks.forEach(blockID => {
        var functionName = "Start" + GetStartNumber(blockID);
        currentFunctionName = functionName;
        code += "IEnumerator " + functionName + "(){";
        code += '//Calling all the "When flag clicked" coroutines;'
        code += addBlock(blockList[blockID].next);
        code += "yield return null;}";
    });

    //adding custom blocks and events receivers
    let broadcastNames = [];
    let broadcastIDs = [];
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

                SetStatus("Creating function " + prototypeID + ".");

                var proceduresDefinition = standardizeName(definitionName.replace(/ %[sb]/g, ""));
                currentFunctionName = proceduresDefinition;
                proceduresDefinition += "(";
                let arguments = JSON.parse(blockList[prototypeID].mutation.argumentnames);
                let argumentIDs = JSON.parse(blockList[prototypeID].mutation.argumentids);
                let argumentDefaults = JSON.parse(blockList[prototypeID].mutation.argumentdefaults);
                //processing value arguments
                for (var arg = 0; arg < arguments.length; arg++) {
                    let inputs = blockList[prototypeID].inputs;
                    let input = inputs[Object.keys(inputs)[arg]];
                    //if (input[1] != null) {
                        let inputType = blockList[input[1]].opcode;
                        if (inputType == "argument_reporter_string_number") {
                            proceduresDefinition += "object " + standardizeName(arguments[arg]);
                            //let argDefault = argumentDefaults[arg];
                            proceduresDefinition += ' = null';
                            proceduresDefinition += ", ";
                        }
                        if (inputType == "argument_reporter_boolean") {
                            proceduresDefinition += "object " + standardizeName(arguments[arg]);
                            //let argDefault = argumentDefaults[arg];
                            proceduresDefinition += ' = null';
                            proceduresDefinition += ", ";
                        }
                    //}
                }
                // for (var arg = 0; arg < arguments.length; arg++) {
                //     let inputs = blockList[prototypeID].inputs
                //     let input = inputs[Object.keys(inputs)[arg]];
                //     if (input[1] != null) {
                //         let inputType = blockList[input[1]].opcode;
                //         if (inputType == "argument_reporter_boolean") {
                //             proceduresDefinition += "object " + standardizeName(arguments[arg]);
                //             proceduresDefinition += ", ";
                //         }
                //     }
                // }
                if (arguments.length > 0) {
                    proceduresDefinition = proceduresDefinition.slice(0, -2);
                }

                proceduresDefinition += ")";

                code += proceduresDefinition;

                //Add arguments
                code += " {";

                if(arguments.length > 0){
                    code += "//Default values assigned to the parameters;";
                }

                for (var arg = 0; arg < arguments.length; arg++) {
                    let inputs = blockList[prototypeID].inputs
                    let input = inputs[Object.keys(inputs)[arg]];
                    //if (input[1] != null) {
                        let inputType = blockList[input[1]].opcode;
                        if (inputType == "argument_reporter_string_number" || inputType == "argument_reporter_boolean") {
                            code += standardizeName(arguments[arg]);
                            code += ' ??= "';
                            code += argumentDefaults[arg];
                            code += '";';
                        }
                        // if (inputType == "argument_reporter_boolean") {
                        //     proceduresDefinition += "object " + standardizeName(arguments[arg]);
                        //     let argDefault = argumentDefaults[arg];
                        //     proceduresDefinition += ' = null';
                        //     proceduresDefinition += ", ";
                        // }
                    //}
                }

                if(arguments.length > 0){
                    code += "\n        ";
                }
                
                code += addBlock(block.next);
                if (!warp) {
                    code += "yield return null;";
                }
                code += "}";
            }
            if (block.opcode == "event_whenbroadcastreceived") {
                warp = false;
                code += addBlock(blockID);
                let broadcastName = standardizeName(block.fields.BROADCAST_OPTION[0]);
                broadcastNames.push(broadcastName);
                broadcastIDs.push(blockID);
            }
        }
    }

    let usedBroadcasts = [];
    for (let blockID in blockList) {
        var block = blockList[blockID]
        if (block.opcode == "event_whenbroadcastreceived") {
            let broadcastName = standardizeName(block.fields.BROADCAST_OPTION[0]);
            if (!usedBroadcasts.includes(broadcastName)) {
                code += "public IEnumerator Message";
                code += broadcastName;
                usedBroadcasts.push(broadcastName);
                code += "() {";
                code += "//Function to call all sub-messages;"
                //Add all the messages
                for (var i = 0; i < broadcastNames.length; i++) {
                    if (broadcastNames[i] == broadcastName) {
                        code += "yield return StartCoroutine(Message";
                        code += GetStartNumber(broadcastIDs[i]);
                        code += "());";
                    }
                }
                code += "yield return null;}";
            }
        }
    }

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

function GetStartNumber(ID){
    AddStartNumber(ID);
    let number = hatBlockIDs.indexOf(ID);
    return number;
}

function AddStartNumber(ID){
    if (!hatBlockIDs.includes(ID)) {
        hatBlockIDs.push(ID);
    }
}

function addVariables(sprite, static = "") {
    var l = "\n    ";
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
            l += "public ";
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
    l += "\n    ";
    var lists = Object.entries(sprite.lists);
    lists.forEach(([property, value]) => {
        // property = list ID
        // value [0] = list name
        // value [1] = list content
        

        var name = standardizeName(value[0]) + 'List';
        var content = value[1];
        if (sprite.isStage) {
            //globalVariables.push({ name, type });
        } else {
            if(localLists.includes(name))
            {
                SetStatus("Double list found : " + name);
                return;
            }
            localLists.push(name);
        }
        l += "\n    public ";
        l += static;
        l += "List<object> ";
        l += name;

        l += " = new List<object> ";
        if (value[1].length > maxListLength) {
            SetStatus("List " + value[0] + " is longer than " + maxListLength + " elements. The data wasn't imported.");
            l += "{}";
        } else {
            //l += `{ ${content.map(item => typeof item === 'number' ? (Number.isInteger(item) ? item : item.toFixed(2) + 'f') : `"${item}"`).join(', ')}      }`;
            const formattedArray = content.map(item => {
                if (typeof item === 'number') {
                    if (Number.isInteger(item)) {
                        return item.toString();
                    } else {
                        return item.toFixed(2) + 'f';
                    }
                } else if (typeof item === 'string') {
                    return `"${item.replace(/"/g, '\\"')}"`;
                } else {
                    return JSON.stringify(item);
                }
            });

            const formattedString = `{ ${formattedArray.join(', ')}     }`;
            l += formattedString;
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
        if (useCommunityBlocks) {
            //Community blocks
            switch (proceduresDefinition) {
                case "log":
                    l += "Debug.Log(";
                    break;
                case "warn":
                    l += "Debug.LogWarning(";
                    break;
                default:
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
                    break;
            }
        } else {
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


    }
    if (block.opcode == "operator_not") {
        l += "!((bool)";
        if (Object.keys(block.inputs).length > 0) {
            //it can only be a block (I guess??)
            l += addBlock(block.inputs.OPERAND[1]);
        } else {
            l += "false";
        }
        l += ")";
        return l;
    }
    if (block.opcode == "control_repeat") {
        if (block.inputs.SUBSTACK == undefined || block.inputs.TIMES == "") {
            l += addBlock(block.next);
            return l;
        }
        loopIdx++;
        var times = "TIMES" + loopIdx;
        var iteration = "ITERATION" + loopIdx;
        l += "int " + times + " = ToInt(";
        //yes, I'm re-writing the input system :/
        if (block.inputs.TIMES[0] == 1) {
            l += block.inputs.TIMES[1][1] + 'f';
        } else if (block.inputs.TIMES[0] == 2) {
            l += addBlock(block.inputs.TIMES[1]);
        } else {
            if (typeof (block.inputs.TIMES[1]) == "object") {
                if (block.inputs.TIMES[1][0] == 12) {
                    var name = standardizeName(block.inputs.TIMES[1][1]);
                    if (doesArrayContainName(globalVariables, name)) {
                        l += "GlobalVariables.";
                    }else{
                        l += "this.";
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
        if(!warp){
            l += delay;
        }
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
                        l += "Sin(Mathf.Deg2Rad * ";
                        break;
                    case "cos":
                        l += "Cos(Mathf.Deg2Rad * ";
                        break;
                    case "tan":
                        l += "Tan(Mathf.Deg2Rad * ";
                        break;
                    case "asin":
                        l += "Asin(Mathf.Deg2Rad * ";
                        break;
                    case "acos":
                        l += "Acos(Mathf.Deg2Rad * ";
                        break;
                    case "atan":
                        l += "Atan(Mathf.Deg2Rad * ";
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
                l += "ToFloat(";
                break;
            case "TO":
                if (value[0][0] != "_") {
                    //it's a sprite name
                    l += 'Target.sprite';
                    if(block.opcode == "motion_goto_menu")
                    {
                        l += ', "' + value[0] + '"';
                    }
                } else {
                    switch (value[0]) {
                        case "_random_":
                            l += 'Target.random';
                            break;
                        case "_mouse_":
                            l += 'Target.mouse';
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
                    l += 'Target.sprite, ';
                    l += '"' + value[0] + '"';
                } else {
                    switch (value[0]) {
                        case "_mouse_":
                            l += 'Target.mouse';
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
                    l += 'Target.sprite, ';
                    l += '"' + value[0] + '"';
                } else {
                    switch (value[0]) {
                        case "_mouse_":
                            l += 'Target.mouse';
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
                            // l += 'StopCoroutine("Function';
                            // l += currentFunctionName;
                            // l += '");';
                            l += "yield break;";
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
                l += GetStartNumber(blockID);
                l += "() {";
                break;
            case "LIST":
                if(block.opcode == "data_itemoflist")
                {
                    l += "ElementOf(";
                }
                if(block.opcode == "data_replaceitemoflist")
                {
                    l += "ReplaceItem(";
                }
                var name = standardizeName(value[0]) + 'List';
                if (globalLists.includes(name)) {
                    l += "GlobalVariables.";
                }else{
                    l += "this.";
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
                    l += 'Target.sprite, ';
                    l += '"' + value[0] + '"';
                } else {
                    switch (value[0]) {
                        case "_edge_":
                            l += 'Target.edge';
                            break;
                        case "_mouse_":
                            l += 'Target.mouse';
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
            case "PROPERTY":
                const menu = block.inputs.OBJECT[1];
                l += addBlock(menu);
                l += ".";
                switch (value[0]) {
                    case "direction":
                        l += "transform.rotation.z + 90";
                        break;
                    case "costume #":
                        l += "currentCostumeIndex";
                        break;
                    case "costume name":
                        l += "currentCostumeName";
                        break;
                    case "size":
                        l += "transform.localScale.x";
                        break;
                    case "xposition":
                        l += "transform.position.x";
                        break;
                    case "yposition":
                        l += "transform.position.y";
                        break;
                    default:
                        l += standardizeName(value[0]);
                        break;
                }
                l += ')';
                return l;
                break;
            case "OBJECT":
                let gameObjectName = standardizeName(value[0]);
                let scriptName = standardizeName(value[0] + "Script");
                if (value[0] == "_stage_") {
                    gameObjectName = "Stage";
                    scriptName = "StageScript";
                }
                l += '(GameObject.Find("';
                l += gameObjectName;
                l += '").GetComponent<';
                l += scriptName;
                l += '>()';
                return l;
                break;
            case "NUMBER_NAME":
                switch (value[0]) {
                    case "number":
                        l += "currentCostumeIndex";
                        break;
                    case "name":
                        l += "currentCostumeName";
                        break;
                    default:
                        break;
                }
            default:
                unknownBlock("field", "field");
        }
    });


    //adding function
    l += blockRef.function;


    //adding argument inputs and separators
    var entries = Object.entries(block.inputs);
    entries.forEach(([property, value], index) => {
        if(block.opcode == "procedures_call")
        {
            var proceduresDefinition = standardizeName(block.mutation.proccode.replace(/ %[sb]/g, ""));
            switch (proceduresDefinition) {
                case "log":
                    break;
                case "warn":
                    break;
                case "error":
                    break;
                default:
                    let procedure = FindFunction(block.mutation.proccode);
                    if(procedure == undefined)
                    {
                        return l;
                    }
                    let arg = JSON.parse(procedure.mutation.argumentids).indexOf(property);
                    console.warn(arg);
                    l += standardizeName(JSON.parse(procedure.mutation.argumentnames)[arg]);
                    l += ": ";
                    break;
            }
        }
        if (block.opcode == "sensing_of") { return; }
        if (value[0] === 1) {
            //written argument
            console.log("Adding written argument " + property);
            //special data type can also be float for variable set, but is marked as string :/
            if (block.opcode == "data_setvariableto") {
                //get variable in local variables
                var variable = getTypeByName(localVariables, standardizeName(block.fields.VARIABLE[0]));
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
                inputValue = inputValue.replace(/"/g, '\\"');
                if (inputValue == "") {
                    SetStatus("Empty input found.");
                    l += "0f";
                } else {
                    if (startsWithNumber(inputValue.toString())) {
                        l += inputValue + 'f';
                        // if (containsDot(inputValue)) {
                        //     l += "f";
                        // }
                    } else {
                        if (property == "BROADCAST_INPUT") {
                            l += '"Message' + standardizeName(value[1][1]) + '"';
                        } else {
                            if (inputValue == "") {
                                l += "";
                            } else {
                                l += '@"' + value[1][1] + '"';                                
                            }
                        }
                    }
                }
            } else {
                if (value[1] == null) {
                    unknownBlock("block", "block");
                    l += addBlock(block.next);
                    return;
                }
                if (typeof (value[1]) == "object") {
                    //I have to find the type of the input
                    //we'll just check the first letter
                    //I hope that's alright
                    var inputValue = value[1][1];
                    inputValue = inputValue.replace(/"/g, '\\"');
                    
                    if (inputValue == "") {
                        SetStatus("Empty input found.");
                        l += "0f";
                    } else {
                        if (startsWithNumber(inputValue.toString())) {
                            l += inputValue + 'f';
                            // if (containsDot(inputValue)) {
                            //     l += "f";
                            // }
                        } else {
                            if (property == "BROADCAST_INPUT") {
                                l += '"Message' + standardizeName(value[1][1]) + '"';
                            } else {
                                if (inputValue == "") {
                                    l += "";
                                } else {
                                    l += '@"' + value[1][1] + '"';
                                }
                            }
                        }
                    }
                } else {
                    l += addBlock(value[1]);
                }

            }

        }
        if (value[0] === 2) {
            //block argument
            console.log("Adding block argument " + property);
            if (block.opcode != "control_repeat_until" && block.opcode != "control_if_else" && block.opcode != "control_if") {
                if (typeof (value[1]) == "object" && value[1] != null) {
                    if (value[1][0] == 12) {
                        var name = standardizeName(value[1][1]);
                        if (doesArrayContainName(globalVariables, name)) {
                            l += "GlobalVariables.";
                        }else{
                            l += "this.";
                        }
                        //adding variable name as an argument
                        l += name;
                    }
                } else {
                    if (value[1] == null) {
                        l += "0f";
                    } else {
                        l += addBlock(value[1]);
                    }
                }
            }

        }
        if (value[0] === 3) {
            //written argument replaced by a block
            console.log("Adding block argument on top of written argument (shadow block) " + property);
            if (typeof (value[1]) == "object" && value[1] != null) {
                if (value[1][0] == 12) {
                    var name = standardizeName(value[1][1]);
                    if (doesArrayContainName(globalVariables, name)) {
                        l += "GlobalVariables.";
                    }else{
                        l += "this.";
                    }
                    //adding variable name as an argument
                    l += name;
                }
            } else {
                if (value[1] == null) {
                    l += "0f";
                } else {
                    l += addBlock(value[1]);
                }
            }

        }
        if (index != entries.length - 1) {
            l += blockRef.separator;
        }
    });

    if (block.opcode == "control_repeat_until") {
        if (block.inputs.CONDITION != null) {
            l += addBlock(block.inputs.CONDITION[1]);
        }else{
            l += 'false';
        }
        l += ") {";
        if (block.inputs.SUBSTACK != null) {
            l += addBlock(block.inputs.SUBSTACK[1]);
        }
    }
    if (block.opcode == "control_if_else") {
        if (block.inputs.CONDITION != null) {
            l += addBlock(block.inputs.CONDITION[1]);
        }else{
            l += 'false';
        }
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
        if (block.inputs.CONDITION != null) {
            l += addBlock(block.inputs.CONDITION[1]);
        }else{
            l += 'false';
        }
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

function FindFunction(proccode)
{
    let blocks = Object.entries(currentSprite.blocks);
    let functionBlock;

    blocks.forEach(block => {
        if(block[1].opcode == "procedures_prototype")
        {
            if(block[1].mutation.proccode == proccode)
            {
                functionBlock = block[1];
            }
        }
    });

    if(functionBlock == undefined)
    {
        SetStatus("Unknown function : " + proccode);
        return null;
    }else{
        return functionBlock;
    }
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

function addNewlines(str) {
    const specialChars = ['{', '}', ';'];
    let result = '';
    let spacing = "\n";
    let isInQuotes = false;

    for (var i = 0; i < str.length; i++) {
        var char = str.charAt(i);
        if (specialChars.includes(char) && !isInQuotes) {
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
        if(char == '"')
        {
            isInQuotes = !isInQuotes;
        }
    }

    return result;
}