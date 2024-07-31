export type AWSConfig = {
    region: string;
    identityPoolId: string;
    roleArn: string;
    modelId?: string;
    agent?: any;
};

export type WebExperience = {
    title: string;
    subtitle: string;
    welcomeMessage: string;
}

export type Config = {
    nodeId: boolean;
    floatingWindow: boolean;
    logoUrl?: string;
    containerId?: string;
    webExperience?: WebExperience;
    context: string;
}
