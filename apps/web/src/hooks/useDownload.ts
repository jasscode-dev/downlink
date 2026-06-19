import { useState, useRef, useEffect, useCallback } from 'react';
import { downloadService } from '../services/download.service';
import type { OutputFormat } from '../../../../packages/shared/types/job';

export function useDownload() {
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDownloaded, setIsDownloaded] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [jobId, setJobId] = useState<string | null>(null);

    // Usamos um ref para saber se o polling ainda deve estar rodando
    // Isso evita que respostas antigas atualizem a tela se o usuário cancelar
    const isPolling = useRef(false);

    // Função recursiva de polling (melhor que setInterval pois evita encavalar requisições)
    const pollJobStatus = async (id: string) => {
        if (!isPolling.current) return;

        try {
            const { job } = await downloadService.getJobStatus(id);


            setProgress(job.progress || 0);

            // Tratamento para sucesso
            if (job.status === 'completed') {
                setStatusText('Download concluído!');
                setIsDownloading(false);
                setIsDownloaded(true);
                isPolling.current = false;
                return; // Sai do loop de polling
            }

            // Tratamento para erro
            if (job.status === 'failed') {
                setStatusText('Falha no processamento.');
                setError(job.errorMessage || 'Erro desconhecido ao processar o vídeo.');
                setIsDownloading(false);
                isPolling.current = false;
                return;
            }


            if (job.status === 'downloading') setStatusText('Downloading...');
            else if (job.status === 'converting') setStatusText('Converting...');
            else if (job.status !== 'queued') setStatusText('Processing...');


            if (isPolling.current) {
                setTimeout(() => pollJobStatus(id), 200);
            }
        } catch (err) {
            console.error('Erro ao consultar status:', err);

            if (isPolling.current) {
                setTimeout(() => pollJobStatus(id), 2000);
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
            // 1. Cria o Job na API
            const { job } = await downloadService.createJob({ url, outputFormat: format });
            setJobId(job.id);

            // 2. Inicia o Polling de status
            isPolling.current = true;
            pollJobStatus(job.id);

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
        setJobId(null);
        setError(null);
    }, []);

    // Segurança: Para o polling se o componente for desmontado da tela
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
        jobId,
        startDownload,
        resetDownload
    };
}
