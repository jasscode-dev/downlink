import { useState, useRef, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { downloadService } from '../services/download.service';
import type { OutputFormat, VideoInfo } from '../../../../packages/shared/types/video';
import { urlSchema } from '../../../../packages/shared/schemas/video.schema';
import toast from 'react-hot-toast';

export function useDownload() {
    const [url, setUrl] = useState('');
    const [format, setFormat] = useState<OutputFormat>('mp4');
    const [previewInfo, setPreviewInfo] = useState<VideoInfo | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDownloaded, setIsDownloaded] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [videoId, setVideoId] = useState<string | null>(null);

    const socketRef = useRef<Socket | null>(null);

    const connectSocket = (id: string) => {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';


        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        const socket = io(baseUrl);
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Conectado ao WebSocket:', socket.id);
            socket.emit('join', id);
        });

        socket.on('video-progress', (data: { progress: number, status?: string }) => {
            setProgress(data.progress);
            console.log(data);

            let statusDisplay = 'Processing';
            if (data.status === 'downloading') statusDisplay = 'Downloading';
            if (data.status === 'converting') statusDisplay = 'Converting';

            setStatusText(`${statusDisplay}...`);
        });

        socket.on('video-completed', () => {

            setProgress(100);
            setStatusText('Download concluído!');
            setIsDownloading(false);
            setIsDownloaded(true);
            toast.success('Pronto para salvar!');
            socket.disconnect();
            socketRef.current = null;
        });

        socket.on('video-failed', (data: { error?: string }) => {

            setStatusText('Falha no processamento.');
            const errMsg = data.error || 'Erro desconhecido ao processar o vídeo.';
            setError(errMsg);
            toast.error(errMsg);
            setIsDownloading(false);
            socket.disconnect();
            socketRef.current = null;
        });
    };

    const startDownload = async (url: string, format: OutputFormat = 'gif') => {
        if (!url || isDownloading) return;

        setIsDownloading(true);
        setIsDownloaded(false);
        setProgress(0);
        setStatusText('Processing...');
        setError(null);

        try {
            const { video } = await downloadService.processVideo({ url, outputFormat: format });
            setVideoId(video.id);


            connectSocket(video.id);

        } catch (err: any) {
            console.error('Falha ao enviar link:', err);
            const errMsg = err.response?.data?.message || 'Erro de conexão com o servidor.';
            setError(errMsg);
            toast.error(errMsg);
            setIsDownloading(false);
            setStatusText('Falha ao iniciar.');
        }
    };

    const resetDownload = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        setIsDownloaded(false);
        setIsDownloading(false);
        setProgress(0);
        setStatusText('');
        setVideoId(null);
        setError(null);
    }, []);

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText()
            setUrl(text)
            toast.success('Link colado!')
        } catch (err) {
            console.error('Falha ao colar:', err)
            toast.error('Falha ao acessar a área de transferência')
        }
    }

    const handleSearch = async () => {
        if (!url) return
        setIsSearching(true)
        try {
            const dataParsed = urlSchema.safeParse(url)
            if (!dataParsed.success) {
                const msg = dataParsed.error?.issues[0].message || 'URL Inválida';
                toast.error(msg)
                return
            }
            const info = await downloadService.getVideoInfo(dataParsed.data)
            setPreviewInfo(info)
        } catch (error) {
            toast.error('Erro ao buscar informações do vídeo')
        } finally {
            setIsSearching(false)
        }
    }

    const handleCancelSearch = () => {
        setPreviewInfo(null)
        setUrl('')
    }

    const handleDownload = () => {
        startDownload(url, format)
    }

    const handleSave = () => {
        if (videoId) {
            const a = document.createElement('a')
            const baseUrl = import.meta.env.VITE_API_URL
            a.href = `${baseUrl}/api/videos/${videoId}/download`
            a.download = ''
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
        }

        setTimeout(() => {
            setPreviewInfo(null)
            resetDownload()
            setUrl('')
        }, 100)
    }

    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    return {
        url, setUrl,
        format, setFormat,
        previewInfo, setPreviewInfo,
        isSearching, setIsSearching,
        isDownloading,
        isDownloaded,
        progress,
        statusText,
        error,
        videoId,
        handlePaste,
        handleSearch,
        handleCancelSearch,
        handleDownload,
        handleSave,
        startDownload,
        resetDownload
    };
}
