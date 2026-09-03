import { useMemo } from 'react';
import type { PlayerConfig, SourceConfig } from 'bitmovin-player';
import { BitmovinPlayer } from 'bitmovin-player-react';

interface Stream {
    hls?: string;
    dash?: string;
}

interface BitmovinVideoPlayerProps {
    stream?: Stream | null;
    title: string;
    poster?: string;
}

/**
 * Reproductor de video basado en Bitmovin Player (enfoque package-based).
 * El paquete `bitmovin-player-react` gestiona el ciclo de vida del player
 * (creación y destrucción) automáticamente al montar/desmontar el componente.
 */
export default function BitmovinVideoPlayer({ stream, title, poster }: BitmovinVideoPlayerProps) {

    // La clave del player se lee de las variables de entorno de Vite.
    const playerKey = import.meta.env.VITE_BITMOVIN_KEY as string | undefined;

    // Accesos seguros por si el backend no envía el campo stream
    const hls = stream?.hls;
    const dash = stream?.dash;

    const source: SourceConfig = useMemo(() => {
        const src: SourceConfig = { title };
        if (hls) src.hls = hls;
        if (dash) src.dash = dash;
        if (poster) src.poster = poster;
        return src;
    }, [hls, dash, title, poster]);

    const config: PlayerConfig = useMemo(() => ({
        key: playerKey ?? '',
        playback: {
            // Arranca reproduciendo con sonido
            muted: false,
            autoplay: true,
        },
    }), [playerKey]);

    if (!playerKey) {
        return (
            <div className="watch-player__no-trailer">
                <span>⚠️</span>
                <span>Falta configurar VITE_BITMOVIN_KEY</span>
            </div>
        );
    }

    if (!hls && !dash) {
        return (
            <div className="watch-player__no-trailer">
                <span>🎬</span>
                <span>Contenido no disponible</span>
            </div>
        );
    }

    return (
        <div className="watch-player__frame-wrapper">
            <div className="watch-player__bitmovin">
                <BitmovinPlayer source={source} config={config} />
            </div>
        </div>
    );
}
