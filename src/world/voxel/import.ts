//import { vec3, vec4 } from 'gl-matrix';
//import { Voxel } from './voxel';
//import readVox from 'vox-reader';
//import { VoxStructure } from 'vox-reader/types/types';

//export class VoxImporter {
    //static async importVox(url: string): Promise<Voxel> {
        //const buffer = await this.loadVoxelFile(url);

        // Check if the file starts with "VOX "
        //const header = new TextDecoder().decode(buffer.slice(0, 4));
        //if (header !== "VOX ") {
        //    throw new Error(`Invalid VOX file: expected header "VOX ", found "${header}"`);
        //}
//
        //let voxData: VoxStructure;
        //const newVoxelObject: Voxel = new Voxel("", new Uint8Array(), vec3.create(), 0, this.createDefaultPalette());
        //try {
        //    voxData = readVox(Buffer.from(buffer));
        //} catch (error) {
        //    console.error("Error parsing VOX file:", error);
        //    if (error instanceof Error) {
        //        throw new Error(`Failed to parse VOX file: ${error.message}`);
        //    } else {
        //        throw new Error('Failed to parse VOX file: Unknown error');
        //    }
        //}
//
        //const voxDataJSON = JSON.parse(JSON.stringify(voxData));
        //for (const key in voxDataJSON) {
        //    if (key == 'size') {
        //        newVoxelObject.size[0] = voxDataJSON[key].x;
        //        newVoxelObject.size[1] = voxDataJSON[key].y;
        //        newVoxelObject.size[2] = voxDataJSON[key].z;
        //    }
        //    if (key == 'xyzi') {
        //        // Number of Voxels in the Object File
        //        newVoxelObject.numberOfVoxels = voxDataJSON[key].numVoxels;
//
        //        newVoxelObject.voxels = new Uint8Array(voxDataJSON[key].values.length * 4);
        //        for (let i = 0; i < voxDataJSON[key].values.length; i++) {
        //            newVoxelObject.voxels[i * 4] = voxDataJSON[key].values[i].x;
        //            newVoxelObject.voxels[i * 4 + 1] = voxDataJSON[key].values[i].y;
        //            newVoxelObject.voxels[i * 4 + 2] = voxDataJSON[key].values[i].z;
        //            newVoxelObject.voxels[i * 4 + 3] = voxDataJSON[key].values[i].i;
        //        }
        //    }
        //    if (key == 'rgba') {
        //        newVoxelObject.pallet = new Array<vec4>();
        //        for (let i = 0; i < voxDataJSON[key].length; i++) {
        //            newVoxelObject.pallet.push(vec4.fromValues(
        //                voxDataJSON[key][i].r / 255.0,
        //                voxDataJSON[key][i].g / 255.0,
        //                voxDataJSON[key][i].b / 255.0,
        //                voxDataJSON[key][i].a / 255.0
        //            ));
        //        }
        //    }
        //}
        //newVoxelObject.id = url;
        //console.log("Imported new voxel object: ", newVoxelObject);
        //return newVoxelObject;
    //}

    //private static async loadVoxelFile(url: string): Promise<ArrayBuffer> {
    //    const response = await fetch(url);
    //    if (!response.ok) {
    //        throw new Error(`Failed to load VOX file: ${response.statusText}`);
    //    }
    //    return await response.arrayBuffer();
    //}
//}