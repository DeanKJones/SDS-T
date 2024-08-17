export class SceneBufferDescription {
    triangleBuffer: GPUBuffer;
    nodeBuffer: GPUBuffer;
    triangleIndexBuffer: GPUBuffer;
    sceneParameters: GPUBuffer;
    viewMatrixBuffer: GPUBuffer;

    constructor(device: GPUDevice, triangleCount: number, nodesUsed: number) {
        this.triangleBuffer = device.createBuffer({
            size: 64 * triangleCount,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        this.nodeBuffer = device.createBuffer({
            size: 32 * nodesUsed,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        this.triangleIndexBuffer = device.createBuffer({
            size: 4 * triangleCount,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        this.sceneParameters = device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.viewMatrixBuffer = device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
    }
}