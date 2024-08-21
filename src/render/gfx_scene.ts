import { gfx_scene_instance } from "./gfx_scene_instance";
import { RenderPass } from "./render_pass";

export function prepareScene(gfx_scene_instance: gfx_scene_instance) 
{

    const { 
        scene, 
        renderInstance,
        renderInstance: { device, canvas },
        sceneBuffers } = gfx_scene_instance;

    switch (renderInstance.currentRenderPass)
    {
// Switch Case for Default
        case RenderPass.Default:
            const sceneData = {
                cameraPos: scene.data.camera.position,
                cameraForwards: scene.data.camera.forwards,
                cameraRight: scene.data.camera.right,
                cameraUp: scene.data.camera.up,
                triangleCount: scene.data.triangleCount,
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
                        sceneData.triangleCount
                    ]
                ), 0, 16
            )
        
            const triangleData: Float32Array = new Float32Array(16 * scene.data.triangleCount);
            for (let i = 0; i < scene.data.triangleCount; i++) {
                for (let vertex = 0; vertex < 3; vertex++) {
                    for (let dimension = 0; dimension < 3; dimension++) {
                        triangleData[16 * i + 4 * vertex + dimension] = 
                            scene.data.triangles[i].vertices[vertex][dimension];
                    }
                    triangleData[16 * i + 4 * vertex + 3] = 0.0;
                }
                for (let channel = 0; channel < 3; channel++) {
                    triangleData[16 * i + 12 + channel] = scene.data.triangles[i].color[channel];
                }
                
                triangleData[16 * i + 15] = scene.data.triangles[i].isLambert ? 0.0 : 1.0;
            }
        
            const RaytracingBVHData = new Float32Array(8 * scene.data.nodesUsed);
            for (let i = 0; i < scene.data.nodesUsed; i++) {
                RaytracingBVHData[8*i] = scene.data.nodes[i].minCorner[0];
                RaytracingBVHData[8*i + 1] = scene.data.nodes[i].minCorner[1];
                RaytracingBVHData[8*i + 2] = scene.data.nodes[i].minCorner[2];
                RaytracingBVHData[8*i + 3] = scene.data.nodes[i].leftChild;
                RaytracingBVHData[8*i + 4] = scene.data.nodes[i].maxCorner[0];
                RaytracingBVHData[8*i + 5] = scene.data.nodes[i].maxCorner[1];
                RaytracingBVHData[8*i + 6] = scene.data.nodes[i].maxCorner[2];
                RaytracingBVHData[8*i + 7] = scene.data.nodes[i].primitiveCount;
            }
        
            const triangleIndexData: Float32Array = new Float32Array(scene.data.triangleCount);
            for (let i = 0; i < scene.data.triangleCount; i++) {
                triangleIndexData[i] = scene.data.triangleIndices[i];
            }
        
            device.queue.writeBuffer(sceneBuffers.triangleBuffer, 0, triangleData, 0, 16 * scene.data.triangleCount);
            device.queue.writeBuffer(sceneBuffers.nodeBuffer, 0, RaytracingBVHData, 0, 8 * scene.data.nodesUsed);
            device.queue.writeBuffer(sceneBuffers.triangleIndexBuffer, 0, triangleIndexData, 0, scene.data.triangleCount);   

            break;  
// Switch Case for BVHDebug
        case RenderPass.BVHDebug:

            const aspectRatio: number = canvas.width / canvas.height;
            const viewMatrixData = new Float32Array(scene.data.camera.calculateProjectionMatrix(aspectRatio, 45, 0.1, 1000));
            device.queue.writeBuffer(gfx_scene_instance.sceneBuffers.viewMatrixBuffer, 0, viewMatrixData, 0, 16);
            
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