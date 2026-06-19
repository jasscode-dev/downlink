import { useState, useRef, useEffect, useCallback } from 'react';
import { downloadService } from '../services/download.service';
import type { OutputFormat, VideoInfo } from '../../../../packages/shared/types/video';
import { urlSchema } from '../../../../packages/shared/schemas/video.schema';

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

    const isPolling = useRef(false);

    const pollVideoStatus = async (id: string) => {
        if (!isPolling.current) return;

        try {
            const { video } = await downloadService.getVideoStatus(id);

            setProgress(video.progress || 0);

            if (video.status === 'completed') {
                setStatusText('Download concluído!');
                setIsDownloading(false);
                setIsDownloaded(true);
                isPolling.current = false;
                return;
            }

            if (video.status === 'failed') {
                setStatusText('Falha no processamento.');
                setError(video.errorMessage || 'Erro desconhecido ao processar o vídeo.');
                setIsDownloading(false);
                isPolling.current = false;
                return;
            }

            if (video.status === 'downloading') setStatusText('Downloading...');
            else if (video.status === 'converting') setStatusText('Converting...');
            else if (video.status !== 'queued') setStatusText('Processing...');

            if (isPolling.current) {
                setTimeout(() => pollVideoStatus(id), 200);
            }
        } catch (err) {
            console.error('Erro ao consultar status:', err);

            if (isPolling.current) {
                setTimeout(() => pollVideoStatus(id), 2000);
            }
        }
    };

    const startDownload = async (url: string, format: OutputFormat = 'gif') => {
        if (!url || isDownloading) return;

        setIsDownloading(true);
        setIsDownloaded(false);
        setProgress(0);
        setStatusText('Iniciando...');
        setError(null);

        try {
            const { video } = await downloadService.processVideo({ url, outputFormat: format });
            setVideoId(video.id);

            isPolling.current = true;
            pollVideoStatus(video.id);

        } catch (err: any) {
            console.error('Falha ao enviar link:', err);
            setError(err.response?.data?.message || 'Erro de conexão com o servidor.');
            setIsDownloading(false);
            setStatusText('Falha ao iniciar.');
        }
    };

    const resetDownload = useCallback(() => {
        isPolling.current = false;
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
        } catch (err) {
            console.error('Falha ao colar:', err)
        }
    }

    const handleSearch = async () => {
        if (!url) return
        setIsSearching(true)
        try {
            const dataParsed = urlSchema.safeParse(url)
            if (!dataParsed.success) {
                console.log(dataParsed.error?.issues[0].message)
                return
            }
            const info = await downloadService.getVideoInfo(dataParsed.data)
            setPreviewInfo(info)
        } catch (error) {
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
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
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
            isPolling.current = false;
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
