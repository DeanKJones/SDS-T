import { Camera } from "./camera";
import { SceneData } from "./management/sceneData";
//import { VoxImporter } from "./voxel/import";
import { createDefaultVoxel } from "./voxel/defaultVoxel";

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

        //const voxelObject1 = await VoxImporter.importVox("assets/models/deer.vox");
        //this.data.addVoxelObject(voxelObject1);

        const defaultVoxel = createDefaultVoxel();
        this.data.addVoxelObject(defaultVoxel);

        const voxelObject2 = createDefaultVoxel();
        voxelObject2.updateTransform([1, 0, 0, 0, 
                                      0, 1, 0, 0, 
                                      0, 0, 1, 0, 
                                      3, 1, 0, 1]);
        this.data.addVoxelObject(voxelObject2);

        this.data.camera = new Camera([0, 3.0, 10.0], 180, 0);

        this.data.buildSceneBVH();
        console.log("BVH build completed.");

        this.update();
    }

    update() {
        this.data.updateSceneDataTransforms();
        this.data.camera.calculateViewMatrix();
    }
}