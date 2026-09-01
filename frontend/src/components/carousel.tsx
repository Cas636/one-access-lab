import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import '../styles/Carousel.css';

interface Video {
    id: string;
    title: string;
    category: string;
    thumbnail: string;
    duration: string;
    description: string;
}

interface VideoCarouselProps {
    title: string;
    videos: Video[];
}

export const VideoCarousel: React.FC<VideoCarouselProps> = ({ title, videos }) => {
    // loop: false evita el "teletransporte" de slides que causaba el salto
    // brusco al reiniciar. dragFree da un desplazamiento más natural.
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: false,
        align: 'start',
        dragFree: true,
        containScroll: 'trimSnaps',
    });
    const navigate = useNavigate();

    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);

    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

    // Sincroniza el estado de los botones con la posición del carrusel
    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setCanScrollPrev(emblaApi.canScrollPrev());
        setCanScrollNext(emblaApi.canScrollNext());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);
        return () => {
            emblaApi.off('select', onSelect);
            emblaApi.off('reInit', onSelect);
        };
    }, [emblaApi, onSelect]);

    function handleCardClick(video: Video) {
        // Determina el content_type correcto para la URL:
        // TMDB devuelve "movie" o "tv" en el campo category
        const type = video.category === 'tv' ? 'tv' : 'movie';
        navigate(`/content/${video.id}?type=${type}`);
    }

    return (
        <div className="carousel-container">
            <h2 className="carousel-title">{title}</h2>

            <div className="embla">
                <button
                    className="embla__arrow embla__arrow--prev"
                    onClick={scrollPrev}
                    disabled={!canScrollPrev}
                    aria-label="Anterior"
                    type="button"
                >
                    ‹
                </button>

                <div className="embla-viewport" ref={emblaRef}>
                    <div className="embla__container">
                        {videos.map((video) => (
                            <div
                                key={video.id}
                                className="card"
                                role="button"
                                tabIndex={0}
                                aria-label={`Ver ${video.title}`}
                                onClick={() => handleCardClick(video)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleCardClick(video);
                                    }
                                }}
                            >
                                <img
                                    src={video.thumbnail}
                                    alt={video.title}
                                    className="card-image"
                                    loading="lazy"
                                    draggable={false}
                                />
                                <div className="card-content">
                                    <span className="card-category">{video.category}</span>
                                    <h3 className="card-video-title">{video.title}</h3>
                                    <p className="card-description">{video.description}</p>
                                    {video.duration && (
                                        <span className="card-duration">Duración: {video.duration}</span>
                                    )}
                                    <span className="card-play-hint">▶ Ver trailer</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    className="embla__arrow embla__arrow--next"
                    onClick={scrollNext}
                    disabled={!canScrollNext}
                    aria-label="Siguiente"
                    type="button"
                >
                    ›
                </button>
            </div>
        </div>
    );
};
