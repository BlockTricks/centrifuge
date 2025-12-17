import { AppConfig, UserSession, showConnect, openContractCall, authenticate } from '@stacks/connect';
import { STACKS_MAINNET } from '@stacks/network';
import { fetchCallReadOnlyFunction, cvToValue, cvToJSON, AnchorMode, PostConditionMode, stringUtf8CV, uintCV } from '@stacks/transactions';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import MatrixBackground from './components/MatrixBackground';

// King of the Hill Contract
const contractAddress = 'SP2QNSNKR3NRDWNTX0Q7R4T8WGBJ8RE8RA516AKZP';
const contractName = 'centrifuge-king-v2';

interface KingInfo {
  king: string;
  price: number;
  message: string;
}

function App() {
  const [kingInfo, setKingInfo] = useState<KingInfo | null>(null);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [newMessage, setNewMessage] = useState<string>('');
  const [bidAmount, setBidAmount] = useState<string>('1.0');
  const [isClaiming, setIsClaiming] = useState(false);
  const [hackText, setHackText] = useState("CENTRIFUGE KING");

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
      fetchKingInfo(); 
    }

    const interval = setInterval(fetchKingInfo, 5000); // Faster polling
    return () => clearInterval(interval);
  }, []);

  // Hacker Text Effect for Title
  useEffect(() => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let iterations = 0;
    const interval = setInterval(() => {
      setHackText(prev => 
        prev.split("")
          .map((letter, index) => {
            if (index < iterations) return "CENTRIFUGE KING"[index];
            return letters[Math.floor(Math.random() * 26)];
          })
          .join("")
      );
      if (iterations >= 15) clearInterval(interval);
      iterations += 1 / 3;
    }, 30);
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

      const json = cvToJSON(result as any);
      console.log('King Info JSON:', json); // Debug log

      let data: any = null;
      
      // Helper to unwrap response/ok layers
      const unwrap = (obj: any): any => {
        if (!obj) return null;
        if (obj.success && obj.value) return unwrap(obj.value);
        if (obj.type === 'success' || obj.type === 'ok') return unwrap(obj.value);
        if (typeof obj.type === 'string' && obj.type.startsWith('(response')) return unwrap(obj.value); // Handle (response ...) wrapper
        return obj;
      };

      data = unwrap(json);

      // If data is wrapped in a tuple type
      if (data && (data.type === 'tuple' || (typeof data.type === 'string' && data.type.startsWith('(tuple'))) && data.value) {
        data = data.value;
      }

      console.log('Unwrapped Data:', data);

      if (data) {
        // Robustly extract values checking for .value wrapper
        const king = data.king?.value ?? data.king;
        const priceRaw = data.price?.value ?? data.price;
        const message = data.message?.value ?? data.message;
        
        if (king) {
          setKingInfo({
            king,
            price: priceRaw !== undefined ? Number(priceRaw) : 0,
            message: message || "No message",
          });
        } else {
           console.error('Missing king property in data:', data);
        }
      } else {
        console.error('Unexpected read-only result shape:', json);
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
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Enter a valid STX amount.");
      return;
    }
    
    setIsClaiming(true);

    // Optimistic confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00ffff', '#ff00ff', '#ffffff']
    });

    const amountMicroSTX = Math.floor(amount * 1_000_000);

    openContractCall({
      network: STACKS_MAINNET as any,
      anchorMode: AnchorMode.Any,
      contractAddress,
      contractName,
      functionName: 'claim-crown',
      functionArgs: [uintCV(amountMicroSTX), stringUtf8CV(newMessage)] as any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        console.log('TxId:', data.txId);
        setIsClaiming(false);
        setNewMessage('');
        
        // MOAR CONFETTI
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const random = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) return clearInterval(interval);
          const particleCount = 50 * (timeLeft / duration);
          confetti({
            particleCount,
            startVelocity: 30,
            spread: 360,
            ticks: 60,
            origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 },
            colors: ['#00ffff', '#ff00ff']
          });
          confetti({
            particleCount,
            startVelocity: 30,
            spread: 360,
            ticks: 60,
            origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 },
            colors: ['#00ffff', '#ff00ff']
          });
        }, 250);

        alert('Transaction broadcasted! The throne awaits.');
      },
      onCancel: () => setIsClaiming(false),
    });
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-white font-mono selection:bg-neon-pink selection:text-black">
      <MatrixBackground />
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-6xl mx-auto p-4 md:p-8">
        
        {/* Header */}
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="mb-12 text-center"
        >
          <h1 className="text-6xl md:text-8xl font-black mb-2 glitch-text tracking-tighter mix-blend-screen">
            {hackText}
          </h1>
          <div className="flex items-center justify-center gap-2 text-neon-blue tracking-widest uppercase text-xs md:text-sm">
            <span className="animate-pulse">●</span> LIVE ON MAINNET
            <span className="mx-2 text-gray-600">|</span>
            HIRO CHAINHOOK POWERED
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          
          {/* Current King Card */}
          <motion.div 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="cyber-card group relative min-h-[500px] flex flex-col items-center justify-center border-2 border-neon-blue/30 bg-black/80 backdrop-blur-md overflow-hidden hover:border-neon-blue transition-colors duration-500"
          >
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-neon-blue"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-neon-blue"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-neon-blue"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-neon-blue"></div>

            <h2 className="text-neon-pink text-2xl font-bold mb-8 uppercase tracking-[0.2em] animate-pulse">
              Current Ruler
            </h2>
            
            {kingInfo ? (
              <div className="flex flex-col items-center w-full z-10">
                <motion.div 
                  animate={{ 
                    rotateY: [0, 360],
                    boxShadow: ["0 0 20px #00ffff", "0 0 50px #ff00ff", "0 0 20px #00ffff"]
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="w-32 h-32 bg-black border-2 border-white rounded-full flex items-center justify-center mb-8 relative"
                >
                  <span className="text-6xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">👑</span>
                </motion.div>
                
                <div className="font-mono text-3xl mb-4 text-white font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-pink">
                  {truncateAddress(kingInfo.king)}
                </div>
                
                <div className="w-full max-w-md bg-white/5 border border-white/10 p-6 rounded-sm mb-8 backdrop-blur-sm relative">
                   <div className="absolute -top-3 left-4 bg-black px-2 text-neon-blue text-xs uppercase">Decree</div>
                   <p className="text-xl text-center font-serif italic text-white/90">"{kingInfo.message}"</p>
                </div>
                
                <div className="flex items-center gap-4 text-sm uppercase tracking-widest text-gray-400">
                  <span>Current Price</span>
                  <div className="h-px w-12 bg-gray-600"></div>
                  <span className="text-neon-pink font-bold text-xl">{(kingInfo.price / 1000000).toFixed(1)} STX</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
                <p className="text-neon-blue animate-pulse">SYNCING WITH STACKS...</p>
              </div>
            )}
            
            {/* Background Grid Animation */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)] pointer-events-none"></div>
          </motion.div>

          {/* Action Card */}
          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col gap-6"
          >
            <div className="cyber-card flex-grow bg-black/80 border border-white/10 p-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2 opacity-50">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
               </div>

              <h2 className="text-neon-blue text-2xl font-bold mb-6 uppercase tracking-widest">Usurp the Throne</h2>
              
              {!userSession?.isUserSignedIn() ? (
                <div className="h-full flex flex-col items-center justify-center space-y-8 py-12">
                  <p className="text-gray-400 text-center max-w-xs">
                    Connect your wallet to challenge the current king and etch your name in the blockchain.
                  </p>
                  <motion.button 
                    whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(0,255,255,0.5)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={connectWallet} 
                    className="cyber-button w-full max-w-xs text-lg"
                  >
                    Connect Wallet
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="relative group">
                    <label className="block text-xs text-neon-blue mb-2 uppercase tracking-widest">Bid Amount (STX)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder="AMOUNT..."
                      className="cyber-input h-14 text-lg bg-black/50 border-neon-blue/50 focus:border-neon-pink focus:shadow-[0_0_15px_rgba(255,0,255,0.3)] transition-all mb-4"
                    />
                    
                    <label className="block text-xs text-neon-blue mb-2 uppercase tracking-widest">Royal Decree (Message)</label>
                    <input
                      type="text"
                      maxLength={100}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="ENTER YOUR MESSAGE..."
                      className="cyber-input h-14 text-lg bg-black/50 border-neon-blue/50 focus:border-neon-pink focus:shadow-[0_0_15px_rgba(255,0,255,0.3)] transition-all"
                    />
                    <div className="absolute right-3 bottom-3 text-xs text-gray-500">
                      {newMessage.length}/100
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-neon-pink/10 to-transparent border-l-4 border-neon-pink p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-neon-pink uppercase">Current Stake to Beat</span>
                      <span className="text-xl font-bold text-white">{(kingInfo ? (kingInfo.price / 1000000).toFixed(1) : '...')} STX</span>
                    </div>
                    <p className="text-[10px] text-gray-400 uppercase leading-relaxed">
                      If Bid &gt; Stake: You become King. Previous King gets 100% refund.<br/>
                      If Bid &le; Stake: You fail. 95% refunded. 5% tribute to King.
                    </p>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(255,0,255,0.1)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={claimCrown} 
                    disabled={isClaiming || !kingInfo}
                    className="cyber-button-pink w-full h-16 text-xl relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isClaiming ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          BROADCASTING...
                        </>
                      ) : (
                        <>
                          CLAIM CROWN <span className="text-2xl">⚔️</span>
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-neon-pink/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  </motion.button>
                  
                  <div className="flex justify-between items-center pt-6 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-400 font-mono">
                        {truncateAddress(userSession.loadUserData().profile.stxAddress.mainnet)}
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        session.signUserOut();
                        setUserSession(null);
                      }}
                      className="text-xs text-red-500 hover:text-red-400 hover:underline uppercase tracking-wider"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Console Log Area */}
            <div className="cyber-card bg-black border border-white/10 p-4 h-48 overflow-hidden flex flex-col relative">
              <div className="absolute top-2 right-2 text-[10px] text-gray-600">SYSTEM.LOG</div>
              <div className="font-mono text-xs text-green-500 overflow-y-auto space-y-1 custom-scrollbar">
                <p className="text-gray-500">&gt; INITIALIZING CENTRIFUGE PROTOCOL v1.0...</p>
                <p className="text-gray-500">&gt; CONNECTING TO MAINNET NODE...</p>
                <p>&gt; CONNECTION ESTABLISHED.</p>
                <p>&gt; LISTENING FOR 'claim-crown' EVENTS ON {truncateAddress(contractAddress)}</p>
                {kingInfo && (
                  <>
                    <p className="text-neon-blue">&gt; DATA RECEIVED: BLOCK {Math.floor(Date.now() / 10000)}</p>
                    <p>&gt; CURRENT KING: {kingInfo.king}</p>
                    <p>&gt; CURRENT PRICE: {kingInfo.price} microSTX</p>
                  </>
                )}
                <motion.p 
                  animate={{ opacity: [0, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                  className="text-neon-pink"
                >
                  &gt; _
                </motion.p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default App;
