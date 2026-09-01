import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useFusionAuth } from '@fusionauth/react-sdk';
import '../styles/Watch.css';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface ContentDetail {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    backdrop: string;
    trailer_key: string | null;
    duration: string;
    genres: string[];
    rating: number;
    content_type: string;
}

type LoadingState = 'loading' | 'success' | 'error-401' | 'error-403' | 'error-generic';

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export default function Watch() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const contentType = searchParams.get('type') ?? 'movie';

    const navigate = useNavigate();
    const { isLoggedIn, isFetchingUserInfo } = useFusionAuth();

    const [detail, setDetail] = useState<ContentDetail | null>(null);
    const [state, setState] = useState<LoadingState>('loading');

    // -----------------------------------------------------------------------
    // Fetch del detalle del contenido
    // -----------------------------------------------------------------------

    async function fetchDetail() {
        setState('loading');
        try {
            const res = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/content/${contentType}/${id}`,
                {
                    credentials: 'include',
                    headers: { Accept: 'application/json' }
                }
            );

            if (res.status === 401) { setState('error-401'); return; }
            if (res.status === 403) { setState('error-403'); return; }
            if (!res.ok) { setState('error-generic'); return; }

            const data: ContentDetail = await res.json();
            setDetail(data);
            setState('success');

            // Registrar vista una vez que tenemos los datos del contenido
            registerWatch(data);

        } catch {
            setState('error-generic');
        }
    }

    // -----------------------------------------------------------------------
    // Registro de vista en backend (fire-and-forget)
    // -----------------------------------------------------------------------

    async function registerWatch(data: ContentDetail) {
        try {
            await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/content/watch`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json'
                    },
                    body: JSON.stringify({
                        content_id: data.id,
                        content_type: data.content_type,
                        title: data.title
                    })
                }
            );
        } catch {
            // No bloqueamos la reproducción si falla el registro
            console.warn('No se pudo registrar la vista');
        }
    }

    // -----------------------------------------------------------------------
    // Efectos
    // -----------------------------------------------------------------------

    useEffect(() => {
        if (isFetchingUserInfo) return;
        if (!isLoggedIn) { navigate('/'); return; }
        if (!id) { navigate('/content'); return; }

        fetchDetail();
    }, [isLoggedIn, isFetchingUserInfo, id, contentType]);

    // -----------------------------------------------------------------------
    // Render — estados de carga y error
    // -----------------------------------------------------------------------

    if (isFetchingUserInfo || state === 'loading') {
        return (
            <div className="watch-loading">
                <div className="watch-loading__spinner" />
                <p className="watch-loading__text">Cargando contenido...</p>
            </div>
        );
    }

    if (state === 'error-403') {
        return (
            <div className="watch-error">
                <p className="watch-error__title watch-error__code-403">Acceso denegado</p>
                <p className="watch-error__message">
                    No tienes permiso para ver este contenido. Contacta al administrador
                    para que te asigne el rol correspondiente.
                </p>
                <button className="button headerButton" onClick={() => navigate('/content')}>
                    ← Volver al catálogo
                </button>
            </div>
        );
    }

    if (state === 'error-401' || state === 'error-generic' || !detail) {
        return (
            <div className="watch-error">
                <p className="watch-error__title">No se pudo cargar el contenido</p>
                <p className="watch-error__message">
                    {state === 'error-401'
                        ? 'Tu sesión expiró. Vuelve a iniciar sesión.'
                        : 'Ocurrió un error al obtener la información. Intenta nuevamente.'}
                </p>
                <button className="button headerButton" onClick={() => navigate('/content')}>
                    ← Volver al catálogo
                </button>
            </div>
        );
    }

    // -----------------------------------------------------------------------
    // Render — vista completa
    // -----------------------------------------------------------------------

    return (
        <div className="watch-page">

            {/* Hero — backdrop de pantalla completa */}
            <div className="watch-hero">
                {detail.backdrop && (
                    <img
                        className="watch-hero__backdrop"
                        src={detail.backdrop}
                        alt={`Fondo de ${detail.title}`}
                    />
                )}

                {/* Botón volver flotante sobre el backdrop */}
                <button
                    className="watch-back-btn"
                    onClick={() => navigate(-1)}
                    aria-label="Volver"
                >
                    ← Volver
                </button>
            </div>

            {/* Contenido principal */}
            <div className="watch-content">
                <div className="watch-layout">

                    {/* Columna izquierda — información */}
                    <div className="watch-info">

                        {/* Poster visible solo en móvil */}
                        {detail.thumbnail && (
                            <img
                                className="watch-info__poster"
                                src={detail.thumbnail}
                                alt={`Poster de ${detail.title}`}
                            />
                        )}

                        <h1 className="watch-info__title">{detail.title}</h1>

                        <div className="watch-info__meta">
                            <span className="watch-info__rating">
                                ★ {detail.rating.toFixed(1)}
                            </span>
                            {detail.duration && (
                                <span className="watch-info__duration">{detail.duration}</span>
                            )}
                        </div>

                        {detail.genres.length > 0 && (
                            <div className="watch-info__genres">
                                {detail.genres.map((genre) => (
                                    <span key={genre} className="watch-info__genre-tag">
                                        {genre}
                                    </span>
                                ))}
                            </div>
                        )}

                        <p className="watch-info__description">{detail.description}</p>
                    </div>

                    {/* Columna derecha — reproductor YouTube */}
                    <div className="watch-player">
                        <span className="watch-player__label">
                            {detail.content_type === 'movie' ? 'Trailer oficial' : 'Trailer'}
                        </span>

                        {detail.trailer_key ? (
                            <div className="watch-player__frame-wrapper">
                                <iframe
                                    className="watch-player__iframe"
                                    src={`https://www.youtube.com/embed/${detail.trailer_key}?rel=0&modestbranding=1`}
                                    title={`Trailer de ${detail.title}`}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        ) : (
                            <div className="watch-player__no-trailer">
                                <span>🎬</span>
                                <span>Trailer no disponible</span>
                            </div>
                        )}
                    </div>

                </div>
            </div>

        </div>
    );
}
