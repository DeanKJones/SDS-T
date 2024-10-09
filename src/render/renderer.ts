
import { Scene } from "../world/scene";
import { RenderPass } from "./renderPass";
import { SceneBufferDescription } from "./buffers/geometry/sceneBufferDescription";
import { prepareScene } from "./gfx_scene";
import { Pipelines } from "./pipeline";
import { ScreenBufferDescription } from "./buffers/screenBufferDescription";
import { PipelineBindGroups } from "./pipelineBindGroups";

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
        const voxelCount = scene.data.getVoxelCount();
        const objectCount = scene.data.sceneObjectCount;
        const nodesUsed = scene.data.sceneBVH.nodesUsed;

        this.createSceneBuffers(voxelCount, objectCount, nodesUsed);
        this.pipelineBindGroups = new PipelineBindGroups(this.device, 
            this.currentRenderPass, 
            this.screenBuffers, 
            this.sceneBuffers);
        await this.pipelineBindGroups.initialize();
    }

    createSceneBuffers(voxelCount: number, objectCount:number, nodesUsed: number) {
        const objectBufferSize = 8 * 4 * voxelCount;
        const objectInfoBufferSize = 8 * 2 * objectCount;
        const bvhNodeBufferSize = 48 * nodesUsed;
        this.sceneBuffers = new SceneBufferDescription(this.device, 
                                                    objectBufferSize,
                                                    objectInfoBufferSize, 
                                                    bvhNodeBufferSize);
    }

    createScreenBuffers() {
        this.screenBuffers = new ScreenBufferDescription(this.device, this.canvas);
    }
    
    render(scene: Scene) {
        if (!this.sceneBuffers) {
            this.createSceneBuffers(scene.data.totalVoxelCount, 
                                    scene.data.sceneObjectCount, 
                                    scene.data.sceneBVH.nodesUsed);
        }
        const gfx_scene_instance = {
            scene: scene,
            sceneBuffers: this.sceneBuffers,
            renderInstance: this
        }
        prepareScene(gfx_scene_instance);

        switch (this.currentRenderPass) {
            case RenderPass.Default:
                this.renderDefault(gfx_scene_instance.scene.data.totalVoxelCount);
        }
    }

    renderDefault = (voxelCount: number) => {
        let start: number = performance.now();

        const commandEncoder : GPUCommandEncoder = this.device.createCommandEncoder();

        const ray_trace_pass : GPUComputePassEncoder = commandEncoder.beginComputePass();
        ray_trace_pass.setPipeline(this.renderPipeline.ray_tracing_pipeline);
        ray_trace_pass.setBindGroup(0, this.pipelineBindGroups.ray_tracing_bind_group);

        const workgroupSizeX = 8;
        const workgroupSizeY = 8;
        const numWorkgroupsX = Math.ceil(this.canvas.width / workgroupSizeX);
        const numWorkgroupsY = Math.ceil(this.canvas.height / workgroupSizeY);

        ray_trace_pass.dispatchWorkgroups(numWorkgroupsX, numWorkgroupsY);
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

    renderUI(ctx: CanvasRenderingContext2D) {
        if (!ctx) return;
    
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
        // Header style
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = 'white';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
    
        // Scene Parameters Header
        ctx.fillText('Render Parameters', 10, 10);
    
        // Regular text style
        ctx.font = '12px Arial';

        // Frame time
        ctx.fillText(`Frame Time: ${this.frametime.toFixed(2)} ms`, 10, 60);

    }
}