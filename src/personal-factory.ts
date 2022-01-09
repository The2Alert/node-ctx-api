import {ContextBaseClass, Factory, IContext, IService} from ".";

export class PersonalFactory {
    constructor(public readonly id: number) {}

    private factory?: Factory;
    private contextParams?: any[];
    private rootContext?: InstanceType<IContext>;
    private allContexts?: InstanceType<IContext>[];
    private eventReturnValue?: any;

    public create<BaseClass extends ContextBaseClass>(factory: Factory, contextParams: ConstructorParameters<BaseClass>): void {
        this.factory = factory;
        this.contextParams = contextParams;
        this.allContexts = [];
    }

    public remove(): void {
        const context: InstanceType<IContext> | null = this.getRootContext();
        if(context !== null)
            context.destroyContext();
        delete this.factory;
        delete this.contextParams;
        delete this.allContexts;
    }

    public createContext(contextClass: IContext, parent?: InstanceType<IContext>): InstanceType<IContext> {
        const context = new contextClass(...this.getContextParams());
        context.createContext(this, parent);
        return context;
    }

    public createService(serviceClass: IService, context: InstanceType<IContext>): InstanceType<IService> {
        const service = new serviceClass(...this.getContextParams());
        service.createService(context);
        return service;
    }

    public createRootContext(): void {
        const factory = this.getFactory();
        if(factory === null)
            return;
        this.rootContext = this.createContext(factory.rootContextClass);
        this.rootContext.createServices();
        this.rootContext.initContextGetters();
    }

    public getRootContext(): InstanceType<IContext> | null {
        return this.rootContext ?? null;
    }

    public getFactory(): Factory | null {
        return this.factory ?? null;
    }

    public getContextParams(): any[] {
        return this.contextParams ?? [];
    }

    public getAllContexts(): InstanceType<IContext>[] {
        return this.allContexts ?? [];
    }

    public getContext(contextClass: IContext): InstanceType<IContext> | null {
        return this.getAllContexts()[contextClass.contextId] ?? null;
    }

    public callEvent(name: string, ...args: any[]): any {
        this.eventReturnValue = undefined;
        this.getRootContext()?.callContextEvent(name, ...args);
        return this.eventReturnValue;
    }

    public setEventReturnValue(value: any): void {
        this.eventReturnValue = value;
    }
}