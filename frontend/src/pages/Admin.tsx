import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFusionAuth } from '@fusionauth/react-sdk';
import { useUser } from '../context/UserContext';
import '../styles/Admin.css';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface Stats {
    totals: {
        total_views: number;
        unique_users: number;
        unique_titles: number;
    };
    by_type: {
        movie: number;
        tv: number;
    };
    top_titles: { title: string; views: number }[];
    views_by_day: { date: string; views: number }[];
}

interface WatchRecord {
    id: number;
    user_id: string;
    content_id: string;
    content_type: string;
    title: string;
    watched_at: string;
}

interface HistoryResponse {
    total: number;
    offset: number;
    limit: number;
    data: WatchRecord[];
}

type LoadState = 'loading' | 'ready' | 'error-403' | 'error';

const PAGE_SIZE = 10;

// ---------------------------------------------------------------------------
// Utilidades de formato
// ---------------------------------------------------------------------------

function formatDateTime(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatDayLabel(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export default function Admin() {
    const navigate = useNavigate();
    const { isLoggedIn, isFetchingUserInfo } = useFusionAuth();
    const { isAdmin, loading: userLoading } = useUser();

    const [stats, setStats] = useState<Stats | null>(null);
    const [history, setHistory] = useState<HistoryResponse | null>(null);
    const [page, setPage] = useState(0);
    const [state, setState] = useState<LoadState>('loading');

    const backend = import.meta.env.VITE_BACKEND_URL;

    // -----------------------------------------------------------------------
    // Carga de estadísticas (una vez)
    // -----------------------------------------------------------------------
    async function fetchStats() {
        const res = await fetch(`${backend}/api/admin/stats?days=7`, {
            credentials: 'include',
            headers: { Accept: 'application/json' },
        });
        if (res.status === 403) { setState('error-403'); return null; }
        if (!res.ok) { setState('error'); return null; }
        return (await res.json()) as Stats;
    }

    // -----------------------------------------------------------------------
    // Carga del historial (paginado)
    // -----------------------------------------------------------------------
    async function fetchHistory(currentPage: number) {
        const offset = currentPage * PAGE_SIZE;
        const res = await fetch(
            `${backend}/api/admin/watch-history?limit=${PAGE_SIZE}&offset=${offset}`,
            {
                credentials: 'include',
                headers: { Accept: 'application/json' },
            }
        );
        if (res.status === 403) { setState('error-403'); return null; }
        if (!res.ok) { setState('error'); return null; }
        return (await res.json()) as HistoryResponse;
    }

    // -----------------------------------------------------------------------
    // Carga inicial
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (isFetchingUserInfo || userLoading) return;
        if (!isLoggedIn) { navigate('/'); return; }

        (async () => {
            setState('loading');
            const [s, h] = await Promise.all([fetchStats(), fetchHistory(0)]);
            if (s && h) {
                setStats(s);
                setHistory(h);
                setPage(0);
                setState('ready');
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn, isFetchingUserInfo, userLoading]);

    // -----------------------------------------------------------------------
    // Cambio de página del historial
    // -----------------------------------------------------------------------
    async function goToPage(newPage: number) {
        const h = await fetchHistory(newPage);
        if (h) {
            setHistory(h);
            setPage(newPage);
        }
    }

    // -----------------------------------------------------------------------
    // Render de estados
    // -----------------------------------------------------------------------
    if (isFetchingUserInfo || userLoading || state === 'loading') {
        return (
            <div className="admin-status">
                <div className="admin-spinner" />
                <p>Cargando panel de administración...</p>
            </div>
        );
    }

    // Bloqueo cliente por rol (el backend también valida)
    if (state === 'error-403' || !isAdmin) {
        return (
            <div className="admin-status">
                <p className="admin-status__title admin-status__denied">Acceso restringido</p>
                <p className="admin-status__msg">
                    Esta sección es solo para administradores.
                </p>
                <button className="button headerButton" onClick={() => navigate('/content')}>
                    ← Volver al catálogo
                </button>
            </div>
        );
    }

    if (state === 'error' || !stats || !history) {
        return (
            <div className="admin-status">
                <p className="admin-status__title">No se pudieron cargar los datos</p>
                <button className="button headerButton" onClick={() => navigate('/content')}>
                    ← Volver al catálogo
                </button>
            </div>
        );
    }

    // -----------------------------------------------------------------------
    // Cálculos para los gráficos
    // -----------------------------------------------------------------------
    const maxDayViews = Math.max(1, ...stats.views_by_day.map((d) => d.views));
    const maxTitleViews = Math.max(1, ...stats.top_titles.map((t) => t.views));
    const typeTotal = Math.max(1, stats.by_type.movie + stats.by_type.tv);
    const moviePct = Math.round((stats.by_type.movie / typeTotal) * 100);
    const tvPct = 100 - moviePct;

    const totalPages = Math.max(1, Math.ceil(history.total / PAGE_SIZE));

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1 className="admin-title">Panel de administración</h1>
                <p className="admin-subtitle">Estadísticas de reproducción de contenido</p>
            </div>

            {/* KPIs */}
            <section className="admin-kpis">
                <div className="kpi-card">
                    <span className="kpi-value">{stats.totals.total_views}</span>
                    <span className="kpi-label">Vistas totales</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-value">{stats.totals.unique_users}</span>
                    <span className="kpi-label">Usuarios únicos</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-value">{stats.totals.unique_titles}</span>
                    <span className="kpi-label">Títulos vistos</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-value">
                        {stats.by_type.movie}<span className="kpi-sep">/</span>{stats.by_type.tv}
                    </span>
                    <span className="kpi-label">Películas / Series</span>
                </div>
            </section>

            <div className="admin-grid">
                {/* Vistas por día */}
                <section className="admin-panel">
                    <h2 className="panel-title">Vistas en los últimos 7 días</h2>
                    <div className="bar-chart">
                        {stats.views_by_day.map((d) => (
                            <div className="bar-chart__col" key={d.date}>
                                <div className="bar-chart__bar-wrapper">
                                    <span className="bar-chart__count">{d.views}</span>
                                    <div
                                        className="bar-chart__bar"
                                        style={{ height: `${(d.views / maxDayViews) * 100}%` }}
                                        title={`${d.views} vistas`}
                                    />
                                </div>
                                <span className="bar-chart__label">{formatDayLabel(d.date)}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Split por tipo */}
                <section className="admin-panel">
                    <h2 className="panel-title">Distribución por tipo</h2>
                    <div className="split-bar">
                        <div className="split-bar__track">
                            <div
                                className="split-bar__segment split-bar__segment--movie"
                                style={{ width: `${moviePct}%` }}
                            />
                            <div
                                className="split-bar__segment split-bar__segment--tv"
                                style={{ width: `${tvPct}%` }}
                            />
                        </div>
                        <div className="split-legend">
                            <span className="split-legend__item">
                                <span className="split-dot split-dot--movie" />
                                Películas — {stats.by_type.movie} ({moviePct}%)
                            </span>
                            <span className="split-legend__item">
                                <span className="split-dot split-dot--tv" />
                                Series — {stats.by_type.tv} ({tvPct}%)
                            </span>
                        </div>
                    </div>
                </section>
            </div>

            {/* Top títulos */}
            <section className="admin-panel">
                <h2 className="panel-title">Top 10 títulos más vistos</h2>
                {stats.top_titles.length === 0 ? (
                    <p className="admin-empty">Aún no hay vistas registradas.</p>
                ) : (
                    <div className="ranking">
                        {stats.top_titles.map((t, i) => (
                            <div className="ranking__row" key={`${t.title}-${i}`}>
                                <span className="ranking__pos">{i + 1}</span>
                                <span className="ranking__name" title={t.title}>{t.title}</span>
                                <div className="ranking__bar-track">
                                    <div
                                        className="ranking__bar"
                                        style={{ width: `${(t.views / maxTitleViews) * 100}%` }}
                                    />
                                </div>
                                <span className="ranking__views">{t.views}</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Historial */}
            <section className="admin-panel">
                <h2 className="panel-title">Historial de reproducciones</h2>
                {history.data.length === 0 ? (
                    <p className="admin-empty">No hay registros de reproducción.</p>
                ) : (
                    <>
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Título</th>
                                        <th>Tipo</th>
                                        <th>Usuario</th>
                                        <th>Fecha</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.data.map((r) => (
                                        <tr key={r.id}>
                                            <td>{r.title}</td>
                                            <td>
                                                <span className={`type-pill type-pill--${r.content_type}`}>
                                                    {r.content_type === 'movie' ? 'Película' : 'Serie'}
                                                </span>
                                            </td>
                                            <td className="admin-table__user" title={r.user_id}>
                                                {r.user_id.slice(0, 8)}…
                                            </td>
                                            <td>{formatDateTime(r.watched_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="admin-pagination">
                            <button
                                className="button headerButton"
                                disabled={page === 0}
                                onClick={() => goToPage(page - 1)}
                            >
                                ← Anterior
                            </button>
                            <span className="admin-pagination__info">
                                Página {page + 1} de {totalPages}
                            </span>
                            <button
                                className="button headerButton"
                                disabled={page + 1 >= totalPages}
                                onClick={() => goToPage(page + 1)}
                            >
                                Siguiente →
                            </button>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
