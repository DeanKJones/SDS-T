import { RenderPass } from "./renderPass";

import raytracer_kernel from "../gpu/rendering/raytracer_kernel.wgsl"
import screen_shader from "../gpu/image/screen_shader.wgsl"

import { BindGroupLayouts } from "./pipelineLayout";

export class Pipelines {

    device: GPUDevice;
    currentRenderPass: RenderPass;
    bindGroupLayouts!: BindGroupLayouts;
        
    ray_tracing_pipeline!: GPUComputePipeline;
    screen_pipeline!: GPURenderPipeline;

    constructor(device: GPUDevice, currentRenderPass: RenderPass) {
        this.device = device;
        this.currentRenderPass = currentRenderPass;
        this.bindGroupLayouts = new BindGroupLayouts(this.device);
    }

    async initialize() {
        await this.createScreenPipeline();
        await this.createRayTracingPipelines();
        
    }

    createRayTracingPipelines = async () => {
        const bindGroupLayout = this.bindGroupLayouts.createRayTracingBindGroupLayout();
        const ray_tracing_pipeline_layout = this.device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        });

        this.ray_tracing_pipeline = 
            this.device.createComputePipeline(
                {
                    label: "Ray Tracing Pipeline",
                    layout: ray_tracing_pipeline_layout,
            
                    compute: {
                        module: this.device.createShaderModule({code: raytracer_kernel,}),
                        entryPoint: 'main',
                    },
                }
            );
        }

    createScreenPipeline = async () => {
        const bindGroupLayout = this.bindGroupLayouts.createScreenBindGroupLayout();
        const screen_pipeline_layout = this.device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        });

        this.screen_pipeline = this.device.createRenderPipeline({
            label: "Screen Pipeline",
            layout: screen_pipeline_layout,
            
            vertex: {
                module: this.device.createShaderModule({
                code: screen_shader,
            }),
            entryPoint: 'vert_main',
            },

            fragment: {
                module: this.device.createShaderModule({
                code: screen_shader,
            }),
            entryPoint: 'frag_main',
            targets: [
                {
                    format: "bgra8unorm"
                }
            ]
            },

            primitive: {
                topology: "triangle-list"
            }
        });
    }
}