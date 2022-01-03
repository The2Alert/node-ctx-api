import {IContext} from ".";

export type ServiceBaseClass = new (...params: any[]) => {};

export type ServiceGetter = (this: InstanceType<IService>) => any;

export interface IService {
    serviceId: number;
    new(...params: any[]): {
        __getters__?: Record<string, ServiceGetter>;
        createService(context: InstanceType<IContext>): void;
        initServiceGetters(): void;
        getServiceContext(): InstanceType<IContext> | null;
        getContext(contextClass: IContext): InstanceType<IContext> | null;
        getService(serviceClass: IService): InstanceType<IService> | null;
    };
}

export function ServiceMixin<BaseClass extends ServiceBaseClass>(baseClass: BaseClass): IService & BaseClass {
    return class Service extends baseClass {
        public static serviceId: number;

        public __getters__?: Record<string, ServiceGetter>;
        public serviceContext?: InstanceType<IContext>;

        public createService(context: InstanceType<IContext>): void {
            this.serviceContext = context;
        }

        public initServiceGetters(): void {
            if(this.__getters__) {
                for(const propertyKey in this.__getters__) {
                    const getter: ServiceGetter = this.__getters__[propertyKey];
                    (this as any)[propertyKey] = getter.call(this);
                }
            }
        }

        public getServiceContext(): InstanceType<IContext> | null {
            return this.serviceContext ?? null;
        }

        public getContext(contextClass: IContext): InstanceType<IContext> | null {
            return this.getServiceContext()?.getContext(contextClass) ?? null;
        } 

        public getService(serviceClass: IService): InstanceType<IService> | null {
            return this.getServiceContext()?.getService(serviceClass) ?? null;
        }
    }
}