import {Factory} from "./factory";

export class Extension<F extends Factory> {
    constructor(public readonly factory: F) {}

    public create(): void {}
}