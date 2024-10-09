import { gfx_scene_instance } from "./gfx_scene_instance";
import { vec3 } from "gl-matrix";

export function prepareScene(gfx_scene_instance: gfx_scene_instance) 
{
    const { 
        scene, 
        renderInstance,
        renderInstance: { device },
        sceneBuffers 
    } = gfx_scene_instance;

    const sceneData = {
        cameraPos: scene.data.camera.position,
        cameraForwards: scene.data.camera.forwards,
        cameraRight: scene.data.camera.right,
        cameraUp: scene.data.camera.up,
    }

    const maxBounces: number = 4;
    renderInstance.device.queue.writeBuffer(
        sceneBuffers.sceneParameters, 0,
        new Float32Array(
            [
                sceneData.cameraPos[0],
                sceneData.cameraPos[1],
                sceneData.cameraPos[2],
                0.0,
                sceneData.cameraForwards[0],
                sceneData.cameraForwards[1],
                sceneData.cameraForwards[2],
                0.0,
                sceneData.cameraRight[0],
                sceneData.cameraRight[1],
                sceneData.cameraRight[2],
                maxBounces,
                sceneData.cameraUp[0],
                sceneData.cameraUp[1],
                sceneData.cameraUp[2],
                0.0
            ]
        ), 0, 16
    )

    const voxelData: Float32Array = new Float32Array(8 * scene.data.totalVoxelCount);
    const objectInfos: { voxelOffset: number; objectVoxelCount: number }[] = [];
    let voxelIndex = 0;

    scene.data.voxelObjects.forEach((voxelObject) => {

        // Initialize voxelOffset as the current value of voxelIndex
        const voxelOffset = voxelIndex;
        const voxelCount = voxelObject.voxels.length;

        // Store the ObjectInfo for this object
        objectInfos.push({
            voxelOffset: voxelOffset,
            objectVoxelCount: voxelCount,
        });

        voxelObject.voxels.forEach((voxel) => {
            const position = vec3.fromValues(voxel.x, voxel.y, voxel.z);
            const colorIndex = voxel.colorIndex;

            voxelData[8 * voxelIndex]     = position[0];
            voxelData[8 * voxelIndex + 1] = position[1];
            voxelData[8 * voxelIndex + 2] = position[2];
            voxelData[8 * voxelIndex + 3] = colorIndex;

            // Padding or additional data can be stored in the remaining float slots
            voxelData[8 * voxelIndex + 4] = 0;
            voxelData[8 * voxelIndex + 5] = 0;
            voxelData[8 * voxelIndex + 6] = 0;
            voxelData[8 * voxelIndex + 7] = 0;
    
            voxelIndex++;
        });
    });
    device.queue.writeBuffer(sceneBuffers.objectBuffer, 0, voxelData, 0, 8 * scene.data.totalVoxelCount);


    const objectInfoData = new Uint32Array(objectInfos.length * 2);
    objectInfos.forEach((info, i) => {
        objectInfoData[2 * i]     = info.voxelOffset;
        objectInfoData[2 * i + 1] = info.objectVoxelCount;
    });
    device.queue.writeBuffer(sceneBuffers.objectInfoBuffer, 0, objectInfoData);


    const BVHData = new Float32Array(9 * scene.data.sceneBVH.nodesUsed);
    for (let i = 0; i < scene.data.sceneBVH.nodesUsed; i++) {
        BVHData[9 * i]     = scene.data.sceneBVH.nodes[i].minCorner[0];
        BVHData[9 * i + 1] = scene.data.sceneBVH.nodes[i].minCorner[1];
        BVHData[9 * i + 2] = scene.data.sceneBVH.nodes[i].minCorner[2];
        BVHData[9 * i + 3] = scene.data.sceneBVH.nodes[i].leftChild;
        BVHData[9 * i + 4] = scene.data.sceneBVH.nodes[i].maxCorner[0];
        BVHData[9 * i + 5] = scene.data.sceneBVH.nodes[i].maxCorner[1];
        BVHData[9 * i + 6] = scene.data.sceneBVH.nodes[i].maxCorner[2];
        BVHData[9 * i + 7] = scene.data.sceneBVH.nodes[i].primitiveCount;
        BVHData[9 * i + 8] = scene.data.sceneBVH.nodes[i].objectIndex;
    }
    device.queue.writeBuffer(sceneBuffers.bvhNodeBuffer, 0, BVHData, 0, 9 * scene.data.sceneBVH.nodesUsed);
}