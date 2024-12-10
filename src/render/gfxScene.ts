import { gfx_scene_instance } from "./gfxSceneInstance";

const VOXEL_SIZE = 32;        // Size of Voxel struct in bytes
const OBJECT_INFO_SIZE = 16;  // Size of ObjectInfo struct in bytes
const BVH_NODE_SIZE = 48;     // Size of Node struct in bytes
const MAX_BOUNCES = 4;

export function prepareScene(gfx_scene_instance: gfx_scene_instance) {
    const { 
        scene,
        renderInstance: { device },
        sceneBuffers 
    } = gfx_scene_instance;


    // --------------------------------------------------------------
    // Prepare Scene Parameters Buffer
    // --------------------------------------------------------------

    const sceneParametersBuffer = new ArrayBuffer(64); // 4 vec4's = 64 bytes
    const sceneParametersView = new DataView(sceneParametersBuffer);

    // Write camera parameters into the buffer
    let offset = 0;

    // cameraPos (vec3<f32> + padding)
    sceneParametersView.setFloat32(offset, scene.data.camera.position[0], true);
    sceneParametersView.setFloat32(offset + 4, scene.data.camera.position[1], true);
    sceneParametersView.setFloat32(offset + 8, scene.data.camera.position[2], true);
    sceneParametersView.setFloat32(offset + 12, 0.0, true); // Padding
    offset += 16;

    // cameraForwards (vec3<f32> + padding)
    sceneParametersView.setFloat32(offset, scene.data.camera.forwards[0], true);
    sceneParametersView.setFloat32(offset + 4, scene.data.camera.forwards[1], true);
    sceneParametersView.setFloat32(offset + 8, scene.data.camera.forwards[2], true);
    sceneParametersView.setFloat32(offset + 12, 0.0, true); // Padding
    offset += 16;

    // cameraRight (vec3<f32> + padding)
    sceneParametersView.setFloat32(offset, scene.data.camera.right[0], true);
    sceneParametersView.setFloat32(offset + 4, scene.data.camera.right[1], true);
    sceneParametersView.setFloat32(offset + 8, scene.data.camera.right[2], true);
    sceneParametersView.setFloat32(offset + 12, MAX_BOUNCES, true); // Using the w component for max bounces
    offset += 16;

    // cameraUp (vec3<f32> + padding)
    sceneParametersView.setFloat32(offset, scene.data.camera.up[0], true);
    sceneParametersView.setFloat32(offset + 4, scene.data.camera.up[1], true);
    sceneParametersView.setFloat32(offset + 8, scene.data.camera.up[2], true);
    sceneParametersView.setFloat32(offset + 12, 0.0, true); // Padding

    // Write to GPU buffer
    device.queue.writeBuffer(
        sceneBuffers.sceneParameters,
        0,
        sceneParametersBuffer
    );

    // --------------------------------------------------------------
    // Prepare Voxel Data
    // --------------------------------------------------------------

    const totalVoxels = scene.data.totalVoxelCount;
    const objectBufferSize = VOXEL_SIZE * totalVoxels;  // VOXEL_SIZE = 32 bytes
    const voxelDataBuffer = new ArrayBuffer(objectBufferSize);
    const voxelDataView = new DataView(voxelDataBuffer);

    let voxelIndex = 0;
    scene.data.voxelObjects.forEach((voxelObject, objectIdx) => {
        voxelObject.voxelOffset = voxelIndex; // Store voxel offset in the object
        voxelObject.voxels.forEach((voxel) => {
            const baseOffset = voxelIndex * VOXEL_SIZE;

            // position (vec3<f32> + padding)
            voxelDataView.setFloat32(baseOffset + 0, voxel.position[0], true);
            voxelDataView.setFloat32(baseOffset + 4, voxel.position[1], true);
            voxelDataView.setFloat32(baseOffset + 8, voxel.position[2], true);
            voxelDataView.setFloat32(baseOffset + 12, 0.0, true); // Padding

            // colorIndex (u32)
            voxelDataView.setUint32(baseOffset + 16, voxel.colorIndex, true);

            // objectIndex (u32)
            voxelDataView.setUint32(baseOffset + 20, objectIdx, true);

            // objectVoxelCount (u32)
            voxelDataView.setUint32(baseOffset + 24, voxelObject.voxels.length, true);

            // Padding
            voxelDataView.setUint32(baseOffset + 28, 0, true);

            voxelIndex++;
        });
    });

    // Write voxel data to GPU buffer
    device.queue.writeBuffer(
        sceneBuffers.objectBuffer,
        0,
        voxelDataBuffer
    );

    // --------------------------------------------------------------
    // Prepare Object Info Data
    // --------------------------------------------------------------

    const totalObjects = scene.data.voxelObjects.length;
    const objectInfoBufferSize = OBJECT_INFO_SIZE * totalObjects;
    const objectInfoDataBuffer = new ArrayBuffer(objectInfoBufferSize);
    const objectInfoDataView = new DataView(objectInfoDataBuffer);

    scene.data.voxelObjects.forEach((voxelObject, objectIdx) => {
        const baseOffset = objectIdx * OBJECT_INFO_SIZE;

        // voxelOffset (u32)
        objectInfoDataView.setUint32(baseOffset + 0, voxelObject.voxelOffset, true);

        // voxelCount (u32)
        objectInfoDataView.setUint32(baseOffset + 4, voxelObject.voxels.length, true);

        // Padding
        objectInfoDataView.setUint32(baseOffset + 8, 0, true);
        objectInfoDataView.setUint32(baseOffset + 12, 0, true);
    });

    // Write object info data to GPU buffer
    device.queue.writeBuffer(
        sceneBuffers.objectInfoBuffer,
        0,
        objectInfoDataBuffer
    );

    
    // --------------------------------------------------------------
    // Prepare BVH Node Data
    // --------------------------------------------------------------

    const totalNodes = scene.data.sceneBVH.nodesUsed;
    const bvhNodeBufferSize = BVH_NODE_SIZE * totalNodes;
    const bvhDataBuffer = new ArrayBuffer(bvhNodeBufferSize);
    const bvhDataView = new DataView(bvhDataBuffer);

    for (let i = 0; i < totalNodes; i++) {
        const node = scene.data.sceneBVH.nodes[i];
        const baseOffset = i * BVH_NODE_SIZE;

        // minCorner (vec3<f32> + padding)
        bvhDataView.setFloat32(baseOffset + 0, node.minCorner[0], true);
        bvhDataView.setFloat32(baseOffset + 4, node.minCorner[1], true);
        bvhDataView.setFloat32(baseOffset + 8, node.minCorner[2], true);
        bvhDataView.setFloat32(baseOffset + 12, 0.0, true); // Padding

        // maxCorner (vec3<f32> + padding)
        bvhDataView.setFloat32(baseOffset + 16, node.maxCorner[0], true);
        bvhDataView.setFloat32(baseOffset + 20, node.maxCorner[1], true);
        bvhDataView.setFloat32(baseOffset + 24, node.maxCorner[2], true);
        bvhDataView.setFloat32(baseOffset + 28, 0.0, true); // Padding

        // leftChild (u32)
        bvhDataView.setUint32(baseOffset + 32, node.leftChild, true);

        // primitiveCount (u32)
        bvhDataView.setUint32(baseOffset + 36, node.primitiveCount, true);

        // objectIndex (i32)
        bvhDataView.setInt32(baseOffset + 40, node.objectIndex, true);

        // Padding
        bvhDataView.setUint32(baseOffset + 44, 0, true);
    }

    // Write BVH data to GPU buffer
    device.queue.writeBuffer(
        sceneBuffers.bvhNodeBuffer,
        0,
        bvhDataBuffer
    );

}
