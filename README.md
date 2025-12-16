# Centrifuge

Centrifuge is a high-performance Stacks application leveraging [Hiro Chainhooks](https://docs.hiro.so/stacks/chainhook) to monitor and react to on-chain events in real-time. Built for developers who need instant, reliable triggers from the Stacks blockchain, Centrifuge serves as a robust foundation for event-driven dApps.

## Features

- **Real-time Monitoring**: React to smart contract calls, STX transfers, and other events as they happen.
- **Reorg Aware**: Automatically handles chain reorganizations with `apply` and `rollback` logic.
- **Type-Safe**: Built with TypeScript for reliable event handling.
- **Easy Integration**: Simple Express.js server ready to be deployed or extended.

## Prerequisites

- Node.js (v18 or higher)
- [Chainhook CLI](https://github.com/hirosystems/chainhook) (optional, for local testing)
- A [Hiro Platform](https://platform.hiro.so) account (for cloud deployment)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Gbangbolaoluwagbemiga/centrifuge.git
   cd centrifuge
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### 1. Configure the Chainhook

Edit `chainhook.json` to specify the events you want to monitor. The default configuration monitors a `simple-counter` contract on Testnet.

```json
{
  "name": "centrifuge-hook",
  "chain": "stacks",
  "networks": {
    "testnet": {
      "if_this": {
        "scope": "contract_call",
        "contract_identifier": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.simple-counter",
        "method": "increment"
      },
      "then_that": {
        "http_post": {
          "url": "http://localhost:3000/api/webhook",
          "authorization_header": "Bearer secret-token"
        }
      }
    }
  }
}
```

### 2. Start the Server

Start the local server to listen for events:

```bash
npm start
```

The server will start at `http://localhost:3000` and listen for POST requests at `/api/webhook`.

### 3. Register the Chainhook

#### Option A: Using Chainhook CLI (Local)

If you have the `chainhook` CLI installed, you can scan the chain locally:

```bash
chainhook predicates scan chainhook.json --testnet
```

#### Option B: Using Hiro Platform (Cloud)

1. Log in to [Hiro Platform](https://platform.hiro.so).
2. Create a new Chainhook.
3. Upload `chainhook.json` or configure the predicate manually.
4. Set the "Then That" URL to your deployed server URL (e.g., using ngrok for local dev: `https://<your-ngrok-id>.ngrok.io/api/webhook`).

## Project Structure

- `src/index.ts`: Main entry point. Sets up the Express server and handles webhook events.
- `src/types.ts`: TypeScript definitions for the Chainhook payload.
- `chainhook.json`: Configuration file for the Chainhook predicate.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[ISC](LICENSE)
