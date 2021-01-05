# Planning Poker
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/bc4ede09cfb34695993224552e1cb2af)](https://www.codacy.com/app/ProPanek/PlanningPoker?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=ProPanek/PlanningPoker&amp;utm_campaign=Badge_Grade)
[![dependencies Status](https://david-dm.org/ProPanek/PlanningPoker/status.svg)](https://david-dm.org/ProPanek/PlanningPoker)
[![devDependencies Status](https://david-dm.org/ProPanek/PlanningPoker/dev-status.svg)](https://david-dm.org/ProPanek/PlanningPoker?type=dev)

Let's make your planning session go online!

## Getting Started

If you want to start project locally follow the instructions below.

### Prerequisites

```
node.js ^8.*.*

npm or yarn as package manager
```

### Installing

First install packages in root folder of the project.

```
yarn install
```

Then go to `/client` folder and repeat

```
cd client/
yarn install 
```

Next you need to go to the `package.json` in your `/client` and change or add line to

```
"proxy": "http://localhost:5000",
```

This allow our `create-react-app` application to know where our api is running (which port and domain if you have server on different machine).
After you finish just type in `root` folder

```
yarn dev
```

And that's it!

## Testing

```
jest, enzyme, sinon
```

To test type

`yarn test`

## Deployment

After you deploy this program into some kind of hosting you need to remember to change `proxy` in our `package.json` in `/client/package.json` to

```
"proxy": "yourdomain",
```

## Built With

*   [create-react-app](https://github.com/facebook/create-react-app) - client side
*   [node.js](https://github.com/nodejs) - server
*   [socket.io](https://github.com/socketio/socket.io) - WebSockets

## Authors

*   **Sebastian Ogarek** - *Main work* - [ProPanek](https://github.com/ProPanek)

See also the list of [contributors](https://github.com/ProPanek/PlanningPoker/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](https://github.com/ProPanek/PlanningPoker/blob/master/LICENSE) file for details
