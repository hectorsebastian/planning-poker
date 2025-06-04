# Planning Poker App

A real-time Planning Poker application for agile teams to collaboratively estimate story points.

## Features

- Real-time voting with WebSocket (Socket.IO)
- Room-based sessions (multiple teams can use different rooms)
- Shareable room links
- Synchronized vote reveals
- Voting statistics and consensus calculation
- Mobile-responsive design

## Technologies

- Node.js
- Express
- Socket.IO
- HTML5/CSS3
- JavaScript (ES6+)

## Live Demo

[View the app on Render](https://planning-poker-app.onrender.com) (replace with your Render URL once deployed)

## Installation and Local Development

1. Clone the repository
```
git clone https://github.com/yourusername/planning-poker.git
cd planning-poker
```

2. Install dependencies
```
npm install
```

3. Start the development server
```
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Deployment to Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Use the following settings:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or choose an appropriate plan)

4. Set any required environment variables:
   - `PORT`: This will be set automatically by Render
   - `NODE_ENV`: production

5. Click "Create Web Service"

Render will automatically deploy your application and provide a URL where it can be accessed.

## How to Use

1. Open the application in your browser
2. Enter your name and a room ID (or use a shared link)
3. Click "Join Session"
4. Select a card to vote
5. Use the "Reveal Votes" button to show all votes
6. Use the "Reset Votes" button to start a new round

## License

MIT

## Author

Your Name

