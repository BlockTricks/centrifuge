# Centrifuge

Centrifuge is a full-stack Stacks application that demonstrates how to use [Hiro Chainhooks](https://docs.hiro.so/stacks/chainhook) to build event-driven dApps. It includes a Clarity smart contract, a React frontend, and an Express backend listener.

## Features

- **Smart Contract**: A simple counter contract written in Clarity (`contracts/contracts/counter.clar`).
- **Frontend**: A React + Vite app (`frontend/`) that lets users increment/decrement the counter.
- **Backend Listener**: An Express server (`backend/`) that uses Chainhooks to react to contract events in real-time.
- **Reorg Aware**: Automatically handles chain reorganizations.

## Prerequisites

- Node.js (v18 or higher)
- [Clarinet](https://github.com/hirosystems/clarinet) (for contract development)
- [Hiro Wallet](https://wallet.hiro.so/) extension installed in your browser.
- **Mainnet Deployment**: You need a Stacks wallet with STX for transaction fees.

## Project Structure

- `backend/`: The Chainhook listener (Express server).
- `contracts/`: Clarity smart contracts and Clarinet configuration.
- `frontend/`: React frontend application.

## Getting Started

### 1. Backend (Listener)

Navigate to the `backend` directory and start the server:

```bash
cd backend
npm install
npm start
```

The server will listen on `http://localhost:3000`.

### 2. Frontend (UI)

Open a new terminal, navigate to the `frontend` directory, and start the app:

```bash
cd frontend
npm install
npm run dev
```

Open your browser to `http://localhost:5173`. You can connect your wallet and interact with the counter.

### 3. Smart Contracts

To work with the contracts locally:

```bash
cd contracts
clarinet check
clarinet console
```

### 4. Connecting the Pieces

To see the Chainhook in action:

1.  **Deploy**: Deploy the `counter` contract to Testnet (or use the provided testnet address in `frontend/src/App.tsx`).
2.  **Configure**: Update `backend/chainhook.json` with your contract address if you deployed your own.
3.  **Run Chainhook**:
    *   **Locally**: If you have `chainhook` CLI installed:
        ```bash
        cd backend
        chainhook predicates scan chainhook.json --testnet
        ```
    *   **Cloud**: Deploy the backend and register the hook on [Hiro Platform](https://platform.hiro.so).

## Mainnet Deployment

To deploy the contract to the Stacks Mainnet:

1.  **Prepare your Wallet**: Ensure you have a 12 or 24-word secret phrase (mnemonic) for a wallet that holds STX.
2.  **Generate Deployment Plan**:
    Run the following command in the `contracts/` directory, replacing the mnemonic with your own:

    ```bash
    cd contracts
    MNEMONIC="your 12 or 24 word seed phrase here" clarinet deployments generate --mainnet
    ```

    *Note: This generates a `default.mainnet-plan.yaml` file.*

3.  **Deploy**:
    Execute the deployment plan:

    ```bash
    MNEMONIC="your 12 or 24 word seed phrase here" clarinet deployments apply --deployment-plan-path deployments/default.mainnet-plan.yaml
    ```

    *Warning: This will cost real STX.*

4.  **Verify**: Check the explorer link provided in the output to confirm the contract is deployed.

## License

[ISC](LICENSE)
