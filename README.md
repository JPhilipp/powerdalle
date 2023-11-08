# Power Dall-E
The Power Dall-E local web UI is a simple way to use Dall-E 3 with its advanced parameters like style (vivid vs natural) or quality (standard vs hd), which aren't available via ChatGPT. You can also use it to keep generating images when your main ChatGPT Dall-E is throttling you. This app locally remembers your past creations and shows them in a newest-first list, including your prompt as well as the prompt Dall-E rewrote behind the scenes.

This app does not connect to any server outside of your local one and OpenAI. Be aware of the costs though, as every API call is paid to OpenAI as per their usual pricing (note I'm not part of that transaction nor do I make money from it, it's just a local way for you to connect via your OpenAI API key).

![Screenshot](screenshot.png)
_As you scroll down, your older creations also show._

[![Video](thumb.png)](https://www.youtube.com/watch?v=2afhxu7XD5Q)

_Overview video_

# Installation

1. Ensure you have [Node.js](https://nodejs.org) installed.
2. Load this git project onto your local drive.
3. Create a name-less file ".env" in the project root and put into it [your OpenAI API](https://platform.openai.com/api-keys) key by writing: _OPENAI_API_KEY=yourapikey_
4. Navigate to the project via the command line, and type *node server.js*
5. Open http://localhost:3000 in your browser. Have fun!

_This project makes no guarantees for being bug-free, use at your own risk, and keep in mind that API calls cost money (see the [OpenAI costs dashboard](https://platform.openai.com/usage) and the [pricing table](https://openai.com/pricing))._

# Options

Info such as the prompt used are stored in a local database. If you want to additionally save a JSON file with such info with each image, add this to your ".env" file: SAVE_JSON_WITH_IMAGES=true

To switch from default model "dall-e-3" to another, add e.g. this to the ".env" file and restart the server (though size dropdowns and such will only properly work for the default model): MODEL=dall-e-2
