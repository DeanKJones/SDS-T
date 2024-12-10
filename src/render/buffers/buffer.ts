

export function writeBuffer(device: GPUDevice, 
                     buffer: GPUBuffer, 
                     data: any, 
                     offset: number, 
                     size: number) {
    try {
        device.queue.writeBuffer(buffer, offset, data, 0, size);
    } catch (error) {
        console.error(`Failed to write buffer: ${error}`);
    }
}