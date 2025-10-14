// C:\Desktop\pollGen IIT ROPAR\PollGen-main\apps\frontend\src\components\student\JoinPollPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Hash, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiService } from '../../utils/api'; // Assuming you have a central api service
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import GlassCard from '../GlassCard';

// Define a more specific type for the room information
interface RoomInfo {
    _id: string;
    code: string;
    name: string;
    hostName: string;
    participants: any[]; // Or a more specific Participant[] type
}

const JoinPollPage: React.FC = () => {
    const navigate = useNavigate();
      const location = useLocation(); // Get access to the URL's query parameters

    const { socket, user } = useAuth(); // Get the shared socket from context

    const [roomCode, setRoomCode] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
    const [error, setError] = useState('');
    
    // Check authentication - students need to be logged in to join polls
    useEffect(() => {
        if (!user) {
            toast.error("Please log in first to join polls.");
            navigate('/login?redirect=join-poll');
        }
    }, [user, navigate]);
    
 // --- NEW useEffect TO READ FROM URL ---
  useEffect(() => {
    // This runs once when the page loads
    const params = new URLSearchParams(location.search);
    const codeFromUrl = params.get('code');
    if (codeFromUrl) {
        const formattedCode = formatRoomCode(codeFromUrl);
        setRoomCode(formattedCode);
        if(formattedCode.length === 7){
            validateRoomCode(formattedCode);
        }
    }
  }, [location.search]); // Re-run if the URL query params change
    // --- REAL-TIME VALIDATION AND JOINING LOGIC ---
 // Cleanup effect to reset state if user navigates away
    useEffect(() => {
        return () => {
            setIsJoining(false);
            setIsValidating(false);
        };
    }, []);
    const validateRoomCode = async (code: string) => {
        const cleanedCode = code.replace(/-/, '');
        if (cleanedCode.length !== 6) return; // Only validate full codes

        setIsValidating(true);
        setError('');
        try {
            // First, just validate the room exists and get its info
            const res = await apiService.getRoomByCode(cleanedCode);
            setRoomInfo(res.data);
            setError(''); // Clear previous errors
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid or expired room code.');
            setRoomInfo(null);
        } finally {
            setIsValidating(false);
        }
    };

    //   const handleJoinPoll = () => {
    //     if (!roomInfo || !socket) return;
        
    //     setIsJoining(true);
        
    //     // Use Socket.IO to formally join the room
    //     socket.emit('student-join-room', roomInfo.code, (response: { success?: boolean; error?: string; room?: RoomInfo }) => {
    //         setIsJoining(false); // Stop loading indicator regardless of outcome
    //         if (response.error) {
    //             toast.error(response.error);
    //             setError(response.error);
    //         } else if (response.success && response.room) {
    //             toast.success(`Successfully joined "${response.room.name}"!`);
                
    //             // --- THE FIX ---
    //             // Navigate directly to the poll questions/waiting page for this specific room.
    //             // We pass the full room object as state.
    //             navigate(`/student/poll-questions`, { state: { roomInfo: response.room } });
    //         }
    //     });
    // };

       // --- MODIFIED: This function now uses the global socket ---
    // const handleJoinPoll = () => {
    //     if (!roomInfo) {
    //         toast.error("Please enter a valid room code first.");
    //         return;
    //     }
    //     if (!socket) {
    //         toast.error("Connecting to server... Please try again in a moment.");
    //         return; // Socket might not be connected yet
    //     }
        
    //     setIsJoining(true);
        
    //     // Use the global Socket.IO instance to join the room
    //     socket.emit('student-join-room', roomInfo.code, (response: { success?: boolean; error?: string; room?: RoomInfo }) => {
    //         setIsJoining(false);
    //         if (response.error) {
    //             toast.error(response.error);
    //             setError(response.error);
    //         } else if (response.success && response.room) {
    //             toast.success(`Successfully joined "${response.room.name}"!`);
    //             // Navigate to the poll questions page with the full room object
    //             navigate(`/student/poll-questions`, { state: { roomInfo: response.room } });
    //         }
    //     });
    // };
     const handleJoinPoll = () => {
        console.log('🎯 Join poll clicked');
        console.log('🔌 Socket connected:', socket?.connected);
        console.log('👤 User:', user);
        console.log('🏠 Room info:', roomInfo);
        
        if (!roomInfo) {
            toast.error("Please enter a valid room code first.");
            return;
        }
        
        if (!user) {
            toast.error("Please log in first.");
            return;
        }
        
        // Since the socket connection is failing, let's navigate directly to the poll page
        // The socket will reconnect there and the room joining can be handled in PollQuestionsPage
        if (!socket || !socket.connected) {
            console.log('⚠️ Socket not connected, navigating directly to poll questions page');
            toast.success(`Joining "${roomInfo.name}"...`);
            navigate(`/student/poll-questions`, { state: { roomInfo } });
            return;
        }
        
        setIsJoining(true);
        console.log('📤 Emitting student-join-room with code:', roomInfo.code);
        
        // Add a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            console.log('⏰ Timeout reached - navigating anyway');
            setIsJoining(false);
            toast.success(`Joining "${roomInfo.name}"...`);
            navigate(`/student/poll-questions`, { state: { roomInfo } });
        }, 5000); // 5 second timeout - then navigate anyway
        
        socket.emit('student-join-room', roomInfo.code, (response: { success?: boolean; error?: string; room?: RoomInfo }) => {
            console.log('📥 Received response:', response);
            console.log('📊 Response room details:', response?.room);
            console.log('🆔 Response room ID field:', response?.room?._id);
            clearTimeout(timeoutId);
            setIsJoining(false);
            
            if (response?.error) {
                console.log('❌ Error:', response.error);
                toast.error(response.error);
                setError(response.error);
            } else if (response?.success && response?.room) {
                console.log('✅ Success! Joined room:', response.room);
                console.log('🔍 Room object keys:', Object.keys(response.room));
                console.log('💾 Navigating with updated room info that includes _id:', response.room._id);
                toast.success(`Successfully joined "${response.room.name}"!`);
                navigate(`/student/poll-questions`, { state: { roomInfo: response.room } });
            } else {
                console.log('🤔 Unexpected response format:', response);
                console.log('⚠️ Falling back to original roomInfo without _id');
                // Navigate anyway with the room info we have
                navigate(`/student/poll-questions`, { state: { roomInfo } });
            }
        });
    };
    // --- UTILITY AND EVENT HANDLERS ---
    
    const formatRoomCode = (value: string) => {
        const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (cleaned.length <= 3) return cleaned;
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}`;
    };

    const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatRoomCode(e.target.value);
        setRoomCode(formatted);

        if (formatted.length < 7) {
            // Reset if user is editing the code
            setRoomInfo(null);
            setError('');
        } else {
            // Automatically validate once the code is 6 characters + hyphen
            validateRoomCode(formatted);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && roomInfo && !isJoining) {
            handleJoinPoll();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl w-full mx-auto p-4 sm:p-8"
        >
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
                    <Hash className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Join Poll Session</h1>
                <p className="text-gray-300">Enter the Room Code provided by your host.</p>
            </div>
        
            <GlassCard>
                <div className="p-6 sm:p-8">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-white mb-2">Room Code</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={roomCode}
                                onChange={handleRoomCodeChange}
                                onKeyPress={handleKeyPress}
                                placeholder="e.g., ABC-123"
                                className="w-full px-4 py-3 pl-12 bg-white/5 text-white border border-white/10 rounded-lg focus:ring-2 focus:ring-primary-500/50 text-2xl font-mono tracking-widest placeholder-gray-500 text-center"
                                maxLength={7}
                            />
                            <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            {isValidating && (
                                <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 animate-spin text-blue-400" />
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 flex items-center space-x-2 text-red-400 text-sm p-3 bg-red-500/10 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            <span>{error}</span>
                        </div>
                    )}
                    
                    {roomInfo && (
                        <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-white space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-lg text-green-300">Room Found!</span>
                                <CheckCircle className="w-6 h-6 text-green-400"/>
                            </div>
                            <p><strong className="text-gray-300">Session Name:</strong> {roomInfo.name}</p>
                            <p><strong className="text-gray-300">Host:</strong> {roomInfo.hostName}</p>
                        </motion.div>
                    )}

                    <button
                        onClick={handleJoinPoll}
                        disabled={!roomInfo || isJoining}
                        className={`w-full py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-200 text-white ${
                            roomInfo && !isJoining
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:brightness-110 shadow-lg hover:shadow-purple-500/30"
                                : "bg-white/10 text-gray-400 cursor-not-allowed"
                        }`}
                    >
                        {isJoining ? (
                            <div className="flex items-center justify-center">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Joining Session...
                            </div>
                        ) : (
                            "Join Session"
                        )}
                    </button>
                </div>
            </GlassCard>
        </motion.div>
    );
}

export default JoinPollPage;