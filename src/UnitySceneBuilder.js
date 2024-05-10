let unityGameScene = null;
let usedIdentifiers = [];

function handleSprites(scratchProject) {
    var sprites = scratchProject.targets;
    estimatedWork += Object.keys(sprites).length;
    sprites.forEach(sprite => handleSprite(sprite, scratchProject));
}

function handleSprite(sprite, scratchProject) {
    addProgress();
    console.log("Handling sprite : " + sprite.name)
    //fileID : 21300000 for bitmap
    //fileID : 3286163911610860551 for SVG
    var fileID = "21300000";
    // if (sprite.costumes[sprite.currentCostume].dataFormat == "svg") {
    //     fileID = "3286163911610860551";
    // }
    addGameObject(sprite.name, stringToGUID(sprite.costumes[sprite.currentCostume].assetId), sprite.x, sprite.y, (sprite.visible * 1).toString(), stringToGUID(sprite.name + "Scr"), sprite.layerOrder, sprite.size, sprite.direction, fileID, sprite.costumes);
    addScript(sprite, scratchProject);
}

function addGameObject(spriteName, costumeGUID, px, py, isShown, scriptGUID, layerOrder, scale, direction, fileID, costumes) {
    if (usedIdentifiers.includes(stringToNumber(spriteName))) {
        SetStatus("Duplicate identifiers : " + stringToNumber(spriteName) + ". Please change the sprite name.")
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
        // if (costume.dataFormat == "svg") {
        //     fileID = "3286163911610860551";
        // }
        unityGameScene += "\n    sprite: {fileID: " + fileID + ", guid: " + stringToGUID(costume.assetId) + ", type: 3}";
        unityGameScene += "\n    index: " + index;
    });
    usedIdentifiers.push(stringToNumber(spriteName));
}