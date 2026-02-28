import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Loader2, Users, CheckCircle } from 'lucide-react';

const JoinAlbum = () => {
    const { token } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [status, setStatus] = useState('joining');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!user) {
            // Need to logic to redirect to login, then come back. But for simplicity:
            navigate('/login', { state: { returnUrl: `/album/join/${token}` } });
            return;
        }

        const joinAlbumReq = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const res = await axios.post(`/api/albums/join/${token}`, {}, config);
                setStatus('success');
                setMessage('Successfully joined the Album! Redirecting...');
                setTimeout(() => {
                    navigate(`/album/${res.data.album.id}`);
                }, 2000);
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Failed to join the album. The link might be invalid or expired.');
            }
        };

        joinAlbumReq();
    }, [token, user, navigate]);

    return (
        <div className="flex flex-col justify-center items-center h-[70vh] bg-slate-50 dark:bg-slate-900 px-4 text-center">
            {status === 'joining' && (
                <div className="flex flex-col items-center">
                    <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
                    <h2 className="text-2xl font-bold">Joining Album...</h2>
                    <p className="text-slate-500 mt-2">Please wait while we verify your invitation.</p>
                </div>
            )}
            {status === 'success' && (
                <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-500">
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Success!</h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">{message}</p>
                </div>
            )}
            {status === 'error' && (
                <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-500">
                        <Users size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Invite Error</h2>
                    <p className="text-slate-600 dark:text-slate-400 max-w-sm mb-8">{message}</p>
                    <button onClick={() => navigate('/albums')} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium">Go back to your albums</button>
                </div>
            )}
        </div>
    );
};

export default JoinAlbum;
