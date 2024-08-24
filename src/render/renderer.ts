
import { Scene } from "../world/scene";
import { RenderPass } from "./render_pass";
import { SceneBufferDescription } from "./buffers/geometry/sceneBufferDescription";
import { prepareScene } from "./gfx_scene";
import { Pipelines } from "./pipeline";
import { ScreenBufferDescription } from "./buffers/screenBufferDescription";
import { PipelineBindGroups } from "./pipelineBindGroups";
import { generateBVHLineVertices } from "./debugging/BVHDebugRenderHelpers";
import shaderCode from "../gpu/shaders/bvh_debug_shader.wgsl";
import { Node } from "../world/bvh/node";
import { Camera } from "../world/camera";

export class Renderer {

    canvas: HTMLCanvasElement;

    // Device/Context objects
    adapter!: GPUAdapter;
    device!: GPUDevice;
    context!: GPUCanvasContext;
    format!: GPUTextureFormat;

    //Assets
    screenBuffers!: ScreenBufferDescription;
    sceneBuffers!: SceneBufferDescription;

    renderPipeline!: Pipelines;
    pipelineBindGroups!: PipelineBindGroups;

    frametime!: number
    logged!: Boolean
    currentRenderPass: RenderPass = RenderPass.Default;


    constructor(canvas: HTMLCanvasElement){
        this.canvas = canvas;
    }

   async Initialize() {

        await this.setupDevice();
        this.renderPipeline = new Pipelines(this.device, this.currentRenderPass);
        this.createScreenBuffers();
        await this.renderPipeline.initialize();
        
        this.frametime = 16;
        this.logged = false;
    }

    async setupDevice() {
        try {
            //adapter: wrapper around (physical) GPU.
            //Describes features and limits
            const adapter = await navigator.gpu?.requestAdapter();
            if (!adapter) {
                throw new Error("Failed to get GPU adapter.");
            }
            this.adapter = adapter;
            console.log("GPU adapter obtained:", this.adapter);

            console.log("Requesting GPU device...");
            //device: wrapper around GPU functionality
            //Function calls are made through the device
            const device = await this.adapter.requestDevice();
            if (!device) {
                throw new Error("Failed to get GPU device.");
            }
            this.device = device;

            this.device.lost.then((info) => {
                console.error("WebGPU device was lost:", info);
                // Attempt to recreate the device
                this.setupDevice();
            });
            
            console.log("GPU device obtained:", this.device);
            
            console.log("Getting WebGPU context...");
            //context: similar to vulkan instance (or OpenGL context)
            const context = this.canvas.getContext("webgpu");
            if (!context) {
                throw new Error("Failed to get WebGPU context.");
            }
            this.context = context;
            console.log("WebGPU context obtained:", this.context);
            console.log("Configuring context...");

            this.format = "bgra8unorm";
            this.context.configure({
                device: this.device,
                format: this.format,
                alphaMode: "opaque"
            });
            console.log("Context configured successfully.");

            // Add cleanup on unload
            const cleanup = () => {
                console.log("Cleaning up WebGPU resources...");
                if (this.device) {
                    this.device.destroy();
                }
            };
            window.addEventListener('unload', cleanup);
            window.addEventListener('beforeunload', cleanup);

        } catch (error) {
            console.error("Error during WebGPU setup:", error);
        }
    }

    async setupScene(scene: Scene) {
        this.createSceneBuffers(scene.data.voxelCount, scene.data.nodesUsed);
        this.pipelineBindGroups = new PipelineBindGroups(this.device, 
            this.currentRenderPass, 
            this.screenBuffers, 
            this.sceneBuffers);
        await this.pipelineBindGroups.initialize();
    }

    createSceneBuffers(voxelCount: number, nodesUsed: number) {
        this.sceneBuffers = new SceneBufferDescription(this.device, voxelCount, nodesUsed);
    }

    createScreenBuffers() {
        this.screenBuffers = new ScreenBufferDescription(this.device, this.canvas);
    }
    
    render(scene: Scene) {
        if (!this.sceneBuffers) {
            this.createSceneBuffers(scene.data.voxelCount, scene.data.nodesUsed);
        }
        const gfx_scene_instance = {
            scene: scene,
            sceneBuffers: this.sceneBuffers,
            renderInstance: this
        }
        prepareScene(gfx_scene_instance);

        switch (this.currentRenderPass) {
            case RenderPass.Default:
                this.renderDefault(gfx_scene_instance.scene.data.voxelCount);
                break;
            case RenderPass.BVHDebug:
                this.renderBVHDebug(gfx_scene_instance.scene.data.nodes, gfx_scene_instance.scene.data.camera);
                break;
        }
    }

