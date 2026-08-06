import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFusionAuth } from '@fusionauth/react-sdk';
import { VideoCarousel } from '../components/Carousel';
import '../styles/Home.css';

interface Video {
    id: string;
    title: string;
    category: string;
    thumbnail: string;
    duration: string;
    description: string;
}

export default function Content() {
    const navigate = useNavigate();
    const { isLoggedIn, isFetchingUserInfo } = useFusionAuth();

    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    // Función para obtener la información del usuario y el contenido
    async function getUserInfo() {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/content`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Error al obtener la información del servidor');
            }
             
            const data = await response.json();
            const rawContent = data.content || data; 
            const videosArray = Array.isArray(rawContent) 
                ? rawContent 
                : Object.values(rawContent);

            setVideos(videosArray);
        } catch (error) {
            console.error("Hubo un problema con la petición:", error);
        } finally {
            // Aseguramos que el estado de carga siempre termine, sea exitoso o falle
            setLoading(false);
        }
    }

    useEffect(() => {
        // Esperamos a que FusionAuth termine de validar la sesión antes de redirigir o cargar
        if (isFetchingUserInfo) return;
        if (!isLoggedIn) {navigate("/"); return; }
        getUserInfo();
    }, [isLoggedIn, isFetchingUserInfo, navigate]);

    // Pantallas de carga y validación de sesión
    if (isFetchingUserInfo || loading) {
        return <p style={{ color: '#fff', padding: '20px' }}>Cargando contenido...</p>;
    }

    if (!isLoggedIn) {
        return null;
    }

    const peliculas = videos.filter(v => v.category === 'movie');
    const series = videos.filter(v => v.category === 'tv');

    return (
        <div>
            <div>
                {/* Carrusel de Videojuegos */}
                <VideoCarousel title="Videos Populares" videos={peliculas} />

                {/* Carrusel de Series */}
                <VideoCarousel title="Series del Momento" videos={series} />
            </div>
        </div>
    );
}