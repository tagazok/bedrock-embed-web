# bedrock-embed-web


```javascript

new AWSBRChat({
    region: "",
    identityPoolId: "",
    roleArn: "",
    //modelId?: "" // Default is "anthropic.claude-3-sonnet-20240229-v1:0",
    agent?: {
        agentId: "",
        agentAliasId: ""
    }
},
{
    logoUrl: "/public/logo.png",
    floatingWindow?: true, // Override containerId
    // containerId?: "chat-container",
    webExperience?: {
        title: "My local Bedrock",
        subtitle: "Welcome to the future",
        welcomeMessage: "Hey, how can I help you today?"
    }
});

```

### How to call Bedrock
There are 2 ways to connect the plugin to Bedrock:
- By calling a model
Simply set the `modelId` parameter in the plugin to specify which model you want to call
- By calling a Bedrock Agent
Specify the `agent` parameter with the `agentId` and `agentAliasId`


### Position your chat window
- Specify the `floadintWindow: true` parameter if you want to have a floating window. The button will be located at the bottom right of your page
- Specify the id of a dom element in the `containerId` parameter
Make sure you have such node in your html. Ex:
```html
<div id="chat-container" style="height: 400px"></div>
```



### Run the sample website:
```bash
npm run build:website
```

### Build the library:

```bash
npm run build
```

Copy the `aws-br-embed.js` and `style.css` files in your project.

