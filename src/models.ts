export type AWSConfig = {
    region: string;
    identityPoolId: string;
    roleArn: string;
    modelId?: string;
    // applicationId: string;
    // userId: string;
    // conversationId: string
    // webExperienceId?: string
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
    webExperience?: WebExperience
}
