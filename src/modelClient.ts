import { BedrockRuntimeClient, ConverseStreamCommand } from "@aws-sdk/client-bedrock-runtime";
import { AWSConfig, Config } from "./models";

export class ModelClient {
    #bedrockClient: BedrockRuntimeClient
    AWSConfig: AWSConfig;
    config: Config;

    constructor(awsConfig: AWSConfig, config: Config, credentials: any) {
        this.AWSConfig = awsConfig;
        this.config = config;

        this.#bedrockClient = new BedrockRuntimeClient({
            credentials: credentials,
            region: this.AWSConfig.region
        });
    }

    async sendMessage(messages: any[]) {
        const modelId = this.AWSConfig.modelId || "anthropic.claude-3-sonnet-20240229-v1:0";
        
        const command = new ConverseStreamCommand({
            modelId: modelId,
            messages: messages,
            inferenceConfig: { maxTokens: 512, temperature: 0.5, topP: 0.9 },
        });

        try {
            const response = await this.#bedrockClient.send(command);
            let completion = "";

            if (response.stream === undefined) {
                throw new Error("Stream is undefined");
            }

            for await (const item of response.stream) {
                if (item.contentBlockDelta) {
                    completion += item.contentBlockDelta.delta?.text;
                }
            }
            return completion;
        } catch (error) {
            console.log(`ERROR: ${error}`);
            throw error;
        }
    }
}