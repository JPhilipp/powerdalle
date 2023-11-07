# Power Dall-E
Power Dall-E is a simple way to use Dall-E 3 with its advanced parameters like style (vivid vs natural) or quality (standard vs hd). You can also use it to keep generating images when your main ChatGPT Dall-E is throttling you. Be aware of the extra costs though, as every API call is paid.

# Installation

1. Ensure you have [Node.js](https://nodejs.org) installed.
2. Load this git project onto your local drive.
3. Create a name-less file ".env" in the project root and put into it [your OpenAI API](https://platform.openai.com/api-keys) key by writing: _OPENAI_API_KEY=yourapikey_
4. Navigate to the project via the command line, and type *node server.js* (or *nodemon server.js* if you want the server to automatically restart when you edit the script).
