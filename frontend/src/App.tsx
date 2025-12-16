import { AppConfig, UserSession, showConnect, openContractCall } from '@stacks/connect';
import { STACKS_MAINNET } from '@stacks/network';
import { fetchCallReadOnlyFunction, cvToValue, AnchorMode, PostConditionMode } from '@stacks/transactions';
import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState<number>(0);
  const [userSession, setUserSession] = useState<UserSession | null>(null);

  const appConfig = new AppConfig(['store_write', 'publish_data']);
  const session = new UserSession({ appConfig });
  const network = STACKS_MAINNET;

  // Contract details
  const contractAddress = 'SP2QNSNKR3NRDWNTX0Q7R4T8WGBJ8RE8RA516AKZP';
  const contractName = 'centrifuge-counter';

  useEffect(() => {
    if (session.isUserSignedIn()) {
      setUserSession(session);
      fetchCount();
    } else if (session.isSignInPending()) {
      session.handlePendingSignIn().then((userData) => {
        setUserSession(session);
        fetchCount();
      });
    }
  }, []);

  const connectWallet = () => {
    showConnect({
      appDetails: {
        name: 'Centrifuge Counter',
        icon: window.location.origin + '/vite.svg',
      },
      redirectTo: '/',
      onFinish: () => {
        window.location.reload();
      },
      userSession: session,
    });
  };

  const fetchCount = async () => {
    try {
      const result = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-count',
        functionArgs: [],
        network,
        senderAddress: contractAddress, // Using contract address as sender for read-only
      });
      setCount(Number(cvToValue(result)));
    } catch (e) {
      console.error('Error fetching count:', e);
    }
  };

  const executeAction = (action: 'increment' | 'decrement') => {
    if (!userSession?.isUserSignedIn()) return;
    
    openContractCall({
      network,
      anchorMode: AnchorMode.Any,
      contractAddress,
      contractName,
      functionName: action,
      functionArgs: [],
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        console.log('TxId:', data.txId);
      },
    });
  };

  return (
    <div className="card">
      <h1>Centrifuge Counter</h1>
      
      {!userSession?.isUserSignedIn() ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <p>Current Count: {count}</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={() => executeAction('increment')}>Increment (+)</button>
            <button onClick={() => executeAction('decrement')}>Decrement (-)</button>
          </div>
          <p style={{ marginTop: '20px', fontSize: '0.8em' }}>
            Signed in as: {userSession.loadUserData().profile.stxAddress.mainnet}
          </p>
          <button onClick={() => {
            session.signUserOut();
            setUserSession(null);
          }}>Sign Out</button>
        </div>
      )}
    </div>
  );
}

export default App;
