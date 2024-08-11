import raytracer_kernel from "../gpu/shaders/raytracer_kernel.wgsl"
import screen_shader from "../gpu/shaders/screen_shader.wgsl"
import { Scene } from "../world/scene";
import { SceneBufferDescription } from "./geometry/sceneBufferDescription";

export class Renderer {

    canvas: HTMLCanvasElement;

    // Device/Context objects
    adapter!: GPUAdapter;
    device!: GPUDevice;
    context!: GPUCanvasContext;
    format!: GPUTextureFormat;

    //Assets
    color_buffer!: GPUTexture;
    color_buffer_view!: GPUTextureView;
    sampler!: GPUSampler;
    sceneParameters!: GPUBuffer;
    sceneBuffers!: SceneBufferDescription;

    // Pipeline objects
    ray_tracing_pipeline!: GPUComputePipeline
    ray_tracing_bind_group_layout!: GPUBindGroupLayout
    ray_tracing_bind_group!: GPUBindGroup
    screen_pipeline!: GPURenderPipeline
    screen_bind_group_layout!: GPUBindGroupLayout
    screen_bind_group!: GPUBindGroup

    frametime!: number
    logged!: Boolean

    constructor(canvas: HTMLCanvasElement){
        this.canvas = canvas;
    }

   async Initialize() {

        await this.setupDevice();
        await this.makeBindGroupLayouts();
        await this.createAssets();

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

    async makeBindGroupLayouts() {

        this.ray_tracing_bind_group_layout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: "write-only",
                        format: "rgba8unorm",
                        viewDimension: "2d"
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "uniform",
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false
                    }
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false
                    }
                },
                {
                    binding: 4,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false
                    }
                },
            ]

        });

        this.screen_bind_group_layout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {}
                },
            ]

        });

    }

    async createAssets() {
        
        this.color_buffer = this.device.createTexture(
            {
                size: {
                    width: this.canvas.width,
                    height: this.canvas.height,
                },
                format: "rgba8unorm",
                usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
            }
        );

        this.color_buffer_view = this.color_buffer.createView();

        const samplerDescriptor: GPUSamplerDescriptor = {
            addressModeU: "repeat",
            addressModeV: "repeat",
            magFilter: "linear",
            minFilter: "nearest",
            mipmapFilter: "nearest",
            maxAnisotropy: 1
        };
        this.sampler = this.device.createSampler(samplerDescriptor);

        const parameterBufferDescriptor: GPUBufferDescriptor = {
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        };
        this.sceneParameters = this.device.createBuffer(
            parameterBufferDescriptor
        );
    }

    async setupScene(scene: Scene) {
        this.createSceneBuffers(scene.data.triangleCount, scene.data.nodesUsed);
        await this.makeBindGroups();
        await this.makePipelines();
    }

    async makeBindGroups() {

        this.ray_tracing_bind_group = this.device.createBindGroup({
            layout: this.ray_tracing_bind_group_layout,
            entries: [
                {
                    binding: 0,
                    resource: this.color_buffer_view
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.sceneParameters,
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: this.sceneBuffers.triangleBuffer,
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
                        buffer: this.sceneBuffers.triangleIndexBuffer,
                    }
                },
            ]
        });

        this.screen_bind_group = this.device.createBindGroup({
            layout: this.screen_bind_group_layout,
            entries: [
                {
                    binding: 0,
                    resource:  this.sampler
                },
                {
                    binding: 1,
                    resource: this.color_buffer_view
                }
            ]
        });

    }

    async makePipelines() {
        
        const ray_tracing_pipeline_layout = this.device.createPipelineLayout({
            bindGroupLayouts: [this.ray_tracing_bind_group_layout]
        });

        this.ray_tracing_pipeline = 
            this.device.createComputePipeline(
                {
                    layout: ray_tracing_pipeline_layout,
            
                    compute: {
                        module: this.device.createShaderModule({code: raytracer_kernel,}),
                        entryPoint: 'main',
                    },
                }
            );

        const screen_pipeline_layout = this.device.createPipelineLayout({
            bindGroupLayouts: [this.screen_bind_group_layout]
        });

        this.screen_pipeline = this.device.createRenderPipeline({
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

    createSceneBuffers(triangleCount: number, nodesUsed: number) {
        this.sceneBuffers = new SceneBufferDescription(this.device, triangleCount, nodesUsed);
    }

    prepareScene(scene: Scene) {

        const sceneData = {
            cameraPos: scene.data.camera.position,
            cameraForwards: scene.data.camera.forwards,
            cameraRight: scene.data.camera.right,
            cameraUp: scene.data.camera.up,
            triangleCount: scene.data.triangleCount,
        }
        const maxBounces: number = 4;
        this.device.queue.writeBuffer(
            this.sceneParameters, 0,
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
            triangleData[16 * i + 15] = 0.0;
        }

        const nodeData: Float32Array = new Float32Array(8 * scene.data.nodesUsed);
        for (let i = 0; i < scene.data.nodesUsed; i++) {
            nodeData[8*i] = scene.data.nodes[i].minCorner[0];
            nodeData[8*i + 1] = scene.data.nodes[i].minCorner[1];
            nodeData[8*i + 2] = scene.data.nodes[i].minCorner[2];
            nodeData[8*i + 3] = scene.data.nodes[i].leftChild;
            nodeData[8*i + 4] = scene.data.nodes[i].maxCorner[0];
            nodeData[8*i + 5] = scene.data.nodes[i].maxCorner[1];
            nodeData[8*i + 6] = scene.data.nodes[i].maxCorner[2];
            nodeData[8*i + 7] = scene.data.nodes[i].primitiveCount;
        }

        const triangleIndexData: Float32Array = new Float32Array(scene.data.triangleCount);
        for (let i = 0; i < scene.data.triangleCount; i++) {
            triangleIndexData[i] = scene.data.triangleIndices[i];
        }

        this.device.queue.writeBuffer(this.sceneBuffers.triangleBuffer, 0, triangleData, 0, 16 * scene.data.triangleCount);
        this.device.queue.writeBuffer(this.sceneBuffers.nodeBuffer, 0, nodeData, 0, 8 * scene.data.nodesUsed);
        this.device.queue.writeBuffer(this.sceneBuffers.triangleIndexBuffer, 0, triangleIndexData, 0, scene.data.triangleCount);
    }

    render = (scene: Scene) => {
        if (!this.sceneBuffers) {
            this.createSceneBuffers(scene.data.triangleCount, scene.data.nodesUsed);
        }

        let start: number = performance.now();

        this.prepareScene(scene);

        const commandEncoder : GPUCommandEncoder = this.device.createCommandEncoder();

        const ray_trace_pass : GPUComputePassEncoder = commandEncoder.beginComputePass();
        ray_trace_pass.setPipeline(this.ray_tracing_pipeline);
        ray_trace_pass.setBindGroup(0, this.ray_tracing_bind_group);
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

        renderpass.setPipeline(this.screen_pipeline);
        renderpass.setBindGroup(0, this.screen_bind_group);
        renderpass.draw(3 * scene.data.triangleCount, 1, 0, 0);
        
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
}