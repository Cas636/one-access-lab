import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import './carousel.css'; // Importación del archivo CSS

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
    const [emblaRef] = useEmblaCarousel({ loop: true, align: 'start' });

    return (
        <div className="carousel-container">
            <h2 className="carousel-title">{title}</h2>
            
            <div ref={emblaRef} className="embla-viewport">
                <div className="embla-container">
                    {videos.map((video) => (
                        <div key={video.id} className="card">
                            <img 
                                src={video.thumbnail} 
                                alt={video.title} 
                                className="card-image" 
                            />
                            <div className="card-content">
                                <span className="card-category">{video.category}</span>
                                <h3 className="card-video-title">{video.title}</h3>
                                <p className="card-description">{video.description}</p>
                                <span className="card-duration">Duración: {video.duration}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