    renderDefault = (voxelCount: number) => {
        let start: number = performance.now();

        const commandEncoder : GPUCommandEncoder = this.device.createCommandEncoder();

        const ray_trace_pass : GPUComputePassEncoder = commandEncoder.beginComputePass();
        ray_trace_pass.setPipeline(this.renderPipeline.ray_tracing_pipeline);
        ray_trace_pass.setBindGroup(0, this.pipelineBindGroups.ray_tracing_bind_group);
        ray_trace_pass.dispatchWorkgroups(
            this.canvas.width, 
            this.canvas.height, 1
        );
        ray_trace_pass.end();

        const textureView : GPUTextureView = this.context.getCurrentTexture().createView();
        const renderpass : GPURenderPassEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: {r: 0.5, g: 0.0, b: 0.25, a: 1.0},
                loadOp: "clear",
                storeOp: "store"
            }]
        });

        renderpass.setPipeline(this.renderPipeline.screen_pipeline);
        renderpass.setBindGroup(0, this.pipelineBindGroups.screen_bind_group);
        renderpass.draw(voxelCount, 1, 0, 0);
        
        renderpass.end();
    
        this.device.queue.submit([commandEncoder.finish()]);

        this.device.queue.onSubmittedWorkDone().then(
            () => {
                let end: number = performance.now();
                this.frametime = end - start;
                let performanceLabel: HTMLElement =  <HTMLElement> document.getElementById("render-time");
                if (performanceLabel) {
                    performanceLabel.innerText = this.frametime.toString();
                }
            }
        );
    }   

    renderBVHDebug = (nodes: Array<Node>, camera: Camera) => {

        let start: number = performance.now();

        const vertices = generateBVHLineVertices(nodes);
        const maxDepth = Math.max(...vertices.filter((_, i) => i % 4 === 3));

        // Create vertex buffer
        const vertexBuffer = this.device.createBuffer({
            size: vertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.device.queue.writeBuffer(vertexBuffer, 0, vertices);

        // Create uniform buffer
        const uniformBuffer = this.device.createBuffer({
            size: 4 * 32 + 4, // mat4 + float
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // Create bind group layout and pipeline layout
        const bindGroupLayout = this.device.createBindGroupLayout({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: { type: 'uniform' }
            }]
        });

        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        });

        // Create render pipeline
        const pipeline = this.device.createRenderPipeline({
            layout: pipelineLayout,
            vertex: {
                module: this.device.createShaderModule({ code: shaderCode }),
                entryPoint: 'vertexMain',
                buffers: [{
                    arrayStride: 4 * 64, // vec3 + float
                    attributes: [
                        { shaderLocation: 0, offset: 0, format: 'float32x4' }, // position
                        { shaderLocation: 1, offset: 4 * 8, format: 'float32x4' } // color  
                    ]
                }]
            },
            fragment: {
                module: this.device.createShaderModule({ code: shaderCode }),
                entryPoint: 'fragmentMain',
                targets: [{ format: this.context.getCurrentTexture().format }]
            },
            primitive: {
                topology: 'line-list'
            }
        });

        // Create bind group
        const bindGroup = this.device.createBindGroup({
            layout: bindGroupLayout,
            entries: [{
                binding: 0,
                resource: { buffer: uniformBuffer }
            }]
        });

        // Update uniform buffer with new view-projection matrix and max depth
        const viewProjectionMatrix = camera.viewMatrix; // Calculate this based on your camera
        const uniformData = new Float32Array(16 + 1);
        uniformData.set(viewProjectionMatrix);
        uniformData[16] = maxDepth;
        this.device.queue.writeBuffer(uniformBuffer, 0, uniformData);

        const commandEncoder = this.device.createCommandEncoder();
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                loadOp: 'clear',
                storeOp: 'store',
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 }
            }]
        });

        renderPass.setPipeline(pipeline);
        renderPass.setBindGroup(0, bindGroup);
        renderPass.setVertexBuffer(0, vertexBuffer);
        renderPass.draw(vertices.length / 4, 1, 0, 0);
        renderPass.end();

        this.device.queue.submit([commandEncoder.finish()]);

        this.device.queue.onSubmittedWorkDone().then(
            () => {
                let end: number = performance.now();
                this.frametime = end - start;
                let performanceLabel: HTMLElement =  <HTMLElement> document.getElementById("render-time");
                if (performanceLabel) {
                    performanceLabel.innerText = this.frametime.toString();
                }
            }
        );
    }
}