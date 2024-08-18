import { RenderPass } from "./render_pass";

import raytracer_kernel from "../gpu/shaders/raytracer_kernel.wgsl"
import bvh_debug_shader from "../gpu/shaders/bvh_debug_shader.wgsl";
import screen_shader from "../gpu/shaders/screen_shader.wgsl"

import { BindGroupLayouts } from "./pipelineLayout";

export class Pipelines {

    device: GPUDevice;
    currentRenderPass: RenderPass;
    bindGroupLayouts!: BindGroupLayouts;
        
    ray_tracing_pipeline!: GPUComputePipeline;
    screen_pipeline!: GPURenderPipeline;
    bvh_debug_pipeline!: GPURenderPipeline;


    constructor(device: GPUDevice, currentRenderPass: RenderPass) {
        this.device = device;
        this.currentRenderPass = currentRenderPass;
        this.bindGroupLayouts = new BindGroupLayouts(this.device);
    }

    async initialize() {
        await this.createScreenPipeline();
        await this.createRayTracingPipelines();
        await this.createBVHPipeline();
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

    
    createBVHPipeline = async () => {
        const bindGroupLayout = this.bindGroupLayouts.createBVHDebugBindGroupLayout();
        const bvh_debug_pipeline_layout = this.device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        });
        // Set the vertex and fragment shader 
        const bvh_debug_shader_module = this.device.createShaderModule({
            code: bvh_debug_shader,
        });
        this.bvh_debug_pipeline = this.device.createRenderPipeline({
            label: "BVH Debug Pipeline",
            layout: bvh_debug_pipeline_layout,
            
            vertex: {
                module: bvh_debug_shader_module,
                entryPoint: 'vertexMain',
            },
        
            fragment: {
                module: bvh_debug_shader_module,
                entryPoint: 'fragmentMain',
                targets: [
                    {
                        format: "bgra8unorm"
                    }
                ],
            },
        
            primitive: {
                topology: 'line-list',
            },
        });
    }
}