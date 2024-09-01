import { vec3, vec4 } from "gl-matrix";
import { Voxel } from "./voxel";


export function createDefaultVoxel(): Voxel {
    const id = "default";
    const voxels = new Uint8Array(27); // 3x3x3 voxel block
    for (let i = 0; i < 27; i++) {
        voxels[i] = 1; // Assign color index 1 to each voxel
    }
    const size = vec3.fromValues(3, 3, 3);
    const numberOfVoxels = 27; // 3 * 3 * 3
    const pallet = [vec4.fromValues(1, 1, 1, 1)]; // Default color white

    return new Voxel(id, voxels, size, numberOfVoxels, pallet);
}