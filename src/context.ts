import {IService, PersonalFactory} from ".";

export type ContextBaseClass = new (...params: any[]) => {};

export type ContextGetter = (this: InstanceType<IContext>) => any;

export interface IContext {
    contextId: number;
    contextChildren: IContext[];
    contextServices?: IService[];
    new(...params: any[]): {
        __getters__?: Record<string, ContextGetter>;
        createContext(personalFactory: PersonalFactory, parent?: InstanceType<IContext>): void;
        createServices(): void;
        initContextGetters(): void;
        getPersonalFactory(): PersonalFactory;
        getParentContext(): InstanceType<IContext> | null;
        getContextChildren(): InstanceType<IContext>[];
        getContextChild(contextClass: IContext): InstanceType<IContext> | null;
        getContext(contextClass: IContext): InstanceType<IContext> | null;
        getContextServices(): InstanceType<IService>[];
        getService(serviceClass: IService): InstanceType<IService> | null;
        setContextEventReturnValue(value: any): void;
        handleContextEventReturnValue(returnValue: any): void;
        callContextEvent(name: string, ...args: any[]): void;
        isFrozen(): boolean;
        isFrozenStrict(): boolean;
        freeze(): void;
        unfreeze(): void;
    };
}

export function ContextMixin<BaseClass extends ContextBaseClass>(baseClass: BaseClass): IContext & BaseClass {
    return class Context extends baseClass {
        public static contextId: number;
        public static contextChildren: IContext[];
        public static contextServices?: IService[];

        public __getters__?: Record<string, ContextGetter>;
        public personalFactory?: PersonalFactory;
        public parentContext?: InstanceType<IContext>;
        public contextChildren?: InstanceType<IContext>[];
        public contextServices?: InstanceType<IService>[];
        public contextFrozen: boolean  = false;

        public createContext(personalFactory: PersonalFactory, parent?: InstanceType<IContext>): void {
            this.personalFactory = personalFactory;
            this.parentContext = parent;
            const contextClass = this.constructor as IContext;
            this.getPersonalFactory().getAllContexts()[contextClass.contextId] = this;
            const {contextChildren} = contextClass;
            this.contextChildren = [];
            const factory: PersonalFactory = this.getPersonalFactory();
            for(const childClass of contextChildren)
                this.contextChildren[childClass.contextId] = factory.createContext(childClass, this);
        }

        public createServices(): void {
            const contextClass = this.constructor as IContext;
            if(contextClass.contextServices) {
                this.contextServices = [];
                const factory: PersonalFactory = this.getPersonalFactory();
                for(const serviceClass of contextClass.contextServices)
                    this.contextServices[serviceClass.serviceId] = factory.createService(serviceClass, this);
                for(const serviceId in this.contextServices) {
                    const service: InstanceType<IService> = this.contextServices[serviceId];
                    service.initServiceGetters();
                }
            }
            const children: InstanceType<IContext>[] = this.getContextChildren();
            for(const childId in children) {
                const child: InstanceType<IContext> = children[childId];
                child.createServices();
            }
        }

        public initContextGetters(): void {
            if(this.__getters__) {
                for(const propertyKey in this.__getters__) {
                    const getter: ContextGetter = this.__getters__[propertyKey];
                    (this as any)[propertyKey] = getter.call(this);
                }
            }
            const children: InstanceType<IContext>[] = this.getContextChildren();
            for(const childId in children) {
                const child: InstanceType<IContext> = children[childId];
                child.initContextGetters();
            }
        }

        public getPersonalFactory(): PersonalFactory {
            return this.personalFactory ?? new PersonalFactory(-1);
        }

        public getParentContext(): InstanceType<IContext> | null {
            return this.parentContext ?? null;
        }

        public getContextChildren(): InstanceType<IContext>[] {
            return this.contextChildren ?? [];
        }

        public getContextChild(contextClass: IContext): InstanceType<IContext> | null {
            return this.getContextChildren()[contextClass.contextId] ?? null;
        }

        public getContext(contextClass: IContext): InstanceType<IContext> | null {
            return this.getContextChild(contextClass) ?? this.getPersonalFactory().getContext(contextClass);
        }

        public getContextServices(): InstanceType<IService>[] {
            return this.contextServices ?? [];
        }

        public getService(serviceClass: IService): InstanceType<IService> | null {
            return this.getContextServices()[serviceClass.serviceId] ?? null;
        }

        public setContextEventReturnValue(value: any): void {
            this.getPersonalFactory().setEventReturnValue(value);
        }

        public handleContextEventReturnValue(returnValue: any): void {
            if(returnValue === undefined)
                return;
            this.setContextEventReturnValue(returnValue);
        }

        public callContextEvent(name: string, ...args: any[]): void {
            if(this.isFrozen())
                return;
            const event: unknown = (this as any)[name];
            if(event instanceof Function) {
                const returnValue: any = event.apply(this, args);
                this.handleContextEventReturnValue(returnValue);
            }
            const children: InstanceType<IContext>[] = this.getContextChildren();
            for(const childId in children) {
                const child: InstanceType<IContext> = children[childId];
                child.callContextEvent(name, ...args);
            }
        }

        public isFrozen(): boolean {
            return this.contextFrozen;
        }

        public isFrozenStrict(): boolean {
            return this.isFrozen() || (this.getParentContext()?.isFrozen() ?? false);
        }

        public freeze(): void {
            this.contextFrozen = true;
        }

        public unfreeze(): void {
            this.contextFrozen = false;
        }
    }
}