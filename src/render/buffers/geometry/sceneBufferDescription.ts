
export class SceneBufferDescription {
    objectBuffer: GPUBuffer;
    objectInfoBuffer: GPUBuffer;
    bvhNodeBuffer: GPUBuffer;
    sceneParameters: GPUBuffer;

    constructor(device: GPUDevice, 
                objectBufferSize: number, 
                objectInfoBufferSize: number, 
                bvhNodeBufferSize: number) {

        // Object Buffer to store compacted scene object data
        this.objectBuffer = device.createBuffer({
            label: "Object Buffer",
            size: objectBufferSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        // Object Info Buffer to store compacted scene object info
        this.objectInfoBuffer = device.createBuffer({
            label: "Object Info Buffer",
            size: objectInfoBufferSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        // BVH Node Buffer to store compacted BVH node data
        this.bvhNodeBuffer = device.createBuffer({
            label: "BVH Node Buffer",
            size: bvhNodeBufferSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        // Scene Parameters Buffer (e.g., camera parameters)
        this.sceneParameters = device.createBuffer({
            label: "Scene Parameters Buffer",
            size: 64, // 4 vec4's = 64 bytes
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
    }
}
