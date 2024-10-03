import { vec4 } from "gl-matrix";
import { Voxel } from "./voxel";
import { VoxelObject } from "./voxelObject";


export function createDefaultVoxel(): VoxelObject {
    const id = "default";
    const voxels: Voxel[] = [];

    // Create 3x3x3 voxel block
    for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
            for (let z = 0; z < 3; z++) {
                voxels.push(new Voxel(x, y, z, 1)); // Assign color index 1 to each voxel
            }
        }
    }

    const numberOfVoxels = voxels.length;
    const pallet = [vec4.fromValues(1, 1, 1, 1)]; // Default color white

    return new VoxelObject(id, voxels, numberOfVoxels, pallet);
}