import { useState, useRef, useEffect, useCallback } from 'react';
import { downloadService } from '../services/download.service';
import type { OutputFormat } from '../../../../packages/shared/types/video';

export function useDownload() {
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

    useEffect(() => {
        return () => {
            isPolling.current = false;
        };
    }, []);

    return {
        isDownloading,
        isDownloaded,
        progress,
        statusText,
        error,
        videoId,
        startDownload,
        resetDownload
    };
}
