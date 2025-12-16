import { AppConfig, UserSession, showConnect, openContractCall, authenticate } from '@stacks/connect';
import { STACKS_MAINNET } from '@stacks/network';
import { fetchCallReadOnlyFunction, cvToValue, AnchorMode, PostConditionMode, stringUtf8CV } from '@stacks/transactions';
import { useState, useEffect } from 'react';

// King of the Hill Contract
const contractAddress = 'SP2QNSNKR3NRDWNTX0Q7R4T8WGBJ8RE8RA516AKZP';
const contractName = 'centrifuge-king';

interface KingInfo {
  king: string;
  price: number;
  message: string;
}

function App() {
  const [kingInfo, setKingInfo] = useState<KingInfo | null>(null);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isClaiming, setIsClaiming] = useState(false);

  const appConfig = new AppConfig(['store_write', 'publish_data']);
  const session = new UserSession({ appConfig });
  const network = STACKS_MAINNET;

  useEffect(() => {
    if (session.isUserSignedIn()) {
      setUserSession(session);
      fetchKingInfo();
    } else if (session.isSignInPending()) {
      session.handlePendingSignIn().then(() => {
        setUserSession(session);
        fetchKingInfo();
      });
    } else {
      fetchKingInfo(); // Fetch even if not signed in
    }

    // Poll for updates (poor man's real-time until Chainhook is fully integrated via socket)
    const interval = setInterval(fetchKingInfo, 10000);
    return () => clearInterval(interval);
  }, []);

  const connectWallet = () => {
    const authOptions = {
      appDetails: {
        name: 'Centrifuge King',
        icon: window.location.origin + '/vite.svg',
      },
      redirectTo: '/',
      onFinish: () => {
        window.location.reload();
      },
      userSession: session,
    };

    if (typeof showConnect === 'function') {
      showConnect(authOptions);
    } else if (typeof authenticate === 'function') {
      authenticate(authOptions);
    } else {
      alert('Wallet connection library failed to load.');
    }
  };

  const fetchKingInfo = async () => {
    try {
      const result = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-king-info',
        functionArgs: [],
        network: STACKS_MAINNET as any,
        senderAddress: contractAddress,
      });
      
      // result is a tuple: { king: principal, price: uint, message: string-utf8 }
      const value = cvToValue(result);
      // cvToValue for tuple returns a JS object. 
      // Ensure we handle BigInts correctly (Stacks.js returns BigInt for uint)
      
      if (value) {
        setKingInfo({
          king: value.king.value || value.king, // handle different cvToValue structures
          price: Number(value.price.value || value.price),
          message: value.message.value || value.message
        });
      }
    } catch (e) {
      console.error('Error fetching king info:', e);
    }
  };

  const claimCrown = () => {
    if (!userSession?.isUserSignedIn()) return;
    if (!newMessage) {
      alert("Enter a message for your reign!");
      return;
    }
    
    setIsClaiming(true);

    openContractCall({
      network: STACKS_MAINNET as any,
      anchorMode: AnchorMode.Any,
      contractAddress,
      contractName,
      functionName: 'claim-crown',
      functionArgs: [stringUtf8CV(newMessage) as any],
      postConditionMode: PostConditionMode.Allow, // Allow transfer of STX
      onFinish: (data) => {
        console.log('TxId:', data.txId);
        setIsClaiming(false);
        setNewMessage('');
        alert('Transaction broadcasted! You will be King soon.');
      },
      onCancel: () => setIsClaiming(false),
    });
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4">
      <h1 className="text-6xl font-black mb-2 glitch-text tracking-tighter text-center">
        CENTRIFUGE<br/>KING
      </h1>
      <p className="text-neon-blue mb-12 tracking-widest uppercase text-sm">
        Hiro Chainhook Powered • Real-time Stacks
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        
        {/* Current King Card */}
        <div className="cyber-card flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden group">
          <div className="absolute inset-0 bg-neon-blue/5 group-hover:bg-neon-blue/10 transition-all duration-500"></div>
          
          <div className="z-10 text-center">
            <h2 className="text-neon-pink text-xl font-bold mb-4 uppercase tracking-widest">Current Ruler</h2>
            
            {kingInfo ? (
              <>
                <div className="w-24 h-24 bg-gradient-to-br from-neon-blue to-neon-pink rounded-full mx-auto mb-6 p-1 animate-pulse">
                  <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                    <span className="text-4xl">👑</span>
                  </div>
                </div>
                
                <div className="font-mono text-2xl mb-2 text-white">
                  {truncateAddress(kingInfo.king)}
                </div>
                
                <div className="bg-black/40 p-4 rounded-lg border border-neon-blue/30 mb-6 max-w-xs mx-auto">
                  <p className="text-neon-blue italic">"{kingInfo.message}"</p>
                </div>
                
                <div className="text-sm text-gray-400">
                  Current Price: <span className="text-neon-pink font-bold">{(kingInfo.price / 1000000).toFixed(1)} STX</span>
                </div>
              </>
            ) : (
              <p className="animate-pulse">Loading Blockchain Data...</p>
            )}
          </div>
        </div>

        {/* Action Card */}
        <div className="cyber-card flex flex-col justify-between">
          <div>
            <h2 className="text-neon-blue text-xl font-bold mb-6 uppercase tracking-widest">Usurp the Throne</h2>
            
            {!userSession?.isUserSignedIn() ? (
              <div className="h-full flex flex-col items-center justify-center space-y-6">
                <p className="text-gray-400 text-center">Connect your wallet to challenge the current king.</p>
                <button onClick={connectWallet} className="cyber-button w-full">
                  Connect Wallet
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs text-neon-blue mb-2 uppercase">Royal Decree (Message)</label>
                  <input
                    type="text"
                    maxLength={100}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Enter your message..."
                    className="cyber-input"
                  />
                </div>
                
                <div className="bg-neon-pink/10 border border-neon-pink/30 p-4 rounded text-xs text-neon-pink">
                  ⚠ Cost to claim: {(kingInfo ? (kingInfo.price / 1000000).toFixed(1) : '...')} STX
                  <br/>
                  (Paid directly to the previous King)
                </div>

                <button 
                  onClick={claimCrown} 
                  disabled={isClaiming || !kingInfo}
                  className="cyber-button-pink w-full relative overflow-hidden"
                >
                  {isClaiming ? 'Broadcasting...' : 'CLAIM CROWN'}
                </button>
                
                <div className="text-center pt-4 border-t border-white/10">
                  <p className="text-xs text-gray-500 mb-2">Signed in as {truncateAddress(userSession.loadUserData().profile.stxAddress.mainnet)}</p>
                  <button 
                    onClick={() => {
                      session.signUserOut();
                      setUserSession(null);
                    }}
                    className="text-xs text-red-400 hover:text-red-300 underline"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-12 w-full max-w-4xl">
        <h3 className="text-neon-blue text-sm uppercase tracking-widest mb-4 border-b border-neon-blue/30 pb-2">Live Chainhook Events</h3>
        <div className="bg-black/80 border border-white/10 rounded h-32 p-4 font-mono text-xs text-green-400 overflow-y-auto">
          <p>&gt; Listening for 'claim-crown' events on {contractAddress}...</p>
          <p>&gt; Connection established.</p>
          {/* Real-time logs would go here */}
        </div>
      </div>
    </div>
  );
}

export default App;
