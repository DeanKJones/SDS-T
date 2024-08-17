import { Scene } from "../world/scene";
import { SceneBufferDescription } from "./geometry/sceneBufferDescription";
import { Renderer } from "./renderer";

export interface gfx_scene_instance
{
    scene: Scene;
    sceneBuffers: SceneBufferDescription;
    renderInstance: Renderer;
}
