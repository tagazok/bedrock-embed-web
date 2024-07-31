import {
    BedrockAgentRuntimeClient,
    InvokeAgentCommand
} from "@aws-sdk/client-bedrock-agent-runtime";
import { AWSConfig, Config } from "./models";

export class AgentClient {
    #bedrockClient: BedrockAgentRuntimeClient;
    AWSConfig: AWSConfig;
    config: Config;
    sessionId: string;

    constructor(awsConfig: AWSConfig, config: Config, credentials: any) {
        this.AWSConfig = awsConfig;
        this.config = config;

        this.#bedrockClient = new BedrockAgentRuntimeClient({
            region: awsConfig.region,
            credentials: credentials
        });
        this.sessionId = Date.now() + "";
    }

    async sendMessage(messages: any[]) {
  
        const command = new InvokeAgentCommand({
            agentId: this.AWSConfig.agent.agentId,
            agentAliasId: this.AWSConfig.agent.agentAliasId,
            sessionId: this.sessionId,
            inputText: messages[messages.length - 1].content[0].text
        });

        try {
            const response = await this.#bedrockClient.send(command);
            let completion = "";

            if (response.completion === undefined) {
                throw new Error("Completion is undefined");
            }

            for await (let chunkEvent of response.completion) {
                const chunk = chunkEvent.chunk;
                if (chunk) {
                    const decodedResponse = new TextDecoder("utf-8").decode(chunk.bytes);
                    completion += decodedResponse;
                }
            }
            return completion
        } catch (error) {
            console.log(`ERROR: ${error}`);
            throw error;
        }
    }
}