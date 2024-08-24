import { vec3, vec4 } from 'gl-matrix';
import { Voxel } from './voxel';
import readVox from 'vox-reader';
import { VoxStructure } from 'vox-reader/types/types';

export class VoxImporter {
    static async importVox(url: string): Promise<Voxel> {
        const buffer = await this.loadVoxelFile(url);

        // Check if the file starts with "VOX "
        const header = new TextDecoder().decode(buffer.slice(0, 4));
        if (header !== "VOX ") {
            throw new Error(`Invalid VOX file: expected header "VOX ", found "${header}"`);
        }

        let voxData: VoxStructure;
        const newVoxelObject: Voxel = new Voxel("", new Uint8Array(), vec3.create(), 0, this.createDefaultPalette());
        try {
            voxData = readVox(Buffer.from(buffer));
        } catch (error) {
            console.error("Error parsing VOX file:", error);
            if (error instanceof Error) {
                throw new Error(`Failed to parse VOX file: ${error.message}`);
            } else {
                throw new Error('Failed to parse VOX file: Unknown error');
            }
        }

        const voxDataJSON = JSON.parse(JSON.stringify(voxData));
        for (const key in voxDataJSON) {
            if (key == 'size') {
                newVoxelObject.size[0] = voxDataJSON[key].x;
                newVoxelObject.size[1] = voxDataJSON[key].y;
                newVoxelObject.size[2] = voxDataJSON[key].z;
            }
            if (key == 'xyzi') {
                // Number of Voxels in the Object File
                newVoxelObject.numberOfVoxels = voxDataJSON[key].numVoxels;

                newVoxelObject.voxels = new Uint8Array(voxDataJSON[key].values.length * 4);
                for (let i = 0; i < voxDataJSON[key].values.length; i++) {
                    newVoxelObject.voxels[i * 4] = voxDataJSON[key].values[i].x;
                    newVoxelObject.voxels[i * 4 + 1] = voxDataJSON[key].values[i].y;
                    newVoxelObject.voxels[i * 4 + 2] = voxDataJSON[key].values[i].z;
                    newVoxelObject.voxels[i * 4 + 3] = voxDataJSON[key].values[i].i;
                }
            }
            if (key == 'rgba') {
                newVoxelObject.pallet = new Array<vec4>();
                for (let i = 0; i < voxDataJSON[key].length; i++) {
                    newVoxelObject.pallet.push(vec4.fromValues(
                        voxDataJSON[key][i].r / 255.0,
                        voxDataJSON[key][i].g / 255.0,
                        voxDataJSON[key][i].b / 255.0,
                        voxDataJSON[key][i].a / 255.0
                    ));
                }
            }
        }
        newVoxelObject.id = url;
        console.log("Imported new voxel object: ", newVoxelObject);
        return newVoxelObject;
    }

