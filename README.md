# bedrock-embed-web


```javascript

new AWSBRChat({
    region: "",
    identityPoolId: "",
    roleArn: "",
    modelId?: "" // Default is "anthropic.claude-3-sonnet-20240229-v1:0"
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


111 Run the sample website:
```bash
npm run build:website
```

### Build the library:

```bash
npm run build
```

Copy the `aws-br-embed.js` and `style.css` files in your project.

