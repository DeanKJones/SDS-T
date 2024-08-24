export class SceneBufferDescription {

    voxelBuffer: GPUBuffer;
    voxelIndexBuffer: GPUBuffer;
    nodeBuffer: GPUBuffer;
    sceneParameters: GPUBuffer;
    uniformBuffer: GPUBuffer;

    constructor(device: GPUDevice, voxelCount: number, nodesUsed: number) {
        this.voxelBuffer = device.createBuffer({
            label: "Voxel Buffer",
            size: 8 * 4 * voxelCount,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });

        this.voxelIndexBuffer = device.createBuffer({
            label: "Voxel Index Buffer",
            size: 4 * voxelCount,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });

        this.nodeBuffer = device.createBuffer({
            label: "Node Buffer",
            size: 32 * nodesUsed,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        this.sceneParameters = device.createBuffer({
            label: "Scene Parameters Buffer",
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.uniformBuffer = device.createBuffer({
            size: 4 * 16 + 4, // mat4 + float
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
    }
}