import { SceneBufferDescription } from "./buffers/geometry/sceneBufferDescription";
import { ScreenBufferDescription } from "./buffers/screenBufferDescription";
import { BindGroupLayouts } from "./pipelineLayout";
import { RenderPass } from "./render_pass";


export class PipelineBindGroups {
    device: GPUDevice;
    currentRenderPass: RenderPass;
    screenBuffers!: ScreenBufferDescription;
    sceneBuffers!: SceneBufferDescription;
    bindGroupLayouts!: BindGroupLayouts;

    ray_tracing_bind_group!: GPUBindGroup;
    screen_bind_group!: GPUBindGroup;
    bvh_debug_bind_group!: GPUBindGroup;

    constructor(device: GPUDevice, 
                currentRenderPass: RenderPass, 
                screenBuffers: ScreenBufferDescription, 
                sceneBuffers: SceneBufferDescription) {
        this.device = device;
        this.currentRenderPass = currentRenderPass;
        this.screenBuffers = screenBuffers;
        this.sceneBuffers = sceneBuffers;
        this.bindGroupLayouts = new BindGroupLayouts(this.device);
    }

    async initialize() {
        await this.CreateScreenBindGroup();
        
        if (this.currentRenderPass === RenderPass.Default) {
            await this.CreateRayTracingBindGroup();
        } else if (this.currentRenderPass === RenderPass.BVHDebug) {
            await this.CreateBVHDebugBindGroup();
        } else {
            console.error("Invalid render pass");
        }
    }

    CreateRayTracingBindGroup = async () => {
        const bindGroupLayout = this.bindGroupLayouts.createRayTracingBindGroupLayout();
        
        this.ray_tracing_bind_group = this.device.createBindGroup({
            label: "Ray Tracing Bind Group",
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: this.screenBuffers.color_buffer_view
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.sceneBuffers.sceneParameters,
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: this.sceneBuffers.voxelBuffer,
                    }
                },
                {
                    binding: 3,
                    resource: {
                        buffer: this.sceneBuffers.nodeBuffer,
                    }
                },
                {
                    binding: 4,
                    resource: {
                        buffer: this.sceneBuffers.voxelIndexBuffer,
                    }
                },
            ]
        });
    }

    CreateScreenBindGroup = async () => {
        const bindGroupLayout = this.bindGroupLayouts.createScreenBindGroupLayout();

        this.screen_bind_group = this.device.createBindGroup({
            label: "Screen Bind Group",
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource:  this.screenBuffers.sampler
                },
                {
                    binding: 1,
                    resource: this.screenBuffers.color_buffer_view
                }
            ]
        });
    }

    CreateBVHDebugBindGroup = async () => {
        const bindGroupLayout = this.bindGroupLayouts.createBVHDebugBindGroupLayout();

        this.bvh_debug_bind_group = this.device.createBindGroup({
            label: "BVH Debug Bind Group",
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.sceneBuffers.nodeBuffer,
                    } 
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.sceneBuffers.uniformBuffer,
                    }
                }
            ]
        });
    }
}