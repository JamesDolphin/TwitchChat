
twitchChat is a Discord bot written in Node.js to monitor the chat section of selected twitch.tv channels and post it into configured Discord channels for the purpose of overlaying said Discord channel in game.

Step 1: Clone this repository onto your server and in the root directory of the repository install the required library's with `npm i` 

Step 2: Create a file named ".env" in the root directory of the repository. This file will be used to store your discord bot tokens and twitch bot accounts. 

Step 3: Fill out your .env file with the following information

    DCTOKEN=YOUR DISCORD BOT TOKEN (DO NOT SHARE)
	DCPREFIX=!
	OAUTH=YOUR TWITCH CHAT OAUTH PASSWORD
	MAGICPASS=PASSWORD FOR CHECKING WHICH CHANNELS ARE BEING FOLLOWED

Step 4: Using PM2 below, navigate to the root directory of your repository and run pm2 start twitchChat.js

I recommend using PM2 which is a Node.js process manager that can restart your program should it go down for any reason.
PM2: [http://pm2.keymetrics.io/](http://pm2.keymetrics.io/)

**Bot commands**  
*!help*

    Lists all commands and how to use them

*!invite* 

    Replys with your invite link (you will need to enter this directly in the code

*!list*

    Will list all channels followed in your discord server

*!start*

    Starts tracking the provided twitch channel and will post in the discord channel configured
    !start #channelname Ninja

*!stop*

    Stops tracking the provided twitch channel in your server
    !stop Ninja


![](https://pbs.twimg.com/media/D4aV26ZUYAESvOF.jpg:large)