    private static async loadVoxelFile(url: string): Promise<ArrayBuffer> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load VOX file: ${response.statusText}`);
        }
        return await response.arrayBuffer();
    }

    private static createDefaultPalette(): Array<vec4> {
        const default_palette = new Array<vec4>(
            [0, 0, 0, 0],        // 0x00000000
            [1, 1, 1, 1],        // 0xffffffff
            [0.8, 1, 1, 1],      // 0xffccffff
            [0.6, 1, 1, 1],      // 0xff99ffff
            [0.4, 1, 1, 1],      // 0xff66ffff
            [0.2, 1, 1, 1],      // 0xff33ffff
            [0, 1, 1, 1],        // 0xff00ffff
            [1, 0.8, 1, 1],      // 0xffffccff
            [0.8, 0.8, 1, 1],    // 0xffccccff
            [0.6, 0.8, 1, 1],    // 0xff99ccff
            [0.4, 0.8, 1, 1],    // 0xff66ccff
            [0.2, 0.8, 1, 1],    // 0xff33ccff
            [0, 0.8, 1, 1],      // 0xff00ccff
            [1, 0.6, 1, 1],      // 0xffff99ff
            [0.8, 0.6, 1, 1],    // 0xffcc99ff
            [0.6, 0.6, 1, 1],    // 0xff9999ff
            [0.4, 0.6, 1, 1],    // 0xff6699ff
            [0.2, 0.6, 1, 1],    // 0xff3399ff
            [0, 0.6, 1, 1],      // 0xff0099ff
            [1, 0.4, 1, 1],      // 0xffff66ff
            [0.8, 0.4, 1, 1],    // 0xffcc66ff
            [0.6, 0.4, 1, 1],    // 0xff9966ff
            [0.4, 0.4, 1, 1],    // 0xff6666ff
            [0.2, 0.4, 1, 1],    // 0xff3366ff
            [0, 0.4, 1, 1],      // 0xff0066ff
            [1, 0.2, 1, 1],      // 0xffff33ff
            [0.8, 0.2, 1, 1],    // 0xffcc33ff
            [0.6, 0.2, 1, 1],    // 0xff9933ff
            [0.4, 0.2, 1, 1],    // 0xff6633ff
            [0.2, 0.2, 1, 1],    // 0xff3333ff
            [0, 0.2, 1, 1],      // 0xff0033ff
            [1, 0, 1, 1],        // 0xffff00ff
            [0.8, 0, 1, 1],      // 0xffcc00ff
            [0.6, 0, 1, 1],      // 0xff9900ff
            [0.4, 0, 1, 1],      // 0xff6600ff
            [0.2, 0, 1, 1],      // 0xff3300ff
            [0, 0, 1, 1],        // 0xff0000ff
            [1, 1, 0.8, 1],      // 0xffffffcc
            [0.8, 1, 0.8, 1],    // 0xffccffcc
            [0.6, 1, 0.8, 1],    // 0xff99ffcc
            [0.4, 1, 0.8, 1],    // 0xff66ffcc
            [0.2, 1, 0.8, 1],    // 0xff33ffcc
            [0, 1, 0.8, 1],      // 0xff00ffcc
            [1, 0.8, 0.8, 1],    // 0xffffcccc
            [0.8, 0.8, 0.8, 1],  // 0xffcccccc
            [0.6, 0.8, 0.8, 1],  // 0xff99cccc
            [0.4, 0.8, 0.8, 1],  // 0xff66cccc
            [0.2, 0.8, 0.8, 1],  // 0xff33cccc
            [0, 0.8, 0.8, 1],    // 0xff00cccc
            [1, 0.6, 0.8, 1],    // 0xffff99cc
            [0.8, 0.6, 0.8, 1],  // 0xffcc99cc
            [0.6, 0.6, 0.8, 1],  // 0xff9999cc
            [0.4, 0.6, 0.8, 1],  // 0xff6699cc
            [0.2, 0.6, 0.8, 1],  // 0xff3399cc
            [0, 0.6, 0.8, 1],    // 0xff0099cc
            [1, 0.4, 0.8, 1],    // 0xffff66cc
            [0.8, 0.4, 0.8, 1],  // 0xffcc66cc
            [0.6, 0.4, 0.8, 1],  // 0xff9966cc
            [0.4, 0.4, 0.8, 1],  // 0xff6666cc
            [0.2, 0.4, 0.8, 1],  // 0xff3366cc
            [0, 0.4, 0.8, 1],    // 0xff0066cc
            [1, 0.2, 0.8, 1],    // 0xffff33cc
            [0.8, 0.2, 0.8, 1],  // 0xffcc33cc
            [0.6, 0.2, 0.8, 1],  // 0xff9933cc
            [0.4, 0.2, 0.8, 1],  // 0xff6633cc
            [0.2, 0.2, 0.8, 1],  // 0xff3333cc
            [0, 0.2, 0.8, 1],    // 0xff0033cc
            [1, 0, 0.8, 1],      // 0xffff00cc
            [0.8, 0, 0.8, 1],    // 0xffcc00cc
            [0.6, 0, 0.8, 1],    // 0xff9900cc
            [0.4, 0, 0.8, 1],    // 0xff6600cc
            [0.2, 0, 0.8, 1],    // 0xff3300cc
            [0, 0, 0.8, 1],      // 0xff0000cc
            [1, 1, 0.6, 1],      // 0xffffff99
            [0.8, 1, 0.6, 1],    // 0xffccff99
            [0.6, 1, 0.6, 1],    // 0xff99ff99
            [0.4, 1, 0.6, 1],    // 0xff66ff99
            [0.2, 1, 0.6, 1],    // 0xff33ff99
            [0, 1, 0.6, 1],      // 0xff00ff99
            [1, 0.8, 0.6, 1],    // 0xffffcc99
            [0.8, 0.8, 0.6, 1],  // 0xffcccc99
            [0.6, 0.8, 0.6, 1],  // 0xff99cc99
            [0.4, 0.8, 0.6, 1],  // 0xff66cc99
            [0.2, 0.8, 0.6, 1],  // 0xff33cc99
            [0, 0.8, 0.6, 1],    // 0xff00cc99
            [1, 0.6, 0.6, 1],    // 0xffff9999
            [0.8, 0.6, 0.6, 1],  // 0xffcc9999
            [0.6, 0.6, 0.6, 1],  // 0xff999999
            [0.4, 0.6, 0.6, 1],  // 0xff669999
            [0.2, 0.6, 0.6, 1],  // 0xff339999
            [0, 0.6, 0.6, 1],    // 0xff009999
            [1, 0.4, 0.6, 1],    // 0xffff6699
            [0.8, 0.4, 0.6, 1],  // 0xffcc6699
            [0.6, 0.4, 0.6, 1],  // 0xff996699
            [0.4, 0.4, 0.6, 1],  // 0xff666699
            [0.2, 0.4, 0.6, 1],  // 0xff336699
            [0, 0.4, 0.6, 1],    // 0xff006699
            [1, 0.2, 0.6, 1],    // 0xffff3399
            [0.8, 0.2, 0.6, 1],  // 0xffcc3399
            [0.6, 0.2, 0.6, 1],  // 0xff993399
            [0.4, 0.2, 0.6, 1],  // 0xff663399
            [0.2, 0.2, 0.6, 1],  // 0xff333399
            [0, 0.2, 0.6, 1],    // 0xff003399
            [1, 0, 0.6, 1],      // 0xffff0099
            [0.8, 0, 0.6, 1],    // 0xffcc0099
            [0.6, 0, 0.6, 1],    // 0xff990099
            [0.4, 0, 0.6, 1],    // 0xff660099
            [0.2, 0, 0.6, 1],    // 0xff330099
            [0, 0, 0.6, 1],      // 0xff000099
            [1, 1, 0.4, 1],      // 0xffffff66
            [0.8, 1, 0.4, 1],    // 0xffccff66
            [0.6, 1, 0.4, 1],    // 0xff99ff66
            [0.4, 1, 0.4, 1],    // 0xff66ff66
            [0.2, 1, 0.4, 1],    // 0xff33ff66
            [0, 1, 0.4, 1],      // 0xff00ff66
            [1, 0.8, 0.4, 1],    // 0xffffcc66
            [0.8, 0.8, 0.4, 1],  // 0xffcccc66
            [0.6, 0.8, 0.4, 1],  // 0xff99cc66
            [0.4, 0.8, 0.4, 1],  // 0xff66cc66
            [0.2, 0.8, 0.4, 1],  // 0xff33cc66
            [0, 0.8, 0.4, 1],    // 0xff00cc66
            [1, 0.6, 0.4, 1],    // 0xffff9966
            [0.8, 0.6, 0.4, 1],  // 0xffcc9966
            [0.6, 0.6, 0.4, 1],  // 0xff999966
            [0.4, 0.6, 0.4, 1],  // 0xff669966
            [0.2, 0.6, 0.4, 1],  // 0xff339966
            [0, 0.6, 0.4, 1],    // 0xff009966
            [1, 0.4, 0.4, 1],    // 0xffff6666
            [0.8, 0.4, 0.4, 1],  // 0xffcc6666
            [0.6, 0.4, 0.4, 1],  // 0xff996666
            [0.4, 0.4, 0.4, 1],  // 0xff666666
            [0.2, 0.4, 0.4, 1],  // 0xff336666
            [0, 0.4, 0.4, 1],    // 0xff006666
            [1, 0.2, 0.4, 1],    // 0xffff3366
            [0.8, 0.2, 0.4, 1],  // 0xffcc3366
            [0.6, 0.2, 0.4, 1],  // 0xff993366
            [0.4, 0.2, 0.4, 1],  // 0xff663366
            [0.2, 0.2, 0.4, 1],  // 0xff333366
            [0, 0.2, 0.4, 1],    // 0xff003366
            [1, 0, 0.4, 1],      // 0xffff0066
            [0.8, 0, 0.4, 1],    // 0xffcc0066
            [0.6, 0, 0.4, 1],    // 0xff990066
            [0.4, 0, 0.4, 1],    // 0xff660066
            [0.2, 0, 0.4, 1],    // 0xff330066
            [0, 0, 0.4, 1],      // 0xff000066
            [1, 1, 0.2, 1],      // 0xffffff33
            [0.8, 1, 0.2, 1],    // 0xffccff33
            [0.6, 1, 0.2, 1],    // 0xff99ff33
            [0.4, 1, 0.2, 1],    // 0xff66ff33
            [0.2, 1, 0.2, 1],    // 0xff33ff33
            [0, 1, 0.2, 1],      // 0xff00ff33
            [1, 0.8, 0.2, 1],    // 0xffffcc33
            [0.8, 0.8, 0.2, 1],  // 0xffcccc33
            [0.6, 0.8, 0.2, 1],  // 0xff99cc33
            [0.4, 0.8, 0.2, 1],  // 0xff66cc33
            [0.2, 0.8, 0.2, 1],  // 0xff33cc33
            [0, 0.8, 0.2, 1],    // 0xff00cc33
            [1, 0.6, 0.2, 1],    // 0xffff9933
            [0.8, 0.6, 0.2, 1],  // 0xffcc9933
            [0.6, 0.6, 0.2, 1],  // 0xff999933
            [0.4, 0.6, 0.2, 1],  // 0xff669933
            [0.2, 0.6, 0.2, 1],  // 0xff339933
            [0, 0.6, 0.2, 1],    // 0xff009933
            [1, 0.4, 0.2, 1],    // 0xffff6633
            [0.8, 0.4, 0.2, 1],  // 0xffcc6633
            [0.6, 0.4, 0.2, 1],  // 0xff996633
            [0.4, 0.4, 0.2, 1],  // 0xff666633
            [0.2, 0.4, 0.2, 1],  // 0xff336633
            [0, 0.4, 0.2, 1],    // 0xff006633
            [1, 0.2, 0.2, 1],    // 0xffff3333
            [0.8, 0.2, 0.2, 1],  // 0xffcc3333
            [0.6, 0.2, 0.2, 1],  // 0xff993333
            [0.4, 0.2, 0.2, 1],  // 0xff663333
            [0.2, 0.2, 0.2, 1],  // 0xff333333
            [0, 0.2, 0.2, 1],    // 0xff003333
            [1, 0, 0.2, 1],      // 0xffff0033
            [0.8, 0, 0.2, 1],    // 0xffcc0033
            [0.6, 0, 0.2, 1],    // 0xff990033
            [0.4, 0, 0.2, 1],    // 0xff660033
            [0.2, 0, 0.2, 1],    // 0xff330033
            [0, 0, 0.2, 1],      // 0xff000033
            [1, 1, 0, 1],        // 0xffffff00
            [0.8, 1, 0, 1],      // 0xffccff00
            [0.6, 1, 0, 1],      // 0xff99ff00
            [0.4, 1, 0, 1],      // 0xff66ff00
            [0.2, 1, 0, 1],      // 0xff33ff00
            [0, 1, 0, 1],        // 0xff00ff00
            [1, 0.8, 0, 1],      // 0xffffcc00
            [0.8, 0.8, 0, 1],    // 0xffcccc00
            [0.6, 0.8, 0, 1],    // 0xff99cc00
            [0.4, 0.8, 0, 1],    // 0xff66cc00
            [0.2, 0.8, 0, 1],    // 0xff33cc00
            [0, 0.8, 0, 1],      // 0xff00cc00
            [1, 0.6, 0, 1],      // 0xffff9900
            [0.8, 0.6, 0, 1],    // 0xffcc9900
            [0.6, 0.6, 0, 1],    // 0xff999900
            [0.4, 0.6, 0, 1],    // 0xff669900
            [0.2, 0.6, 0, 1],    // 0xff339900
            [0, 0.6, 0, 1],      // 0xff009900
            [1, 0.4, 0, 1],      // 0xffff6600
            [0.8, 0.4, 0, 1],    // 0xffcc6600
            [0.6, 0.4, 0, 1],    // 0xff996600
            [0.4, 0.4, 0, 1],    // 0xff666600
            [0.2, 0.4, 0, 1],    // 0xff336600
            [0, 0.4, 0, 1],      // 0xff006600
            [1, 0.2, 0, 1],      // 0xffff3300
            [0.8, 0.2, 0, 1],    // 0xffcc3300
            [0.6, 0.2, 0, 1],    // 0xff993300
            [0.4, 0.2, 0, 1],    // 0xff663300
            [0.2, 0.2, 0, 1],    // 0xff333300
            [0, 0.2, 0, 1],      // 0xff003300
            [1, 0, 0, 1],        // 0xffff0000
            [0.8, 0, 0, 1],      // 0xffcc0000
            [0.6, 0, 0, 1],      // 0xff990000
            [0.4, 0, 0, 1],      // 0xff660000
            [0.2, 0, 0, 1],      // 0xff330000
            [0, 0, 0.933, 1],    // 0xff0000ee
            [0, 0, 0.867, 1],    // 0xff0000dd
            [0, 0, 0.733, 1],    // 0xff0000bb
            [0, 0, 0.667, 1],    // 0xff0000aa
            [0, 0, 0.533, 1],    // 0xff000088
            [0, 0, 0.467, 1],    // 0xff000077
            [0, 0, 0.333, 1],    // 0xff000055
            [0, 0, 0.267, 1],    // 0xff000044
            [0, 0, 0.133, 1],    // 0xff000022
            [0, 0, 0.067, 1],    // 0xff000011
            [0, 0.933, 0, 1],    // 0xff00ee00
            [0, 0.867, 0, 1],    // 0xff00dd00
            [0, 0.733, 0, 1],    // 0xff00bb00
            [0, 0.667, 0, 1],    // 0xff00aa00
            [0, 0.533, 0, 1],    // 0xff008800
            [0, 0.467, 0, 1],    // 0xff007700
            [0, 0.333, 0, 1],    // 0xff005500
            [0, 0.267, 0, 1],    // 0xff004400
            [0, 0.133, 0, 1],    // 0xff002200
            [0, 0.067, 0, 1],    // 0xff001100
            [0.933, 0, 0, 1],    // 0xffee0000
            [0.867, 0, 0, 1],    // 0xffdd0000
            [0.733, 0, 0, 1],    // 0xffbb0000
            [0.667, 0, 0, 1],    // 0xffaa0000
            [0.533, 0, 0, 1],    // 0xff880000
            [0.467, 0, 0, 1],    // 0xff770000
            [0.333, 0, 0, 1],    // 0xff550000
            [0.267, 0, 0, 1],    // 0xff440000
            [0.133, 0, 0, 1],    // 0xff220000
            [0.067, 0, 0, 1],    // 0xff110000
            [0.933, 0.933, 0.933, 1],  // 0xffeeeeee
            [0.867, 0.867, 0.867, 1],  // 0xffdddddd
            [0.733, 0.733, 0.733, 1],  // 0xffbbbbbb
            [0.667, 0.667, 0.667, 1],  // 0xffaaaaaa
            [0.533, 0.533, 0.533, 1],  // 0xff888888
            [0.467, 0.467, 0.467, 1],  // 0xff777777
            [0.333, 0.333, 0.333, 1],  // 0xff555555
            [0.267, 0.267, 0.267, 1],  // 0xff444444
            [0.133, 0.133, 0.133, 1],  // 0xff222222
            [0.067, 0.067, 0.067, 1],  // 0xff111111
    );
        return default_palette;
    }
}