

export class BindGroupLayouts {

    device: GPUDevice;

    ray_tracing_bind_group_layout!: GPUBindGroupLayout;
    screen_bind_group_layout!: GPUBindGroupLayout;

    constructor(device: GPUDevice) {
        this.device = device;
    }

    createRayTracingBindGroupLayout = () => {
        this.ray_tracing_bind_group_layout = this.device.createBindGroupLayout({
            label: "Ray Tracing Bind Group Layout",
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
                        hasDynamicOffset: false,
                        minBindingSize: 64,
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false,
                        minBindingSize: 0,
                    }
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false,
                        minBindingSize: 0,
                    }
                },
                {
                    binding: 4,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false,
                        minBindingSize: 0,
                    }
                },
            ]
        });
        return this.ray_tracing_bind_group_layout;
    }

    createScreenBindGroupLayout = () => {
        this.screen_bind_group_layout = this.device.createBindGroupLayout({
            label: "Screen Bind Group Layout",
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
        return this.screen_bind_group_layout;
    }
}