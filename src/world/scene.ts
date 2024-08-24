import { Camera } from "./camera";
import { SceneData } from "./management/scene_data";
import { BVH } from "./bvh/bvh";
import { VoxImporter } from "./voxel/import";

export class Scene {
    data: SceneData;

    private constructor() {
        this.data = new SceneData();
    }

    static async create(): Promise<Scene> {
        const scene = new Scene();
        return scene;
    }

    async initialize() {

        const voxelObject1 = await VoxImporter.importVox("assets/models/deer.vox");
        this.data.addVoxelObject(voxelObject1);

        this.data.camera = new Camera([0, 3.0, 10.0], 180, 0);

        new BVH(this.data).buildBVH();
        console.log("BVH build completed.");
    }

    update() {
        this.data.updateVoxelObjectTransforms();
        this.data.camera.calculateViewMatrix();
    }
}