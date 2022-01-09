import {ContextBaseClass, IContext, IService, PersonalFactory, Extension} from ".";

export class Factory {
    public static isContext(contextClass: IContext): boolean {
        return "contextId" in contextClass && "contextChildren" in contextClass;
    }

    public static checkContext(contextClass: IContext): void {
        if(!Factory.isContext(contextClass))
            throw new Error(JSON.stringify(contextClass.name) + " class is not context");
        if(contextClass.contextServices) {
            for(const serviceClass of contextClass.contextServices)
                Factory.checkService(serviceClass);
        }
        for(const childClass of contextClass.contextChildren)
            Factory.checkContext(childClass);
    }

    public static isService(serviceClass: IService): boolean {
        return "serviceId" in serviceClass;
    }

    public static checkService(serviceClass: IService): void {
        if(!Factory.isService(serviceClass))
            throw new Error(JSON.stringify(serviceClass.name) + " class is not service");
    }

    constructor(public readonly rootContextClass: IContext, public readonly extensionsClasses: (typeof Extension)[] = []) {}

    private readonly personals: PersonalFactory[] = [];
    private extensions?: Extension[];

    public createPersonalById<BaseClass extends ContextBaseClass>(id: number, params: ConstructorParameters<BaseClass>): PersonalFactory {
        const personal = new PersonalFactory(id);
        personal.create(this, params);
        personal.createRootContext();
        return this.personals[id] = personal;
    }

    public getPersonalById(id: number): PersonalFactory {
        return this.personals[id] ?? new PersonalFactory(-1);
    }

    public removePersonalById(id: number): void {
        const personal: PersonalFactory = this.getPersonalById(id);
        personal.remove();
        delete this.personals[id];
    }

    public createExtensions(): void {
        this.extensions = [];
        for(let index = 0; index < this.extensionsClasses.length; index++) {
            const extensionClass: typeof Extension = this.extensionsClasses[index];
            const extension: Extension = new extensionClass(this);
            extension.create();
            this.extensions[index] = extension;
        }
    }

    public getExtensions(): Extension[] {
        return this.extensions ?? [];
    }

    public checkRootContext(): void {
        Factory.checkContext(this.rootContextClass);
    }

    public create(): void {
        this.checkRootContext();
        this.createExtensions();
    }
}