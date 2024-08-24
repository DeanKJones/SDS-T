import { gfx_scene_instance } from "./gfx_scene_instance";
import { RenderPass } from "./render_pass";
import { vec3 } from "gl-matrix";

export function prepareScene(gfx_scene_instance: gfx_scene_instance) 
{
    const { 
        scene, 
        renderInstance,
        renderInstance: { device, canvas },
        sceneBuffers 
    } = gfx_scene_instance;

    switch (renderInstance.currentRenderPass)
    {
        case RenderPass.Default:
            const sceneData = {
                cameraPos: scene.data.camera.position,
                cameraForwards: scene.data.camera.forwards,
                cameraRight: scene.data.camera.right,
                cameraUp: scene.data.camera.up,
                voxelCount: scene.data.voxelCount,
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
                        sceneData.voxelCount
                    ]
                ), 0, 16
            )
        
            // Prepare voxel data
            const voxelData: Float32Array = new Float32Array(8 * scene.data.voxelCount);
            let voxelIndex = 0;
            scene.data.voxels.forEach((voxelObject, objectIndex) => {
                for (let i = 0; i < voxelObject.voxels.length; i += 4) {
                    const position = vec3.fromValues(
                        voxelObject.voxels[i],
                        voxelObject.voxels[i + 1],
                        voxelObject.voxels[i + 2]
                    );
                    const colorIndex = voxelObject.voxels[i + 3];

                    // Transform voxel position by object's transform
                    vec3.transformMat4(position, position, voxelObject.transform);

                    voxelData[8 * voxelIndex] = position[0];
                    voxelData[8 * voxelIndex + 1] = position[1];
                    voxelData[8 * voxelIndex + 2] = position[2];
                    voxelData[8 * voxelIndex + 3] = colorIndex;
                    voxelData[8 * voxelIndex + 4] = objectIndex;
                    // Padding or additional data can be stored in the remaining float slots
                    voxelData[8 * voxelIndex + 5] = 0;
                    voxelData[8 * voxelIndex + 6] = 0;
                    voxelData[8 * voxelIndex + 7] = 0;

                    voxelIndex++;
                }
            });
        
            const BVHData = new Float32Array(8 * scene.data.nodesUsed);
            for (let i = 0; i < scene.data.nodesUsed; i++) {
                BVHData[8*i] = scene.data.nodes[i].minCorner[0];
                BVHData[8*i + 1] = scene.data.nodes[i].minCorner[1];
                BVHData[8*i + 2] = scene.data.nodes[i].minCorner[2];
                BVHData[8*i + 3] = scene.data.nodes[i].leftChild;
                BVHData[8*i + 4] = scene.data.nodes[i].maxCorner[0];
                BVHData[8*i + 5] = scene.data.nodes[i].maxCorner[1];
                BVHData[8*i + 6] = scene.data.nodes[i].maxCorner[2];
                BVHData[8*i + 7] = scene.data.nodes[i].primitiveCount;
            }
        
            const voxelIndexData: Float32Array = new Float32Array(scene.data.voxelCount);
            for (let i = 0; i < scene.data.voxelCount; i++) {
                voxelIndexData[i] = scene.data.voxelIndices[i];
            }
        
            device.queue.writeBuffer(sceneBuffers.voxelBuffer, 0, voxelData, 0, 8 * scene.data.voxelCount);
            device.queue.writeBuffer(sceneBuffers.nodeBuffer, 0, BVHData, 0, 8 * scene.data.nodesUsed);
            device.queue.writeBuffer(sceneBuffers.voxelIndexBuffer, 0, voxelIndexData, 0, scene.data.voxelCount);   

            break;  

        case RenderPass.BVHDebug:
            const aspectRatio: number = canvas.width / canvas.height;
            const viewMatrixData = new Float32Array(scene.data.camera.calculateProjectionMatrix(aspectRatio, 45, 0.1, 1000));
            const uniformData = new Float32Array(16 + 1);
            uniformData.set(viewMatrixData);

            device.queue.writeBuffer(gfx_scene_instance.sceneBuffers.uniformBuffer, 0, uniformData);
            
            const bvhNodeData: Float32Array = new Float32Array(8 * scene.data.nodesUsed);
            for (let i = 0; i < scene.data.nodesUsed; i++) {
                bvhNodeData[8*i] = scene.data.nodes[i].minCorner[0];
                bvhNodeData[8*i + 1] = scene.data.nodes[i].minCorner[1];
                bvhNodeData[8*i + 2] = scene.data.nodes[i].minCorner[2];
                bvhNodeData[8*i + 3] = scene.data.nodes[i].leftChild;
                bvhNodeData[8*i + 4] = scene.data.nodes[i].maxCorner[0];
                bvhNodeData[8*i + 5] = scene.data.nodes[i].maxCorner[1];
                bvhNodeData[8*i + 6] = scene.data.nodes[i].maxCorner[2];
                bvhNodeData[8*i + 7] = scene.data.nodes[i].primitiveCount;
            }
            device.queue.writeBuffer(sceneBuffers.nodeBuffer, 0, bvhNodeData, 0, 8 * scene.data.nodesUsed);
            
            break;
    }
}