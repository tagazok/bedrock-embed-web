import { CognitoIdentityClient, GetIdCommand, GetOpenIdTokenCommand } from "@aws-sdk/client-cognito-identity";
import { STSClient, AssumeRoleWithWebIdentityCommand } from "@aws-sdk/client-sts";
// import {
//     QBusinessClient,
//     ListMessagesCommand,
//     ChatSyncCommand,
//     GetWebExperienceCommand,
//     ListWebExperiencesCommand
// } from "@aws-sdk/client-qbusiness"; // ES Modules import

import {
    BedrockRuntimeClient,
    ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

import { type AWSConfig, type Config } from './models.js';

import './chat.css'

export class AWSBRChat {
    AWSConfig: AWSConfig;
    config: Config;
    #bedrockClient;
    messages: any[] = [];
    dom_messages;
    dom_loading;
    dom_submit;
    chatInterface: HTMLElement | undefined;
    loading: boolean = false;

    promptInputElement: HTMLInputElement | undefined;
    // webExperience;

    constructor(AWSconfig, config) {
        this.AWSConfig = AWSconfig;
        this.config = config;

        this.setup();
        this.init();
    }

    setup() {
        if (this.config.floatingWindow) {
            this.buildButton();
        }
        this.buildChatWindow();
    }

    checkConfigs() {

    }

    async init() {
        const credentials = await this.awsCredentialsForAnonymousUser();

        this.#bedrockClient = new BedrockRuntimeClient({
            credentials: credentials,
            region: this.AWSConfig.region
        });

        if (this.config?.webExperience) {
            this.buildWebExperience(this.config.webExperience);
        }
    }

    buildButton() {
        let logoUrl = "/q-logo.svg";
        if (this.config.logoUrl) {
            logoUrl = this.config.logoUrl
        }
        const chatButton = `
            <button id="chatButton">
                <img src="${logoUrl}" />
            </button>
        `;
        const buttonDiv = document.createElement('div');
        buttonDiv.innerHTML = chatButton;

        buttonDiv.addEventListener('click', () => {
            this.toggleChatWindow();
        });

        document.body.appendChild(buttonDiv);
    }

    buildWebExperience(webExperience) {
        const tmpl = `
            <div class="webExperience">
                <div class="header">
                    <div class="title">${webExperience.title}</div>
                    <div class="subtitle">${webExperience.subtitle}</div>
                </div>
                <div class="welcomeMessage">
                    <div class="conversation-thread">
                        ${this.getMessageTemplate({
                            role: "assistant",
                            content: [ {text: webExperience.welcomeMessage}] 
                        })}
                    </div>
                </div>
            </div>
        `;

        const range = document.createRange();
        const fragment = range.createContextualFragment(tmpl);

        if (this.messages.length === 0) {
            document.querySelector('#chatApp .message-list')?.appendChild(fragment);
        }
    }
    buildChatWindow() {
        const tmpl = `
        <div id="chatApp" class="chatApp">
            <div class="message-list">
            <div class="conversation-thread">
                <div id="messages">
                <div></div>
                </div>
            </div>
            </div>
            <div id="loader" class="text" *ngIf="loading">
                <div class="typing-animation">
                    <div class="typing-dot" style="--delay: 0.2s">•</div>
                    <div class="typing-dot" style="--delay: 0.3s">•</div>
                    <div class="typing-dot" style="--delay: 0.4s">•</div>
                    &nbsp;
                </div>
            </div>
            <div class="prompt-container">
            <div class="prompt-body">
                <div class="prompt">
                <form>
                    <textarea id="prompt" placeholder="How can I help you today?"></textarea>
                    <div class="button">
                    <button type="button" id="submit-button">
                        <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzQiIGhlaWdodD0iMzQiIHZpZXdCb3g9IjAgMCAzNCAzNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzUzOF83NzIxMykiPgo8cGF0aCBkPSJNMzEuMTEyOSAxNi45NzA2SDE1LjU1NjUiIHN0cm9rZT0iIzk4QTJCMyIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTMxLjExMjggMTYuOTcwNkwxMi4wMjEgMjYuMTYzTDE1LjU1NjUgMTYuOTcwNkwxMi4wMjEgNy43NzgxOEwzMS4xMTI4IDE2Ljk3MDZaIiBzdHJva2U9IiM5OEEyQjMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjwvZz4KPGRlZnM+CjxjbGlwUGF0aCBpZD0iY2xpcDBfNTM4Xzc3MjEzIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSJ3aGl0ZSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTYuOTcwNykgcm90YXRlKDQ1KSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPg==" alt="submit">
                    </button>
                    </div>
                </form>
                </div>
            </div>
            </div>
        </div>
      `;
        if (this.config.floatingWindow) {
            this.chatInterface = document.createElement('div');
            this.chatInterface.style.display = 'none';
            this.chatInterface.className = "floating-chat";
            this.chatInterface.innerHTML = tmpl;
            document.body.appendChild(this.chatInterface);
        } else if (this.config.containerId) {
            document.querySelector(`#${this.config.containerId}`)!.innerHTML = tmpl;
        }

        this.dom_messages = document.querySelector('#chatApp #messages');
        this.dom_submit = document.querySelector('#chatApp #submit-button');
        this.dom_loading = document.querySelector('#chatApp #loader');
        this.promptInputElement = document.querySelector('#chatApp #prompt') as HTMLInputElement;
        this.promptInputElement.addEventListener("keyup", this.onInputKeyUp.bind(this));
        this.promptInputElement?.addEventListener("keydown", this.onInputKeyDown.bind(this));

        this.dom_submit?.addEventListener('click', this.submitMessage.bind(this));
    }

    async sendMessage(prompt: string) {
        this.setLoading(true);
        const message = {
            role: "user",
            content: [{ text: prompt }]
        };

        if (this.messages.length === 0 && this.config.webExperience) {
            const dom_webExperience = (document.querySelector("#chatApp .webExperience") as HTMLInputElement | null)
            if (dom_webExperience) {
                dom_webExperience.style.display = "none";
            }
        }

        this.messages.push(message);

        if (this.promptInputElement) {
            this.promptInputElement.value = "";
        }

        this.displayMessage(message);
        

        const modelId = this.AWSConfig.modelId || "anthropic.claude-3-sonnet-20240229-v1:0";
        const command = new ConverseCommand({
            modelId,
            messages: this.messages,
            inferenceConfig: { maxTokens: 512, temperature: 0.5, topP: 0.9 },
        });


        try {
            // Send the command to the model and wait for the response
            const response = await this.#bedrockClient.send(command);

            // Extract and print the response text.
            const responseText = response.output.message.content[0].text;
            console.log(responseText);
            const responseMessage = {
                role: "assistant",
                content: [{ text: responseText }]
            }
            this.messages.push(responseMessage);

            this.displayMessage(responseMessage);
        } catch (err) {
            console.log(`ERROR: Can't invoke '${modelId}'. Reason: ${err}`);
        }

        this.setLoading(false);
    }

    getSourceTemplate(source) {
        if (source.url !== "") {
            return `
            <a class="title" href="${source.url}">${source.title}</a>
            <div class="description">
              ${source.url}
            </div>
            `;
        } else {
            return `
            <div class="title">${source.title}</div>
            `;
        };
    }

    getSources(message) {
        if (message.sourceAttribution && message.sourceAttribution.length > 0) {
            let tmpl = `
              <div class="label">Sources</div>
              <div class="source-list">`;
            for (const source of message.sourceAttribution) {
                tmpl += `
                <div class="source">
                  ${this.getSourceTemplate(source)}
                </div>
              `;
            }
            tmpl += '</div>';

            return tmpl;
        }
        return "";
    }

    getMessageAvatar(message) {
        if (message.role === "user") {
            return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA1NiA1NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgZmlsdGVyPSJ1cmwoI2ZpbHRlcjBfZGRfNTM4Xzc3MDE2KSI+CjxjaXJjbGUgY3g9IjI4IiBjeT0iMjciIHI9IjI0IiBmaWxsPSIjQzExNTc0Ii8+CjwvZz4KPHBhdGggZD0iTTM2IDM2VjM0QzM2IDMyLjkzOTEgMzUuNTc4NiAzMS45MjE3IDM0LjgyODQgMzEuMTcxNkMzNC4wNzgzIDMwLjQyMTQgMzMuMDYwOSAzMCAzMiAzMEgyNEMyMi45MzkxIDMwIDIxLjkyMTcgMzAuNDIxNCAyMS4xNzE2IDMxLjE3MTZDMjAuNDIxNCAzMS45MjE3IDIwIDMyLjkzOTEgMjAgMzRWMzYiIHN0cm9rZT0iI0ZDRkNGRCIgc3Ryb2tlLXdpZHRoPSIyLjE4MTgyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTI4IDI2QzMwLjIwOTEgMjYgMzIgMjQuMjA5MSAzMiAyMkMzMiAxOS43OTA5IDMwLjIwOTEgMTggMjggMThDMjUuNzkwOSAxOCAyNCAxOS43OTA5IDI0IDIyQzI0IDI0LjIwOTEgMjUuNzkwOSAyNiAyOCAyNloiIHN0cm9rZT0iI0ZDRkNGRCIgc3Ryb2tlLXdpZHRoPSIyLjE4MTgyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPGRlZnM+CjxmaWx0ZXIgaWQ9ImZpbHRlcjBfZGRfNTM4Xzc3MDE2IiB4PSIwLjcyNzI3MyIgeT0iMC44MTgxODIiIHdpZHRoPSI1NC41NDU1IiBoZWlnaHQ9IjU0LjU0NTUiIGZpbHRlclVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj4KPGZlRmxvb2QgZmxvb2Qtb3BhY2l0eT0iMCIgcmVzdWx0PSJCYWNrZ3JvdW5kSW1hZ2VGaXgiLz4KPGZlQ29sb3JNYXRyaXggaW49IlNvdXJjZUFscGhhIiB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMTI3IDAiIHJlc3VsdD0iaGFyZEFscGhhIi8+CjxmZU9mZnNldCBkeT0iMS4wOTA5MSIvPgo8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIxLjA5MDkxIi8+CjxmZUNvbG9yTWF0cml4IHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAuMDYyNzQ1MSAwIDAgMCAwIDAuMDk0MTE3NiAwIDAgMCAwIDAuMTU2ODYzIDAgMCAwIDAuMDYgMCIvPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluMj0iQmFja2dyb3VuZEltYWdlRml4IiByZXN1bHQ9ImVmZmVjdDFfZHJvcFNoYWRvd181MzhfNzcwMTYiLz4KPGZlQ29sb3JNYXRyaXggaW49IlNvdXJjZUFscGhhIiB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMTI3IDAiIHJlc3VsdD0iaGFyZEFscGhhIi8+CjxmZU9mZnNldCBkeT0iMS4wOTA5MSIvPgo8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIxLjYzNjM2Ii8+CjxmZUNvbG9yTWF0cml4IHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAuMDYyNzQ1MSAwIDAgMCAwIDAuMDk0MTE3NiAwIDAgMCAwIDAuMTU2ODYzIDAgMCAwIDAuMSAwIi8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW4yPSJlZmZlY3QxX2Ryb3BTaGFkb3dfNTM4Xzc3MDE2IiByZXN1bHQ9ImVmZmVjdDJfZHJvcFNoYWRvd181MzhfNzcwMTYiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJlZmZlY3QyX2Ryb3BTaGFkb3dfNTM4Xzc3MDE2IiByZXN1bHQ9InNoYXBlIi8+CjwvZmlsdGVyPgo8L2RlZnM+Cjwvc3ZnPgo=";
        } else if (message.role === "assistant") {
            return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA1NiA1NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgZmlsdGVyPSJ1cmwoI2ZpbHRlcjBfZGRfMTIxOV85Mjg4MykiPgo8Y2lyY2xlIGN4PSIyOCIgY3k9IjI3IiByPSIyNCIgZmlsbD0iIzc2MzhGQSIvPgo8L2c+CjxwYXRoIGQ9Ik0xNiAyNi4zMzM0QzE1Ljk5NTQgMjguMDkzMiAxNi40MDY2IDI5LjgyOTIgMTcuMiAzMS40QzE4LjE0MDggMzMuMjgyNCAxOS41ODcgMzQuODY1NiAyMS4zNzY3IDM1Ljk3MjRDMjMuMTY2NSAzNy4wNzkyIDI1LjIyOSAzNy42NjU5IDI3LjMzMzMgMzcuNjY2N0MyOS4wOTMyIDM3LjY3MTMgMzAuODI5MiAzNy4yNjAxIDMyLjQgMzYuNDY2N0w0MCAzOUwzNy40NjY3IDMxLjRDMzguMjYwMSAyOS44MjkyIDM4LjY3MTMgMjguMDkzMiAzOC42NjY3IDI2LjMzMzRDMzguNjY1OSAyNC4yMjkgMzguMDc5MiAyMi4xNjY1IDM2Ljk3MjQgMjAuMzc2OEMzNS44NjU2IDE4LjU4NyAzNC4yODIzIDE3LjE0MDggMzIuNCAxNi4yQzMwLjgyOTIgMTUuNDA2NiAyOS4wOTMyIDE0Ljk5NTQgMjcuMzMzMyAxNUgyNi42NjY3QzIzLjg4NzUgMTUuMTUzNCAyMS4yNjI2IDE2LjMyNjQgMTkuMjk0NSAxOC4yOTQ1QzE3LjMyNjMgMjAuMjYyNiAxNi4xNTMzIDIyLjg4NzYgMTYgMjUuNjY2N1YyNi4zMzM0WiIgc3Ryb2tlPSIjRkNGQ0ZEIiBzdHJva2Utd2lkdGg9IjIuMTgxODIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8ZGVmcz4KPGZpbHRlciBpZD0iZmlsdGVyMF9kZF8xMjE5XzkyODgzIiB4PSIwLjcyNzI3MyIgeT0iMC44MTgxODIiIHdpZHRoPSI1NC41NDU1IiBoZWlnaHQ9IjU0LjU0NTUiIGZpbHRlclVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj4KPGZlRmxvb2QgZmxvb2Qtb3BhY2l0eT0iMCIgcmVzdWx0PSJCYWNrZ3JvdW5kSW1hZ2VGaXgiLz4KPGZlQ29sb3JNYXRyaXggaW49IlNvdXJjZUFscGhhIiB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMTI3IDAiIHJlc3VsdD0iaGFyZEFscGhhIi8+CjxmZU9mZnNldCBkeT0iMS4wOTA5MSIvPgo8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIxLjA5MDkxIi8+CjxmZUNvbG9yTWF0cml4IHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAuMDYyNzQ1MSAwIDAgMCAwIDAuMDk0MTE3NiAwIDAgMCAwIDAuMTU2ODYzIDAgMCAwIDAuMDYgMCIvPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluMj0iQmFja2dyb3VuZEltYWdlRml4IiByZXN1bHQ9ImVmZmVjdDFfZHJvcFNoYWRvd18xMjE5XzkyODgzIi8+CjxmZUNvbG9yTWF0cml4IGluPSJTb3VyY2VBbHBoYSIgdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDEyNyAwIiByZXN1bHQ9ImhhcmRBbHBoYSIvPgo8ZmVPZmZzZXQgZHk9IjEuMDkwOTEiLz4KPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMS42MzYzNiIvPgo8ZmVDb2xvck1hdHJpeCB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMCAwIDAgMCAwLjA2Mjc0NTEgMCAwIDAgMCAwLjA5NDExNzYgMCAwIDAgMCAwLjE1Njg2MyAwIDAgMCAwLjEgMCIvPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluMj0iZWZmZWN0MV9kcm9wU2hhZG93XzEyMTlfOTI4ODMiIHJlc3VsdD0iZWZmZWN0Ml9kcm9wU2hhZG93XzEyMTlfOTI4ODMiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJlZmZlY3QyX2Ryb3BTaGFkb3dfMTIxOV85Mjg4MyIgcmVzdWx0PSJzaGFwZSIvPgo8L2ZpbHRlcj4KPC9kZWZzPgo8L3N2Zz4";
        }
        return "";
    }

    getMessageTemplate(message) {
        return `
        <div class="message ${message.role}">
            <img class="avatar" src="${this.getMessageAvatar(message)}"/>
            <div class="body-response">
              <div class="text">${message.content[0].text}</div>
            </div>
        </div>
        `;
    }

    generateMessageTemplate(message) {
        const tmpl = this.getMessageTemplate(message);
        const range = document.createRange();
        const fragment = range.createContextualFragment(tmpl);

        return fragment;
    }

    toggleChatWindow() {
        if (this.chatInterface?.style.display === 'none') {
            this.chatInterface!.style.display = 'block';
        } else {
            this.chatInterface!.style.display = 'none';
        }
    }

    async awsCredentialsForAnonymousUser() {
        // 1. Obtain a Cognito Identity Pool OpenId token.
        const cognitoClient = new CognitoIdentityClient({ region: this.AWSConfig.region });

        const identity = await cognitoClient.send(new GetIdCommand({ IdentityPoolId: this.AWSConfig.identityPoolId }));
        const token = await cognitoClient.send(new GetOpenIdTokenCommand({ IdentityId: identity.IdentityId }))

        // 2. exchange the Cognito OpenId token for an AWS access key and secret key.
        // This is done by assuming a role that defines the permission on these tokens
        const stsClient = new STSClient({ region: this.AWSConfig.region });
        const credentials = await stsClient.send(new AssumeRoleWithWebIdentityCommand({
            RoleArn: this.AWSConfig.roleArn,
            RoleSessionName: 'QChat',
            WebIdentityToken: token.Token
        }));

        return {
            accessKeyId: credentials.Credentials?.AccessKeyId || "",
            secretAccessKey: credentials.Credentials?.SecretAccessKey || "",
            sessionToken: credentials.Credentials?.SessionToken || "",
            expiration: credentials.Credentials?.Expiration || new Date()
        };
    };

    displayMessage(message) {
        this.dom_messages.insertBefore(this.generateMessageTemplate(message), this.dom_messages.lastChild.nextSibling);
    }

    setLoading(loading: boolean) {
        this.loading = loading;
        if (loading) {
            this.dom_submit?.setAttribute("disabled", "disabled");
            this.dom_loading.style.display = "block";
        } else {
            this.dom_submit?.removeAttribute("disabled");
            this.dom_loading.style.display = "none";
        }
    }

    submitMessage() {
        if (this.loading) {
            return;
        }
        const prompt = (document.querySelector("#prompt") as HTMLInputElement | null)?.value;
        if (prompt === "" || prompt === undefined) {
            return;
        };
        this.sendMessage(prompt);
    }

    onInputKeyDown(e: any) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            //   this.onSubmit();
            this.submitMessage();
        }
    }

    onInputKeyUp() {
        if (this.promptInputElement) {
            this.promptInputElement.style.height = "0px";
            this.promptInputElement.style.height = `${this.promptInputElement.scrollHeight}px`;
        }
    }
}