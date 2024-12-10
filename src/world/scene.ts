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

        const defaultVoxel_1 = createDefaultVoxel();
        defaultVoxel_1.setPosition(0, 0, 0);
        defaultVoxel_1.translate(0, 5, 0);
        defaultVoxel_1.generateTriangles(); // Generate triangles
        this.data.addVoxelObject(defaultVoxel_1);

        const defaultVoxel_2 = createDefaultVoxel();
        defaultVoxel_2.setPosition(0, 0, 0);
        defaultVoxel_2.translate(3, 1, 3);
        defaultVoxel_2.generateTriangles(); // Generate triangles
        this.data.addVoxelObject(defaultVoxel_2);

        const defaultVoxel3 = createDefaultVoxel();
        defaultVoxel3.setPosition(0, 0, 0);
        defaultVoxel3.translate(-3, -1, -3);
        defaultVoxel3.generateTriangles(); // Generate triangles
        this.data.addVoxelObject(defaultVoxel3);

        this.data.camera = new Camera([1.5, 1.5, 5.0], 180, 0);

        this.update();
        this.data.buildSceneBVH();
    }

    update() {
        this.data.updateSceneDataTransforms();
        this.data.camera.calculateViewMatrix();
    }
}