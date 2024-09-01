import { App } from "./app"

const canvases = {
    viewportMain: <HTMLCanvasElement>document.getElementById("gfx-main"),
    sceneParameters: <HTMLCanvasElement>document.getElementById("scene-params"),
    renderParameters: <HTMLCanvasElement>document.getElementById("render-params")
};

const app = new App(canvases);
app.initialize();
