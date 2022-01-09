import {Factory} from "./factory";

export class Extension {
    constructor(public readonly factory: Factory) {}

    public create(): void {}
}