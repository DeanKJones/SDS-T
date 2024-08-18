import { App } from "./app"

const canvases = {
    viewportMain: <HTMLCanvasElement>document.getElementById("gfx-main"),
    sceneParameters: <HTMLCanvasElement>document.getElementById("scene-params")
};

const app = new App(canvases);
app.run();
