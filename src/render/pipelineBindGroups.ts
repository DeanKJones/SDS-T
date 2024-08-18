
/*
export class BindGroups {
    device: GPUDevice;
    currentRenderPass: RenderPass;
    pipelines: Pipelines;
    scene: Scene;
    bindGroupLayouts!: BindGroupLayouts;

    ray_tracing_bind_group!: GPUBindGroup;
    screen_bind_group!: GPUBindGroup;
    bvh_debug_bind_group!: GPUBindGroup;

    constructor(device: GPUDevice, currentRenderPass: RenderPass) {
        this.device = device;
        this.currentRenderPass = currentRenderPass;
        this.bindGroupLayouts = new BindGroupLayouts(this.device);
    }

}

Here when we initialize the BindGroups class, we can update the pipeline init code so that 
async initialize() {
    await this.createScreenPipeline();
    
    if (this.currentRenderPass === RenderPass.Default) {
        await this.createRayTracingPipelines();
    } else if (this.currentRenderPass === RenderPass.BVHDebug) {
        await this.createBVHPipeline();
    } else {
        console.error("Invalid render pass");
    }
}
    is used and we can maintain which pipelines are needed at which time. 

*/